import { useEffect, useState } from "react";
import { generateManifest } from "utils/pwa-manifest";

/**
 * Adds PWA meta tags to the document head
 * This component should be mounted in the app layout
 */
export const PWAMetaTags = () => {
  const [manifestUrl, setManifestUrl] = useState("");

  useEffect(() => {
    // Generate dynamic manifest
    const url = generateManifest();
    setManifestUrl(url);

    // Add manifest link
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = url;
    document.head.appendChild(manifestLink);

    // Add theme-color meta tag
    if (!document.querySelector('meta[name="theme-color"]')) {
      const themeColorMeta = document.createElement("meta");
      themeColorMeta.name = "theme-color";
      themeColorMeta.content = "#0284c7";
      document.head.appendChild(themeColorMeta);
    }

    // Add Apple meta tags
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const appleMeta = document.createElement("meta");
      appleMeta.name = "apple-mobile-web-app-capable";
      appleMeta.content = "yes";
      document.head.appendChild(appleMeta);

      const appleStatusMeta = document.createElement("meta");
      appleStatusMeta.name = "apple-mobile-web-app-status-bar-style";
      appleStatusMeta.content = "default";
      document.head.appendChild(appleStatusMeta);

      const appleTitleMeta = document.createElement("meta");
      appleTitleMeta.name = "apple-mobile-web-app-title";
      appleTitleMeta.content = "Dicta-Notes";
      document.head.appendChild(appleTitleMeta);
    }

    // Add Apple touch icon
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const appleTouchIcon = document.createElement("link");
      appleTouchIcon.rel = "apple-touch-icon";
      appleTouchIcon.href = "/icons/apple-touch-icon.png";
      document.head.appendChild(appleTouchIcon);
    }

    // Cleanup function
    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default PWAMetaTags;