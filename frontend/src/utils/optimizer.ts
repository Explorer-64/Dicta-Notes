/**
 * JavaScript Optimizer - Runtime optimization for Dicta-Notes
 * 
 * This script helps reduce JavaScript memory usage by:
 * 1. Lazy-loading heavy components only when needed
 * 2. Cleaning up unused event listeners and subscriptions
 * 3. Providing a central place to monitor and optimize JS performance
 */

/**
 * Tracks active event listeners for cleanup
 */
class EventListenerTracker {
  private listeners: Map<HTMLElement, {event: string, callback: EventListener, options?: boolean | AddEventListenerOptions}[]> = new Map();
  
  /**
   * Registers an event listener for future cleanup
   */
  public add(element: HTMLElement, event: string, callback: EventListener, options?: boolean | AddEventListenerOptions): void {
    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }
    this.listeners.get(element)?.push({event, callback, options});
  }
  
  /**
   * Removes all tracked event listeners from an element
   */
  public cleanupElement(element: HTMLElement): void {
    const listeners = this.listeners.get(element);
    if (listeners) {
      listeners.forEach(({event, callback, options}) => {
        element.removeEventListener(event, callback, options);
      });
      this.listeners.delete(element);
    }
  }
  
  /**
   * Removes all tracked event listeners
   */
  public cleanupAll(): void {
    this.listeners.forEach((listeners, element) => {
      listeners.forEach(({event, callback, options}) => {
        element.removeEventListener(event, callback, options);
      });
    });
    this.listeners.clear();
  }
}

/**
 * Global event listener tracker instance
 */
export const eventTracker = new EventListenerTracker();

/**
 * Adds an event listener and tracks it for later cleanup
 */
export function trackableEventListener(
  element: HTMLElement,
  event: string,
  callback: EventListener,
  options?: boolean | AddEventListenerOptions
): void {
  element.addEventListener(event, callback, options);
  eventTracker.add(element, event, callback, options);
}

/**
 * Resource loading optimizer - prevents duplicate script/style loading
 */
class ResourceOptimizer {
  private loadedScripts: Set<string> = new Set();
  private loadedStyles: Set<string> = new Set();
  
  /**
   * Dynamically loads a script only if it hasn't been loaded before
   */
  public loadScript(url: string): Promise<void> {
    if (this.loadedScripts.has(url)) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      script.onload = () => {
        this.loadedScripts.add(url);
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load script: ${url}`));
      };
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Dynamically loads a stylesheet only if it hasn't been loaded before
   */
  public loadStyle(url: string): Promise<void> {
    if (this.loadedStyles.has(url)) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      
      link.onload = () => {
        this.loadedStyles.add(url);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${url}`));
      };
      
      document.head.appendChild(link);
    });
  }
}

/**
 * Global resource optimizer instance
 */
export const resourceOptimizer = new ResourceOptimizer();

/**
 * Memory usage monitor and optimizer
 */
export class MemoryOptimizer {
  private static memoryWarningThresholdMB: number = 150; // Memory threshold before optimization kicks in
  private static checkIntervalMs: number = 30000; // Check every 30 seconds
  private static intervalId: number | null = null;
  
  /**
   * Starts monitoring memory usage
   */
  public static startMonitoring(): void {
    if (this.intervalId !== null) return;
    
    this.intervalId = window.setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkIntervalMs);
    
    // Also check on visibility change (tab focus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkMemoryUsage();
      }
    });
  }
  
  /**
   * Stops monitoring memory usage
   */
  public static stopMonitoring(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Checks current memory usage and optimizes if needed
   */
  private static checkMemoryUsage(): void {
    if ('performance' in window && 'memory' in (performance as any)) {
      const memoryInfo = (performance as any).memory;
      const usedHeapSizeMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      
      if (usedHeapSizeMB > this.memoryWarningThresholdMB) {
        console.log(`Memory usage high (${usedHeapSizeMB.toFixed(2)} MB), optimizing...`);
        this.optimizeMemory();
      }
    }
  }
  
  /**
   * Performs memory optimization
   */
  public static optimizeMemory(): void {
    // Skip optimization if live transcription is active
    if (this.isLiveTranscriptionActive) {
      console.log('Skipping memory optimization - live transcription active');
      return;
    }
    
    // Clear any cached data that's not essential
    this.clearImageCache();
    
    // Force garbage collection if possible - but only if not during live transcription
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        console.log('Manual GC not available');
      }
    }
  }
  
  /**
   * Clears image cache to free memory
   */
  private static clearImageCache(): void {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      if (!isElementInViewport(img as HTMLElement)) {
        img.setAttribute('src', '');
      }
    });
  }
}

/**
 * Determines if an element is currently visible in the viewport
 */
export function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Initializes all optimizations
 */
export function initializeOptimizations(): void {
  // Start memory monitoring
  MemoryOptimizer.startMonitoring();
  
  // Set up page visibility optimizations
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // When page is hidden, free up resources
      MemoryOptimizer.optimizeMemory();
    }
  });
  
  // Clean up event listeners when the page unloads
  window.addEventListener('beforeunload', () => {
    eventTracker.cleanupAll();
  });
}

// Initialize optimizations immediately
initializeOptimizations();

