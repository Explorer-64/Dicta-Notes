import React, { useEffect } from 'react';

/**
 * Document component that handles language and translation attributes
 * This component doesn't render any visible UI but sets metadata on the HTML document
 */
export function DocumentAttributes() {
  useEffect(() => {
    // Enhance language metadata for better automatic translation detection
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('translate', 'yes');
    
    // Add explicit content language meta tag
    const metaContentLang = document.createElement('meta');
    metaContentLang.setAttribute('http-equiv', 'Content-Language');
    metaContentLang.setAttribute('content', 'en');
    document.head.appendChild(metaContentLang);
    
    // Set title if needed
    if (document.title === 'Databutton' || !document.title) {
      document.title = 'Dicta-Notes | AI Meeting Transcription';
    }
    
    return () => {
      // Clean up when component unmounts
      document.head.removeChild(metaContentLang);
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}
