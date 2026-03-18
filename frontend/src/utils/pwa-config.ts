/**
 * PWA Configuration
 * 
 * Contains configuration for the Progressive Web App features
 * and utilities to generate the manifest dynamically.
 */

// PWA Configuration
export const PWA_CONFIG = {
  name: "Dicta-Notes",
  shortName: "Dicta-Notes",
  description: "Real-time meeting transcription with speaker identification powered by AI",
  themeColor: "#ffffff",
  backgroundColor: "#f8fafc",
  display: "standalone",
  prefer_related_applications: false,
  orientation: "portrait",
  scope: "/",
  startUrl: "/",
  categories: ["productivity", "business", "utilities"],
  icons: [
    {
      src: "/icons/icon-16x16-any.png",
      sizes: "16x16",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-32x32-any.png",
      sizes: "32x32",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-48x48-any.png",
      sizes: "48x48",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-72x72-any.png",
      sizes: "72x72",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-96x96-any.png",
      sizes: "96x96",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-120x120-any.png",
      sizes: "120x120",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-144x144-any.png",
      sizes: "144x144",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-150x150-any.png",
      sizes: "150x150",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-152x152-any.png",
      sizes: "152x152",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-167x167-any.png",
      sizes: "167x167",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-180x180-any.png",
      sizes: "180x180",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-192x192-any.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-192x192-maskable.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/icons/icon-256x256-any.png",
      sizes: "256x256",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-384x384-any.png",
      sizes: "384x384",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-512x512-any.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/icon-512x512-maskable.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/icons/icon-1024x1024-any.png",
      sizes: "1024x1024",
      type: "image/png",
      purpose: "any",
    },
  ],
  splashScreens: [
    {
      src: "/splash_screens/splash-iphone-xs-max.png",
      sizes: "1242x2688",
      type: "image/png",
      media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      src: "/splash_screens/splash-ipad-10-2-.png",
      sizes: "1620x2160",
      type: "image/png",
      media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)",
    },
    {
      src: "/splash_screens/splash-iphone-x.png",
      sizes: "1125x2436",
      type: "image/png",
      media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      src: "/splash_screens/splash-ipad-pro-11-.png",
      sizes: "1668x2388",
      type: "image/png",
      media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
    },
    {
      src: "/splash_screens/splash-ipad-10-5-.png",
      sizes: "1668x2224",
      type: "image/png",
      media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)",
    },
    {
      src: "/splash_screens/splash-iphone-8-plus.png",
      sizes: "1242x2208",
      type: "image/png",
      media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      src: "/splash_screens/splash-ipad-air-10-9-.png",
      sizes: "1640x2360",
      type: "image/png",
      media: "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2)",
    },
    {
      src: "/splash_screens/splash-iphone-xr.png",
      sizes: "828x1792",
      type: "image/png",
      media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
    },
    {
      src: "/splash_screens/splash-iphone-14.png",
      sizes: "1170x2532",
      type: "image/png",
      media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      src: "/splash_screens/splash-iphone-15-pro-max.png",
      sizes: "1290x2796",
      type: "image/png",
      media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      src: "/splash_screens/splash-iphone-8.png",
      sizes: "750x1334",
      type: "image/png",
      media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
    },
    {
      src: "/splash_screens/splash-ipad-pro-12-9-.png",
      sizes: "2048x2732",
      type: "image/png",
      media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
    },
    {
      src: "/splash_screens/splash-iphone-5.png",
      sizes: "640x1136",
      type: "image/png",
      media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
    },
    {
      src: "/splash_screens/splash-ipad-mini-8-3-.png",
      sizes: "1488x2266",
      type: "image/png",
      media: "(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2)",
    },
    {
      src: "/splash_screens/splash-iphone-15-pro.png",
      sizes: "1179x2556",
      type: "image/png",
      media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
    },
    {
      src: "/splash_screens/splash-ipad-9-7-.png",
      sizes: "1536x2048",
      type: "image/png",
      media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
    },
  ],
  screenshots: [
    // Simplified screenshots - using the same icon since we don't have actual screenshots yet
    {
      src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzAyODRjNyIgcng9IjEyOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTIlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgc3R5bGU9ImZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmOyBmb250LXNpemU6IDIwMHB4OyBmb250LXdlaWdodDogNzAwOyI+RE48L3RleHQ+PC9zdmc+",
      sizes: "1280x800",
      type: "image/svg+xml",
      form_factor: "wide", 
      label: "Transcribe meetings with AI"
    },
    {
      src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzAyODRjNyIgcng9IjEyOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTIlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgc3R5bGU9ImZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmOyBmb250LXNpemU6IDIwMHB4OyBmb250LXdlaWdodDogNzAwOyI+RE48L3RleHQ+PC9zdmc+",
      sizes: "750x1334",
      type: "image/svg+xml",
      form_factor: "narrow",
      label: "Real-time transcription"
    }
  ]
};

/**
 * Generates a Web Manifest JSON string from the PWA configuration
 */
export function generateManifest(): string {
  const manifest = {
    name: PWA_CONFIG.name,
    short_name: PWA_CONFIG.shortName,
    description: PWA_CONFIG.description,
    theme_color: PWA_CONFIG.themeColor,
    background_color: PWA_CONFIG.backgroundColor,
    display: PWA_CONFIG.display,
    orientation: PWA_CONFIG.orientation,
    scope: PWA_CONFIG.scope,
    start_url: PWA_CONFIG.startUrl,
    categories: PWA_CONFIG.categories,
    icons: PWA_CONFIG.icons.map(icon => ({
      src: icon.src,
      sizes: icon.sizes,
      type: icon.type,
      purpose: icon.purpose,
    })),
    screenshots: PWA_CONFIG.screenshots,
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Safely encodes a string to base64
 * Polyfills btoa for older browsers and handles Unicode characters
 */
export function safeBase64Encode(str: string): string {
  // Handle Unicode characters
  const encodedStr = encodeURIComponent(str).replace(
    /%([0-9A-F]{2})/g,
    (_, p1) => String.fromCharCode(parseInt(p1, 16))
  );
  
  // Use btoa if available, otherwise polyfill
  if (typeof btoa === 'function') {
    return btoa(encodedStr);
  } else {
    // Simple base64 polyfill for environments without btoa
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    for (
      let i = 0, block, charCode, idx = 0, map = chars;
      encodedStr.charAt(idx | 0) || (map = '=', idx % 1);
      idx += 3/4
    ) {
      block = ((charCode = encodedStr.charCodeAt(idx)) << 8 | 
        (encodedStr.charCodeAt(idx + 1) || 0)) << 8 | 
        (encodedStr.charCodeAt(idx + 2) || 0);
      for (i = 0; i < 4; i++) {
        if (idx * 8 / 6 < encodedStr.length) {
          output += map.charAt((block >>> (6 * (3 - i))) & 63);
        } else {
          output += '=';
        }
      }
    }
    return output;
  }
}
