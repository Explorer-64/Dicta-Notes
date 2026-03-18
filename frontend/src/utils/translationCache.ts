import brain from 'brain';
import { firestore } from 'app';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { sha256 } from './hashUtils';
import { useCurrentUser } from 'app';

// Constants for cache management
// No time-based expiration - translations only expire when content changes
const CACHE_MAX_ENTRIES_PER_LANGUAGE = 200; // Increased from 100
const CACHE_CLEANUP_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
const CACHE_CLEANUP_PROBABILITY = 0.1; // 10% chance of cleanup on each cache write
const CACHE_MAX_ENTRIES = 1000; // Maximum total cache entries
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Track the last cleanup time
let lastCleanupTimestamp = 0;

// Cache metrics
interface CacheMetrics {
  hits: number;
  misses: number;
  apiCalls: number;
  savedApiCalls: number;
}

// Global metrics for current session
const sessionMetrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  apiCalls: 0,
  savedApiCalls: 0
};

/**
 * Translation cache service to reduce redundant API calls
 * - Stores translated content by page path and language
 * - Checks cache before making translation API calls
 * - Updates cache with new translations
 */
export interface CachedTranslation {
  originalHash: string;      // Hash of original content (to detect changes)
  translatedContent: string; // The translated content
  language: string;          // Target language code
  path: string;              // Page path (for organization)
  timestamp: number;         // When the translation was cached
}

/**
 * Generate a cache key for the page/language combination
 */
const generateCacheKey = async (path: string, language: string, content: string): Promise<string> => {
  // Create a deterministic identifier for this content
  const contentHash = await sha256(content);
  return `${path}-${language}-${contentHash}`;
};

/**
 * Get cached translation for the given parameters
 */
export const getCachedTranslation = async (
  path: string,
  language: string,
  originalContent: string
): Promise<CachedTranslation | null> => {
  try {
    // Use the public API for all users (authenticated and anonymous)
    const response = await brain.get_cached_translation({
      path,
      language,
      original_content: originalContent
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.cache_hit && data.cached_translation) {
        const cached = data.cached_translation;
        sessionMetrics.hits++;
        updateGlobalMetrics({ hits: 1 });
        
        return {
          originalHash: cached.original_hash,
          translatedContent: cached.translated_content,
          language: cached.language,
          path: cached.path,
          timestamp: cached.timestamp
        };
      } else {
        sessionMetrics.misses++;
        updateGlobalMetrics({ misses: 1 });
        return null;
      }
    }
  } catch (error) {
    // API failed - fall back to localStorage for resilience
    console.log('Translation cache API unavailable, using localStorage fallback');
    try {
      const cacheKey = await generateCacheKey(path, language, originalContent);
      const existingCache = localStorage.getItem('translation-cache');
      if (existingCache) {
        const cache = JSON.parse(existingCache);
        const cachedEntry = cache[cacheKey];
        
        if (cachedEntry) {
          const contentHash = await sha256(originalContent);
          if (cachedEntry.originalHash === contentHash) {
            sessionMetrics.hits++;
            return cachedEntry;
          }
        }
      }
    } catch (localError) {
      console.error('localStorage fallback also failed:', localError);
    }
    sessionMetrics.misses++;
    return null;
  }
  
  return null;
};

/**
 * Save translation to cache
 */
export const saveTranslationToCache = async (
  path: string,
  language: string,
  originalContent: string,
  translatedContent: string
): Promise<void> => {
  try {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('Mobile device detected while saving translation cache');
    }

    // Use the public API for all users (authenticated and anonymous)
    const response = await brain.save_translation({
      path,
      language,
      original_content: originalContent,
      translated_content: translatedContent
    });
    
    if (response.ok) {
      console.log('Translation cached for', path, language);
      
      // Update metrics
      sessionMetrics.apiCalls++;
      updateGlobalMetrics({ apiCalls: 1 });
      
      // Potentially run cleanup to prevent excessive growth
      if (Math.random() < CACHE_CLEANUP_PROBABILITY) {
        await cleanupCache();
      }
    }
  } catch (error) {
    // API failed - fall back to localStorage
    console.log('Translation cache API unavailable, using localStorage fallback');
    try {
      const cacheKey = await generateCacheKey(path, language, originalContent);
      const contentHash = await sha256(originalContent);
      
      const cacheData: CachedTranslation = {
        originalHash: contentHash,
        translatedContent,
        language,
        path,
        timestamp: Date.now()
      };
      
      // Get existing cache
      const existingCache = localStorage.getItem('translation-cache');
      const cache = existingCache ? JSON.parse(existingCache) : {};
      
      // Add new entry
      cache[cacheKey] = cacheData;
      
      // Save back to localStorage
      localStorage.setItem('translation-cache', JSON.stringify(cache));
    } catch (localError) {
      console.error('localStorage fallback also failed:', localError);
    }
  }
};

/**
 * Update global metrics via backend API
 */
const updateGlobalMetrics = async (updates: Partial<CacheMetrics>): Promise<void> => {
  try {
    const { currentUser } = getAuth();
    if (!currentUser) return;
    
    const response = await brain.update_metrics({
      metrics: {
        hits: updates.hits || 0,
        misses: updates.misses || 0,
        api_calls: updates.apiCalls || 0,
        saved_api_calls: updates.savedApiCalls || 0
      }
    });
    
    if (!response.ok) {
      console.error('Failed to update metrics via API');
    }
  } catch (error) {
    console.error('Error updating global metrics:', error);
  }
};

/**
 * Clean up old cache entries via backend API
 */
const cleanupCache = async (): Promise<void> => {
  try {
    // Check if cleanup was recently performed
    const now = Date.now();
    if (now - lastCleanupTimestamp < CACHE_CLEANUP_INTERVAL_MS) {
      return; // Skip if already cleaned up recently
    }

    // Only allow authenticated users to clean up the cache
    const { currentUser } = getAuth();
    if (!currentUser) return;

    console.log('Running translation cache cleanup...');

    // Update last cleanup timestamp
    lastCleanupTimestamp = now;

    const response = await brain.cleanup_cache();
    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
    }
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
};

/**
 * Force a cleanup of the cache (for admin use)
 */
export const forceCleanupCache = async (): Promise<void> => {
  try {
    // Only allow authenticated users to force cleanup
    const { currentUser } = getAuth();
    if (!currentUser) return;
    
    console.log('Forcing translation cache cleanup...');
    
    // Get all cache entries
    const cacheRef = collection(firestore, 'translationCache');
    const querySnapshot = await getDocs(cacheRef);
    
    // Find expired entries
    const now = Date.now();
    const expiredEntries = querySnapshot.docs
      .filter(doc => {
        const data = doc.data() as CachedTranslation;
        return now - data.timestamp > CACHE_MAX_AGE_MS;
      })
      .map(doc => ({ id: doc.id }));
    
    if (expiredEntries.length > 0) {
      // Batch delete expired entries
      const batch = writeBatch(firestore);
      expiredEntries.forEach(entry => {
        batch.delete(doc(firestore, 'translationCache', entry.id));
      });
      
      await batch.commit();
      console.log(`Cleaned up ${expiredEntries.length} expired translation cache entries`);
    } else {
      console.log('No expired translation cache entries found');
    }
    
    // Update last cleanup timestamp
    lastCleanupTimestamp = now;
  } catch (error) {
    console.error('Error forcing cleanup of translation cache:', error);
    throw error; // Re-throw to handle in UI
  }
};

/**
 * Function to clear all localStorage translation cache
 * Useful for users to reset their cache manually
 */
export const clearLocalTranslationCache = (): void => {
  try {
    localStorage.removeItem('translation-cache');
    console.log('Local translation cache cleared');
  } catch (error) {
    console.error('Error clearing local translation cache:', error);
  }
};

/**
 * Clear all translation cache entries
 * This function now uses the Translation Cache API instead of direct Firestore operations
 */
export const clearTranslationCache = async (): Promise<void> => {
  try {
    console.log('Clearing all translation cache entries...');
    
    // Reset session metrics
    sessionMetrics.hits = 0;
    sessionMetrics.misses = 0;
    sessionMetrics.apiCalls = 0;
    sessionMetrics.savedApiCalls = 0;
    
    // Use Translation Cache API to clear cache instead of direct Firestore operations
    try {
      const response = await brain.cleanup_cache();
      if (response.ok) {
        const data = await response.json();
        console.log('Translation cache cleared via API:', data.message);
      } else {
        console.warn('Cache cleanup API call completed but may not have cleared all entries');
      }
    } catch (apiError) {
      console.error('Error calling cache cleanup API:', apiError);
      // Continue with local cache clearing even if API fails
    }
    
    // Also clear localStorage cache
    clearLocalTranslationCache();
    
  } catch (error) {
    console.error('Error clearing translation cache:', error);
    throw error; // Re-throw to handle in UI
  }
};

/**
 * Get translation metrics for the admin dashboard
 */
export const getTranslationMetrics = async (): Promise<CacheMetrics> => {
  try {
    const { currentUser } = getAuth();
    if (!currentUser) {
      // Return session metrics for unauthenticated users
      return {
        hits: sessionMetrics.hits,
        misses: sessionMetrics.misses,
        apiCalls: sessionMetrics.apiCalls,
        savedApiCalls: sessionMetrics.savedApiCalls
      };
    }
    
    // Fetch global metrics from Firestore for authenticated users
    const metricsRef = doc(firestore, 'translationMetrics', 'global');
    const metricsDoc = await getDoc(metricsRef);
    
    if (metricsDoc.exists()) {
      const data = metricsDoc.data();
      return {
        hits: data.totalHits || 0,
        misses: data.totalMisses || 0,
        apiCalls: data.totalApiCalls || 0,
        savedApiCalls: data.totalSavedApiCalls || 0
      };
    } else {
      // No global metrics yet, return session metrics
      return {
        hits: sessionMetrics.hits,
        misses: sessionMetrics.misses,
        apiCalls: sessionMetrics.apiCalls,
        savedApiCalls: sessionMetrics.savedApiCalls
      };
    }
  } catch (error) {
    console.error('Error fetching translation metrics from Firestore:', error);
    // Fallback to session metrics on error
    return {
      hits: sessionMetrics.hits,
      misses: sessionMetrics.misses,
      apiCalls: sessionMetrics.apiCalls,
      savedApiCalls: sessionMetrics.savedApiCalls
    };
  }
};

// Export aliases for backward compatibility during transition
export const checkTranslationCache = getCachedTranslation;
export const saveToTranslationCache = saveTranslationToCache;
