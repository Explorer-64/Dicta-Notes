/**
 * Implementation: pwa-manifest
 * 
 * Description:
 * Provides utility functions for the PWA manifest generation and installation.
 */

// App manifest configuration
export const PWA_CONFIG = {
  name: 'Dicta-Notes',
  shortName: 'Dicta-Notes',
  description: 'AI-powered transcription app that differentiates between speakers',
  themeColor: '#0284c7',
  backgroundColor: '#ffffff',
  display: 'standalone',
  startUrl: './',
  scope: './',
  icons: [
    {
      src: '/icons/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png'
    },
    {
      src: '/icons/maskable-icon.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    }
  ]
};

/**
 * Generates a web app manifest as a JSON string
 */
export const generateManifest = (): string => {
  const manifest = {
    name: PWA_CONFIG.name,
    short_name: PWA_CONFIG.shortName,
    description: PWA_CONFIG.description,
    start_url: PWA_CONFIG.startUrl,
    display: PWA_CONFIG.display,
    background_color: PWA_CONFIG.backgroundColor,
    theme_color: PWA_CONFIG.themeColor,
    icons: PWA_CONFIG.icons,
    orientation: 'portrait',
    categories: ['productivity', 'business'],
    lang: 'en-US',
    prefer_related_applications: false,
    id: '/?source=pwa',
    launch_handler: {
      client_mode: ['auto']
    },
    screenshots: [
      {
        src: '/screenshots/desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide'
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow'
      }
    ]
  };
  
  return JSON.stringify(manifest);
};

/**
 * Checks if the app is running as an installed PWA
 */
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

/**
 * Checks if the browser supports PWA installation
 */
export const isPWASupported = (): boolean => {
  return 'serviceWorker' in navigator && window.isSecureContext;
};

/**
 * Checks if the PWA is installable (criteria met)
 */
export const isPWAInstallable = (): boolean => {
  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
                      
  // Check for service worker support
  const hasServiceWorker = 'serviceWorker' in navigator;
  
  // Check for manifest link tag
  const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
  
  // For iOS devices, we can still show the install button even without a service worker
  const isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
  
  // Force installable in development mode for testing (can be removed in production)
  const forceDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === 'localhost';
  
  const result = {
    hasServiceWorker,
    hasManifest,
    isStandalone,
    isIOS,
    forceDev,
    // In development always allow install testing
    installable: forceDev || ((hasServiceWorker || isIOS) && !isStandalone)
  };
  
  console.log('PWA: Installability check:', result);
  
  return result.installable;
};

/**
 * iOS specific PWA add-to-home screen installation event detection
 */
export const setupIOSInstallDetection = () => {
  // Detection for iOS Safari
  const isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
  const isSafari = /Safari/g.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone === true;
  
  console.log('PWA: iOS detection check:', { isIOS, isSafari, isStandalone });
  
  if (isIOS && !isStandalone) {
    // Create browser-specific instructions element but don't show it yet
    // This is just for detection, not display
    const metaTag = document.createElement('meta');
    metaTag.name = 'apple-mobile-web-app-capable';
    metaTag.content = 'yes';
    document.head.appendChild(metaTag);
    
    // Create apple touch icon if not present
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const linkTag = document.createElement('link');
      linkTag.rel = 'apple-touch-icon';
      linkTag.href = '/icons/apple-touch-icon.png';
      document.head.appendChild(linkTag);
    }
    
    console.log('PWA: iOS install available, meta tags added');
    // Return true to indicate iOS install is available
    return true;
  }
  
  return false;
};