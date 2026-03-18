import React, { useEffect } from 'react';

export const MobileOptimizations: React.FC = () => {
  useEffect(() => {
    // Detect mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Add mobile-specific class to the body
      document.body.classList.add('mobile-device');
      
      if (isAndroid) {
        // Add Android-specific class
        document.body.classList.add('android-device');
        
        // Fix viewport issues on some Android browsers
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute(
            'content',
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover'
          );
        }
      }
      
      // Use smaller motion animations on mobile
      document.documentElement.style.setProperty('--motion-reduce', '0.5');
      
      // Add keyboard fixes for iOS
      document.addEventListener('focusin', (e) => {
        if ((e.target as HTMLElement).tagName === 'INPUT') {
          // Add some padding to scroll up on input focus
          setTimeout(() => {
            window.scrollBy(0, -100);
          }, 50);
        }
      });
    }
    
    // Clean up
    return () => {
      document.body.classList.remove('mobile-device', 'android-device');
      document.documentElement.style.removeProperty('--motion-reduce');
    };
  }, []);
  
  return null; // This is a utility component that doesn't render anything
};
