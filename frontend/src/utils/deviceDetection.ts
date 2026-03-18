



/**
 * Helper functions for device detection
 */

export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
  browser: string;
  canUseSystemAudio: boolean;
}

/**
 * Detect current device and app state
 */
export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // Mobile detection
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  // PWA detection - check if running in standalone mode
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  
  // Better browser detection
  let browser = 'unknown';
  if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) {
    browser = 'chrome';
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = 'safari';
  } else if (/Firefox/i.test(userAgent)) {
    browser = 'firefox';
  } else if (/Edge/i.test(userAgent)) {
    browser = 'edge';
  }
  
  // System audio capability logic:
  // - Desktop: always works
  // - Mobile PWA: never works (needs browser redirect)
  // - Mobile browser: works in Chrome/Edge, limited in Safari
  let canUseSystemAudio = false;
  
  if (!isMobile) {
    // Desktop - system audio should work
    canUseSystemAudio = true;
  } else if (isPWA) {
    // Mobile PWA - system audio never works
    canUseSystemAudio = false;
  } else {
    // Mobile browser - works in Chrome/Edge, limited in Safari
    canUseSystemAudio = browser === 'chrome' || browser === 'edge' || browser === 'safari';
  }
  
  return {
    isMobile,
    isIOS,
    isAndroid,
    isPWA,
    browser,
    canUseSystemAudio
  };
}

/**
 * Check if user needs to be redirected to browser for system audio
 */
export function shouldRedirectForSystemAudio(): boolean {
  const device = detectDevice();
  
  // Redirect if:
  // 1. On mobile device AND
  // 2. In PWA mode (standalone) AND  
  // 3. System audio won't work
  return device.isMobile && device.isPWA && !device.canUseSystemAudio;
}

/**
 * Get current page URL for browser redirect
 */
export function getBrowserRedirectUrl(): string {
  // Get current path and search params
  const currentPath = window.location.pathname;
  const searchParams = window.location.search;
  
  // For production, we need to construct a URL that forces browser mode
  // Add a query param to signal browser mode and prevent PWA from taking over
  const separator = searchParams ? '&' : '?';
  const browserParam = `${separator}browser=true&pwa=false`;
  
  // Always use the current domain but add browser-forcing parameters
  const fullUrl = `https://${window.location.hostname}${currentPath}${searchParams}${browserParam}`;
  
  return fullUrl;
}

/**
 * Get user-friendly browser name for instructions
 */
export function getFriendlyBrowserName(device: DeviceInfo): string {
  if (device.isIOS) {
    return 'Safari';
  } else if (device.isAndroid) {
    return 'Chrome';
  } else {
    return 'your browser';
  }
}

/**
 * Checks if the device is an Android device
 */
export const isAndroidDevice = (): boolean => {
  return /android/i.test(navigator.userAgent);
};

/**
 * Checks if the device is an iOS device
 */
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Checks specifically if the device is an iPhone
 */
export const isIPhone = (): boolean => {
  return /iPhone/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Checks if the device is a mobile device
 */
export const isMobileDevice = (): boolean => {
  return isAndroidDevice() || isIOSDevice() || /mobile/i.test(navigator.userAgent);
};

/**
 * Checks if the device is a Pixel device
 */
export const isPixelDevice = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return isAndroidDevice() && /pixel/i.test(ua);
};

/**
 * Checks specifically for Pixel 7A device
 */
export const isPixel7A = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return isPixelDevice() && /pixel 7a/i.test(ua);
};

/**
 * Checks if the browser is Chrome
 */
export const isChromeDevice = (): boolean => {
  return /chrome|chromium|crios/i.test(navigator.userAgent) && !/edg|edge/i.test(navigator.userAgent);
};

/**
 * Gets Android version information
 */
export const getAndroidVersion = (): string | null => {
  const match = navigator.userAgent.match(/Android\s([\d\.]+)/);
  return match ? match[1] : null;
};

/**
 * Gets Chrome version information
 */
export const getChromeVersion = (): string | null => {
  const match = navigator.userAgent.match(/Chrome\/([\d\.]+)/);
  return match ? match[1] : null;
};

/**
 * Gets detailed device information
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isStandaloneMode = () => {
    return window.navigator.standalone || 
           window.matchMedia('(display-mode: standalone)').matches;
  };
  
  // Get browser info
  const getBrowserInfo = () => {
    const isChrome = /chrome|chromium|crios/i.test(userAgent) && !/edg|edge/i.test(userAgent);
    const isFirefox = /firefox|fxios/i.test(userAgent);
    const isSafari = /safari/i.test(userAgent) && !/chrome|chromium|crios/i.test(userAgent);
    const isEdge = /edg|edge/i.test(userAgent);
    const isSamsung = /samsungbrowser/i.test(userAgent);
    const isOpera = /opr\//i.test(userAgent);
    
    return { isChrome, isFirefox, isSafari, isEdge, isSamsung, isOpera };
  };
  
  const isAndroid = /android/.test(userAgent);
  const isIOS = /(iphone|ipad|ipod)/.test(userAgent);
  const isMobile = isAndroid || isIOS || /mobile/i.test(userAgent);
  const isPixel = isAndroid && /pixel/i.test(userAgent);
  const isPixel7A = isPixel && /pixel 7a/i.test(userAgent);
  
  return {
    userAgent,
    isAndroid,
    isIOS,
    isMobile,
    isPixel,
    isPixel7A,
    standalone: isStandaloneMode(),
    browserMode: window.matchMedia('(display-mode: browser)').matches,
    browser: getBrowserInfo()
  };
};
