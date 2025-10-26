/**
 * Scraper Configuration Presets
 *
 * Pre-configured scraper settings for common use cases.
 * Main export file consolidating all preset categories.
 *
 * REFACTORED: Split into specialized modules:
 * - scraper-config-presets-performance.ts (fast, thorough)
 * - scraper-config-presets-stealth.ts (stealth)
 * - scraper-config-presets-ecommerce.ts (ecommerce, ownSite)
 */

import { fastPreset, thoroughPreset } from './scraper-config-presets-performance';
import { stealthPreset } from './scraper-config-presets-stealth';
import { ecommercePreset, ownSitePreset } from './scraper-config-presets-ecommerce';

/**
 * Configuration presets for different scraping scenarios
 */
export const ConfigPresets = {
  /**
   * Fast extraction for well-structured sites
   */
  fast: fastPreset,

  /**
   * Thorough extraction for complex sites
   */
  thorough: thoroughPreset,

  /**
   * Stealth mode for sites with anti-bot measures
   */
  stealth: stealthPreset,

  /**
   * E-commerce optimized
   */
  ecommerce: ecommercePreset,

  /**
   * Own site scraping (no restrictions)
   */
  ownSite: ownSitePreset,
};

export type PresetName = keyof typeof ConfigPresets;

// Re-export individual presets for direct access
export {
  fastPreset,
  thoroughPreset,
  stealthPreset,
  ecommercePreset,
  ownSitePreset,
};
