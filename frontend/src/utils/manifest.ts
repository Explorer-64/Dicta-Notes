/**
 * Configuration: manifest
 * 
 * Description:
 * Web App Manifest configuration for Progressive Web App (PWA) functionality.
 * Defines the app's appearance and behavior when installed on devices.
 * Uses PWA_CONFIG to maintain consistency across the application.
 * 
 * Dependencies:
 * - Configurations:
 *   - PWA_CONFIG (from './pwa-config')
 * 
 * Interfaces:
 * ```typescript
 * interface WebAppManifest {
 *   name: string
 *   short_name: string
 *   description: string
 *   theme_color: string
 *   background_color: string
 *   display: string
 *   scope: string
 *   start_url: string
 *   icons: Array<{
 *     src: string
 *     sizes: string
 *     type: string
 *     purpose: string
 *   }>
 * }
 * ```
 * 
 * Exports:
 * - manifest: WebAppManifest
 *   Complete manifest configuration object
 * 
 * Features:
 * - PWA configuration
 * - App icon definitions
 * - Theme colors
 * - Display modes
 * 
 * References:
 * - MDN Web App Manifest: https://developer.mozilla.org/en-US/docs/Web/Manifest
 * 
 * Usage:
 * This configuration is typically used by the build system to generate
 * the manifest.json file for PWA functionality.
 */

import { PWA_CONFIG } from './pwa-config';

// Interface matching the Web App Manifest specification
interface WebAppManifest {
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  display: string;
  scope: string;
  start_url: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose: string;
  }>;
}

// Use the same configuration as PWA_CONFIG to ensure consistency
export const manifest: WebAppManifest = {
  "name": PWA_CONFIG.name,
  "short_name": PWA_CONFIG.shortName,
  "description": PWA_CONFIG.description,
  "theme_color": PWA_CONFIG.themeColor,
  "background_color": PWA_CONFIG.backgroundColor,
  "display": PWA_CONFIG.display,
  "scope": PWA_CONFIG.scope,
  "start_url": PWA_CONFIG.startUrl,
  "icons": PWA_CONFIG.icons
};