/**
 * Component: PWAHead
 * 
 * Description:
 * Adds the necessary meta tags and links for PWA functionality.
 * Manages PWA manifest and service worker registration.
 */

import { Helmet } from 'react-helmet-async';
import { PWA_CONFIG, generateManifest, safeBase64Encode } from '../utils/pwa-config';
import '../utils/pwa-global-init'; // Import early initialization
import { safeJsonStringify } from '../utils/json';

export function PWAHead() {
  // Service worker registration is handled by PWAController

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>Dicta-Notes | AI Transcription, Translation & Team Collaboration</title>
      <meta name="application-name" content={PWA_CONFIG.name} />
      <meta name="theme-color" content={PWA_CONFIG.themeColor} />
      <meta name="background-color" content={PWA_CONFIG.backgroundColor} />
      <meta name="description" content="Dicta-Notes offers AI transcription with Gemini 2.5 Pro, 10+ speaker identification, 130+ language translations, and collaborative company workspaces. Export to PDF, Word, and more." />
      <meta name="keywords" content="meeting transcription, speaker identification, AI transcription, translation, team collaboration, company workspace, meeting notes, Gemini AI, PWA" />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
      <meta name="robots" content="index, follow" />

      
      {/* PWA Manifest - served as static file from public/ */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Standard icons */}
      {PWA_CONFIG.icons.map((icon) => (
        <link
          key={icon.src}
          rel="icon"
          type={icon.type}
          sizes={icon.sizes}
          href={icon.src}
        />
      ))}
      
      {/* Apple touch icons */}
      <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120x120-any.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152-any.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167-any.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180-any.png" />
      
      {/* iOS splash screens */}
      {PWA_CONFIG.splashScreens && PWA_CONFIG.splashScreens.map((splash) => (
        <link
          key={splash.src}
          rel="apple-touch-startup-image"
          href={splash.src}
          media={splash.media}
        />
      ))}
      
      {/* iOS meta tags for proper PWA experience */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={PWA_CONFIG.name} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Windows meta tags for tile images */}
      <meta name="msapplication-TileColor" content={PWA_CONFIG.themeColor} />
      <meta name="msapplication-tap-highlight" content="no" />
      <meta name="msapplication-config" content="none" />
      
      {/* OpenGraph meta tags for sharing */}
      <meta property="og:title" content="Dicta-Notes | AI Transcription for Collaborative Teams" />
      <meta property="og:description" content="Real-time transcription with Gemini 2.5 Pro, 10+ speaker ID, 130+ language translations, and company workspaces for seamless collaboration." />
      <meta property="og:image" content={PWA_CONFIG.icons.find(icon => icon.sizes === '512x512')?.src} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={PWA_CONFIG.name} />
      <meta property="og:url" content="https://dicta-notes.com" />
      
      {/* Twitter Card meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Dicta-Notes | AI Transcription for Collaborative Teams" />
      <meta name="twitter:description" content="Real-time transcription with Gemini 2.5 Pro, 10+ speaker ID, 130+ language translations, and company workspaces." />
      
      {/* Additional PWA-related tags */}
      <meta name="apple-touch-fullscreen" content="yes" />
      <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color={PWA_CONFIG.themeColor} />
      
      {/* Critical font preloading for mobile performance */}
      <link 
        rel="preload" 
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" 
        as="style" 
        onLoad="this.onload=null;this.rel='stylesheet'"
      />
      <noscript>
        {`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" />`}
      </noscript>
      
      {/* Critical CSS for faster initial paint */}
      <style>{`
        /* Critical font family override */
        body {
          font-family: 'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        /* Critical hero section styles for mobile */
        @media (max-width: 768px) {
          .hero-section {
            background: linear-gradient(135deg, 
              rgba(79, 70, 229, 0.1) 0%, 
              rgba(147, 51, 234, 0.1) 25%, 
              rgba(236, 72, 153, 0.1) 50%, 
              rgba(251, 191, 36, 0.1) 75%, 
              rgba(34, 197, 94, 0.1) 100%
            ) !important;
          }
        }
        
        /* Prevent layout shift for hero text */
        .hero-title {
          font-display: swap;
        }
      `}</style>
      
    </Helmet>
  );
}
