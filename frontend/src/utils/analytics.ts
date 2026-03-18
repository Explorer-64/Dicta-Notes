/**
 * Analytics utility functions - Firebase Analytics disabled for mobile performance
 * Google Tag Manager was auto-loading from Firebase Analytics measurementId
 */

// Analytics completely disabled to eliminate 118.6 KiB Google Tag Manager load
let analyticsInstance: any = null;
let analyticsInitialized = false;

/**
 * Analytics initialization disabled for mobile performance optimization
 * Firebase Analytics was causing automatic Google Tag Manager loading
 */
const initializeAnalytics = async () => {
  // Analytics disabled to eliminate GTM blocking time
  console.log('Firebase Analytics disabled for mobile performance optimization');
  return null;
};

/**
 * Firebase Analytics wrapper with lazy loading
 */
export const analytics = {
  /**
   * Log a custom event to Firebase Analytics
   * @param eventName The name of the event to log
   * @param eventParams Optional parameters to include with the event
   */
  logEvent: async (eventName: string, eventParams?: Record<string, any>) => {
    try {
      const analytics = await initializeAnalytics();
      if (analytics) {
        const { logEvent } = await import('firebase/analytics');
        logEvent(analytics, eventName, eventParams);
        console.log(`Analytics event logged: ${eventName}`, eventParams);
      }
    } catch (error) {
      console.error(`Error logging analytics event ${eventName}:`, error);
    }
  },

  /**
   * Set user ID for analytics
   * @param uid User ID to associate with analytics events
   */
  setUserId: async (uid: string) => {
    try {
      const analytics = await initializeAnalytics();
      if (analytics && uid) {
        const { setUserId } = await import('firebase/analytics');
        setUserId(analytics, uid);
        console.log(`Analytics user ID set: ${uid}`);
      }
    } catch (error) {
      console.error('Error setting analytics user ID:', error);
    }
  },

  /**
   * Set user properties for analytics segmentation
   * @param properties User properties to set
   */
  setUserProperties: async (properties: Record<string, any>) => {
    try {
      const analytics = await initializeAnalytics();
      if (analytics && properties) {
        const { setUserProperties } = await import('firebase/analytics');
        setUserProperties(analytics, properties);
        console.log('Analytics user properties set:', properties);
      }
    } catch (error) {
      console.error('Error setting analytics user properties:', error);
    }
  },

  /**
   * Log a page view event
   * @param pageName Name of the page being viewed
   * @param pageParams Additional parameters for the page view
   */
  logPageView: async (pageName: string, pageParams?: Record<string, any>) => {
    try {
      const analytics = await initializeAnalytics();
      if (analytics) {
        const { logEvent } = await import('firebase/analytics');
        logEvent(analytics, 'page_view', {
          page_title: pageName,
          page_location: window.location.href,
          page_path: window.location.pathname,
          ...pageParams
        });
        console.log(`Page view logged: ${pageName}`);
      }
    } catch (error) {
      console.error(`Error logging page view for ${pageName}:`, error);
    }
  }
};

/**
 * Hook to automatically log page views when a component mounts
 * @param pageName Name of the page to log
 * @param pageParams Additional parameters for the page view
 */
export const logPageView = (pageName: string, pageParams?: Record<string, any>) => {
  analytics.logPageView(pageName, pageParams);
};