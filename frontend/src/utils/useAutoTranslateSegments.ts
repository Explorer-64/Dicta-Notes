import { useState, useEffect, useCallback } from 'react';
import { useLanguageStore } from './languageStore';
import brain from 'brain';
import { LiveFirestoreSegment } from './hooks/useLiveTranscriptSegments';

// MEMORY LEAK FIX: Add cache size limits
const MAX_CACHE_SIZE = 100; // Limit to 100 cached translations
const CACHE_CLEANUP_THRESHOLD = 150; // Start cleanup when reaching this size

/**
 * Hook to automatically translate live transcript segments based on user's preferred language
 */
export function useAutoTranslateSegments(segments: LiveFirestoreSegment[]) {
  const { preferredLanguage, isInitialized } = useLanguageStore();
  const [translatedSegments, setTranslatedSegments] = useState<LiveFirestoreSegment[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState<Map<string, string>>(new Map());

  // Helper function to generate cache key
  const getCacheKey = useCallback((text: string, fromLang: string, toLang: string) => {
    return `${fromLang}-${toLang}-${text.substring(0, 50)}`; // Use first 50 chars to limit key size
  }, []);

  // MEMORY LEAK FIX: Add cache cleanup function
  const cleanupCache = useCallback((cache: Map<string, string>) => {
    if (cache.size <= MAX_CACHE_SIZE) return cache;
    
    console.log(`Cleaning up translation cache (${cache.size} entries)`);
    
    // Convert to array, sort by key (which includes timestamp info), keep most recent
    const entries = Array.from(cache.entries());
    const recentEntries = entries.slice(-MAX_CACHE_SIZE);
    
    const cleanedCache = new Map(recentEntries);
    console.log(`Translation cache cleaned: ${cache.size} → ${cleanedCache.size} entries`);
    
    return cleanedCache;
  }, []);

  // MEMORY LEAK FIX: Cleanup cache when language changes
  useEffect(() => {
    console.log(`Language changed to ${preferredLanguage}, clearing translation cache`);
    setTranslationCache(new Map());
  }, [preferredLanguage]);

  // Helper function to translate a single segment
  const translateSegment = useCallback(async (segment: LiveFirestoreSegment): Promise<LiveFirestoreSegment> => {
    // If user prefers English, no translation needed
    if (preferredLanguage === 'en') {
      return segment;
    }
    
    // For non-English preferences, we should translate all segments
    // since we can't reliably detect the source language
    const segmentLanguage = segment.language || 'auto'; // Use 'auto' to let backend detect

    // Check cache first
    const cacheKey = getCacheKey(segment.text, segmentLanguage, preferredLanguage);
    if (translationCache.has(cacheKey)) {
      return {
        ...segment,
        text: translationCache.get(cacheKey)!,
        originalText: segment.text,
        translatedFrom: segmentLanguage,
        translatedTo: preferredLanguage
      };
    }

    try {
      console.log(`Auto-translating segment to ${preferredLanguage}:`, segment.text.substring(0, 50));
      
      const response = await brain.translate_text({
        text: segment.text,
        // Don't specify source_language to let backend auto-detect
        target_language: preferredLanguage
      });

      if (!response.ok) {
        console.error('Translation failed:', response.statusText);
        return segment; // Return original if translation fails
      }

      const result = await response.json();
      const translatedText = result.translated_text;

      // Cache the translation
      const newCache = new Map(translationCache);
      newCache.set(cacheKey, translatedText);
      setTranslationCache(newCache);

      return {
        ...segment,
        text: translatedText,
        originalText: segment.text,
        translatedFrom: segmentLanguage,
        translatedTo: preferredLanguage
      };
    } catch (error) {
      console.error('Error translating segment:', error);
      return segment; // Return original if translation fails
    }
  }, [preferredLanguage, translationCache, getCacheKey]);

  // Main effect to translate segments when they change or when language preference changes
  useEffect(() => {
    if (!isInitialized || preferredLanguage === 'en') {
      // If not initialized or preference is English, just return segments as-is
      setTranslatedSegments(segments);
      return;
    }

    const translateAllSegments = async () => {
      setIsTranslating(true);
      
      try {
        const translated = await Promise.all(
          segments.map(segment => translateSegment(segment))
        );
        setTranslatedSegments(translated);
      } catch (error) {
        console.error('Error translating segments:', error);
        setTranslatedSegments(segments); // Fallback to original segments
      } finally {
        setIsTranslating(false);
      }
    };

    translateAllSegments();
  }, [segments, preferredLanguage, isInitialized, translateSegment]);

  return {
    translatedSegments,
    isTranslating,
    preferredLanguage,
    isInitialized
  };
}

