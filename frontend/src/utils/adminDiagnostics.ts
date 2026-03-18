import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from 'app';
import brain from 'brain';

// Types for diagnostic data
export interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  message: string;
  component?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  stack?: string;
  source?: 'console' | 'unhandled' | 'manual' | 'backend';
  errorType?: string;
  metadata?: Record<string, any>;
}

export interface UsageMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalTranscriptions: number;
  totalTranslations: number;
  averageSessionDuration: number;
}

export interface SystemHealth {
  firestoreConnected: boolean;
  authWorking: boolean;
  apiResponding: boolean;
  storageAccessible: boolean;
  lastHealthCheck: Date;
}

export interface UserActivity {
  userId: string;
  email?: string;
  lastSeen: Date;
  sessionCount: number;
  transcriptionCount: number;
  translationCount: number;
  errorCount: number;
}

// Global error tracking state
let errorTrackingInitialized = false;
let errorBuffer: ErrorLog[] = [];
const MAX_BUFFER_SIZE = 50;
let _originalConsoleError: (...args: any[]) => void = console.error;
let _isLogging = false;

/**
 * Initialize comprehensive error tracking
 */
export const initializeErrorTracking = (): void => {
  if (errorTrackingInitialized) return;
  
  // Capture all console errors
  const originalConsoleError = console.error;
  _originalConsoleError = originalConsoleError;
  console.error = (...args: any[]) => {
    // Call original console.error
    originalConsoleError.apply(console, args);

    // Prevent infinite loop: don't log if we're already inside logError
    if (_isLogging) return;

    // Log the error
    const errorMessage = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    logError(new Error(errorMessage), 'console', 'error', 'console');
  };
  
  // Capture console warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    originalConsoleWarn.apply(console, args);

    // Prevent infinite loop
    if (_isLogging) return;

    const warningMessage = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    logError(new Error(warningMessage), 'console', 'warning', 'console');
  };
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      'unhandled-promise',
      'error',
      'unhandled'
    );
  });
  
  // Capture global errors
  window.addEventListener('error', (event) => {
    logError(
      new Error(`Global Error: ${event.message} at ${event.filename}:${event.lineno}`),
      'global-error',
      'error',
      'unhandled'
    );
  });
  
  errorTrackingInitialized = true;
  console.log('[ERROR TRACKING] Comprehensive error tracking initialized');
};

/**
 * Enhanced error logging function
 */
const logError = async (
  error: Error,
  component?: string,
  level: 'error' | 'warning' | 'info' = 'error',
  source: 'console' | 'unhandled' | 'manual' | 'backend' = 'manual'
): Promise<void> => {
  if (_isLogging) return;
  _isLogging = true;
  try {
    const errorLog: ErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message: error.message,
      component,
      userId: getAuth().currentUser?.uid,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: error.stack,
      source,
      errorType: error.constructor.name
    };
    
    // Add to buffer
    errorBuffer.unshift(errorLog);
    if (errorBuffer.length > MAX_BUFFER_SIZE) {
      errorBuffer = errorBuffer.slice(0, MAX_BUFFER_SIZE);
    }
    
    // Store in localStorage for immediate access
    const existingLogs = getClientErrorLogs();
    const updatedLogs = [errorLog, ...existingLogs].slice(0, 200); // Increased limit
    localStorage.setItem('admin-error-logs', JSON.stringify(updatedLogs));
    
    // Send to backend API only if user is authenticated and method exists (non-blocking)
    const currentUser = getAuth().currentUser;
    if (currentUser && typeof (brain as any).log_error === 'function') {
      (brain as any).log_error({
        message: error.message,
        level,
        component,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        source: source || 'manual',
        errorType: error.constructor.name
      }).catch(() => {
        // Silently fail - do NOT console.warn here as it causes infinite loops
        // The error is already in localStorage, that's sufficient
      });
    }
    
    // Try to log to Firestore (non-blocking)
    try {
      await addDoc(collection(firestore, 'errorLogs'), errorLog);
    } catch (firestoreError) {
      // If Firestore fails, at least we have it in localStorage
      // Silent fail - do NOT console.warn here either
    }
    
  } catch (logErr) {
    // Use the original console.error to avoid infinite loop
    _originalConsoleError('Failed to log error:', logErr, 'Original error:', error);
  } finally {
    _isLogging = false;
  }
};

/**
 * Public function for manual error logging
 */
export const logAdminError = (error: Error, component?: string, level: 'error' | 'warning' | 'info' = 'error'): void => {
  logError(error, component, level, 'manual');
};

/**
 * Get recent error logs from various sources
 */
export const getRecentErrors = async (limitCount = 100): Promise<ErrorLog[]> => {
  try {
    const errors: ErrorLog[] = [];
    
    // Get client-side errors from localStorage
    const clientErrors = getClientErrorLogs();
    errors.push(...clientErrors);
    
    // Get from buffer for very recent errors
    errors.push(...errorBuffer);
    
    // Get server-side errors from Firestore
    try {
      const errorRef = collection(firestore, 'errorLogs');
      const q = query(errorRef, orderBy('timestamp', 'desc'), limit(limitCount * 2)); // Get more to account for duplicates
      const querySnapshot = await getDocs(q);
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        errors.push({
          id: doc.id,
          timestamp: data.timestamp,
          level: data.level,
          message: data.message,
          component: data.component,
          userId: data.userId,
          userAgent: data.userAgent,
          url: data.url,
          stack: data.stack,
          source: data.source || 'backend',
          errorType: data.errorType
        } as ErrorLog);
      });
    } catch (firestoreError) {
      console.warn('Could not fetch server errors:', firestoreError);
    }
    
    // Remove duplicates based on timestamp + message combination
    const uniqueErrors = errors.filter((error, index, self) => 
      index === self.findIndex(e => 
        e.timestamp === error.timestamp && e.message === error.message
      )
    );
    
    // Sort by timestamp, most recent first
    return uniqueErrors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return getClientErrorLogs(); // Fallback to localStorage only
  }
};

/**
 * Get client-side error logs from localStorage
 */
const getClientErrorLogs = (): ErrorLog[] => {
  try {
    const logs = localStorage.getItem('admin-error-logs');
    if (!logs) return [];
    
    return JSON.parse(logs).filter((log: ErrorLog) => {
      // Only return errors from last 7 days
      return Date.now() - log.timestamp < 7 * 24 * 60 * 60 * 1000;
    });
  } catch (error) {
    console.error('Error reading client error logs:', error);
    return [];
  }
};

/**
 * Get comprehensive usage metrics
 */
export const getUsageMetrics = async (): Promise<UsageMetrics> => {
  try {
    const metrics = {
      totalUsers: 0,
      activeUsers: 0,
      totalSessions: 0,
      totalTranscriptions: 0,
      totalTranslations: 0,
      averageSessionDuration: 0
    };
    
    // Get session statistics
    try {
      const sessionsRef = collection(firestore, 'sessions');
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      const userIds = new Set<string>();
      const activeUserIds = new Set<string>();
      let totalDuration = 0;
      let sessionCount = 0;
      let transcriptionCount = 0;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      sessionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId;
        const createdAt = data.created_at;
        const duration = data.duration || 0;
        
        // Handle different timestamp formats
        let timestamp = 0;
        if (createdAt) {
          if (typeof createdAt === 'number') {
            // Unix timestamp in seconds, convert to milliseconds
            timestamp = createdAt > 1000000000000 ? createdAt : createdAt * 1000;
          } else if (createdAt.toDate) {
            // Firestore Timestamp
            timestamp = createdAt.toDate().getTime();
          } else if (createdAt instanceof Date) {
            timestamp = createdAt.getTime();
          }
        }
        
        if (userId) {
          userIds.add(userId);
          if (timestamp > weekAgo) {
            activeUserIds.add(userId);
          }
        }
        
        if (duration > 0) {
          totalDuration += duration;
          sessionCount++;
        }
        
        // Count transcriptions - sessions with segments or full_text
        if ((data.segments && data.segments.length > 0) || 
            (data.full_text && data.full_text.trim().length > 0)) {
          transcriptionCount++;
        }
      });
      
      metrics.totalUsers = userIds.size;
      metrics.activeUsers = activeUserIds.size;
      metrics.totalSessions = sessionsSnapshot.size;
      metrics.totalTranscriptions = transcriptionCount;
      metrics.averageSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;
    } catch (error) {
      console.warn('Could not fetch session metrics:', error);
    }
    
    // Get translation statistics from global metrics
    try {
      const metricsRef = collection(firestore, 'translationMetrics');
      const metricsSnapshot = await getDocs(metricsRef);
      
      metricsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        metrics.totalTranslations += (data.totalApiCalls || 0) + (data.totalSavedApiCalls || 0);
      });
    } catch (error) {
      console.warn('Could not fetch translation metrics:', error);
    }
    
    return metrics;
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalSessions: 0,
      totalTranscriptions: 0,
      totalTranslations: 0,
      averageSessionDuration: 0
    };
  }
};

/**
 * Check system health status
 */
export const checkSystemHealth = async (): Promise<SystemHealth> => {
  const health: SystemHealth = {
    firestoreConnected: false,
    authWorking: false,
    apiResponding: false,
    storageAccessible: false,
    lastHealthCheck: new Date()
  };
  
  try {
    // Test API and get backend system health (guard: methods may not exist yet)
    try {
      if (typeof (brain as any).check_system_health === 'function') {
        const response = await (brain as any).check_system_health();
        if (response.ok) {
          health.apiResponding = true;
          const data = await response.json();
          health.firestoreConnected = data.firestore_connected;
          health.storageAccessible = data.storage_accessible;
        }
      }
    } catch (error) {
      console.warn('Backend health check failed:', error);
      // Fallback to basic API check
      try {
        if (typeof (brain as any).check_health === 'function') {
          const response = await (brain as any).check_health();
          health.apiResponding = response.ok;
        }
      } catch (apiError) {
        console.warn('API health check failed:', apiError);
      }
    }
    
    // Test auth
    try {
      const auth = getAuth();
      health.authWorking = auth !== null;
    } catch (error) {
      console.warn('Auth health check failed:', error);
    }
    
    // Test localStorage (storage) - this is separate from backend storage
    if (!health.storageAccessible) {
      try {
        const testKey = 'health-check-test';
        localStorage.setItem(testKey, 'test');
        const value = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        health.storageAccessible = value === 'test';
      } catch (error) {
        console.warn('Storage health check failed:', error);
      }
    }

  } catch (error) {
    console.error('System health check failed:', error);
  }
  
  return health;
};

/**
 * Get user activity analytics
 */
export const getUserActivityAnalytics = async (limitCount = 20): Promise<UserActivity[]> => {
  try {
    const userActivities = new Map<string, UserActivity>();
    
    // Get session data
    const sessionsRef = collection(firestore, 'sessions');
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      
      if (userId) {
        const existing = userActivities.get(userId) || {
          userId,
          lastSeen: new Date(0),
          sessionCount: 0,
          transcriptionCount: 0,
          translationCount: 0,
          errorCount: 0
        };
        
        existing.sessionCount++;
        
        // Handle timestamp properly - Firestore returns DatetimeWithNanoseconds
        const created_at = data.created_at || data.timestamp;
        if (created_at) {
          let timestamp: number;
          
          if (typeof created_at === 'object' && created_at.toMillis) {
            // Firestore Timestamp object
            timestamp = created_at.toMillis();
          } else if (typeof created_at === 'object' && created_at.getTime) {
            // JavaScript Date object
            timestamp = created_at.getTime();
          } else if (typeof created_at === 'number') {
            // Already a timestamp
            timestamp = created_at;
          } else {
            // Try to parse as date string
            timestamp = new Date(created_at).getTime();
          }
          
          if (timestamp > existing.lastSeen.getTime()) {
            existing.lastSeen = new Date(timestamp);
          }
        }
        
        // Count transcriptions - check if session has any transcription data
        if (data.transcript_id || data.full_text || (data.segments && data.segments.length > 0)) {
          existing.transcriptionCount++;
        }
        
        // Count translations - check if any segment has translation data
        const segments = data.segments || [];
        let hasTranslations = false;
        
        for (const segment of segments) {
          if (segment && typeof segment === 'object') {
            // Check if segment has translations
            if (segment.translations && Object.keys(segment.translations).length > 0) {
              hasTranslations = true;
              break;
            }
            // Check if segment is non-English (implies translation activity)
            if (segment.language && segment.language !== 'en') {
              hasTranslations = true;
              break;
            }
            // Check if segment is marked as needing translation
            if (segment.needs_translation) {
              hasTranslations = true;
              break;
            }
          }
        }
        
        if (hasTranslations) {
          existing.translationCount++;
        }
        
        userActivities.set(userId, existing);
      }
    });
    
    // Get error counts from error logs
    const errorLogs = await getRecentErrors(1000);
    errorLogs.forEach(error => {
      if (error.userId) {
        const existing = userActivities.get(error.userId);
        if (existing) {
          existing.errorCount++;
        }
      }
    });
    
    // Convert to array and sort by last seen
    return Array.from(userActivities.values())
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching user activity analytics:', error);
    return [];
  }
};

/**
 * Clear old diagnostic data to prevent storage bloat
 */
export const cleanupDiagnosticData = (): void => {
  try {
    // Clean up client error logs older than 7 days
    const logs = getClientErrorLogs();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter(log => log.timestamp > weekAgo);
    localStorage.setItem('admin-error-logs', JSON.stringify(recentLogs));
    
    console.log(`Cleaned up diagnostic data, kept ${recentLogs.length} recent error logs`);
  } catch (error) {
    console.error('Error cleaning up diagnostic data:', error);
  }
};

/**
 * Export all diagnostic data for analysis
 */
export const exportDiagnosticData = async (): Promise<void> => {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      errors: await getRecentErrors(200),
      usageMetrics: await getUsageMetrics(),
      systemHealth: await checkSystemHealth(),
      userActivity: await getUserActivityAnalytics(50),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting diagnostic data:', error);
    throw error;
  }
};
