/**
 * Performance-focused Scraper Presets
 *
 * Fast and thorough preset configurations.
 * Extracted from scraper-config-presets.ts for modularity.
 */

import type { ScraperConfig } from './scraper-config-schemas';

/**
 * Fast extraction for well-structured sites
 */
export const fastPreset: Partial<ScraperConfig> = {
  performance: {
    concurrency: {
      maxConcurrentPages: 20,
      maxConcurrentDomains: 5,
      queueSize: 200,
      priorityQueuing: false,
    },
    delays: {
      minRequestDelay: 0,
      maxRequestDelay: 500,
      delayBetweenBatches: 1000,
      adaptiveDelayEnabled: false,
      delayMultiplier: 1.0,
    },
    timeouts: {
      script: 5000,
      navigation: 15000,
      idle: 3000,
      pageLoad: 15000,
      selector: 3000,
    },
    resources: {
      maxMemoryMB: 512,
      maxCpuPercent: 50,
      blockImages: true,
      blockStyles: true,
      blockFonts: true,
      blockMedia: true,
      blockAnalytics: true,
    },
    caching: {
      enableResponseCache: true,
      cacheValidityMinutes: 30,
      maxCacheSize: 500,
      cacheStrategy: 'lru' as const,
    },
  },
  extraction: {
    platformOverrides: {},
    strategies: {
      jsonLdEnabled: true,
      microdataEnabled: false,
      domScrapingEnabled: false,
      patternLearningEnabled: true,
      fallbackChain: ['json-ld', 'learned-patterns'],
    },
    filters: {
      minPrice: 0,
      excludeCategories: [],
      includeCategories: [],
      excludeOutOfStock: false,
      requireImages: false,
      requirePrice: true,
      minDescriptionLength: 0,
    },
    enrichment: {
      normalizeProductNames: true,
      extractColorFromImages: false,
      inferCategories: false,
      calculatePriceHistory: false,
      detectDuplicates: true,
    },
  },
};

/**
 * Thorough extraction for complex sites
 */
export const thoroughPreset: Partial<ScraperConfig> = {
  performance: {
    concurrency: {
      maxConcurrentPages: 3,
      maxConcurrentDomains: 1,
      queueSize: 50,
      priorityQueuing: true,
    },
    delays: {
      minRequestDelay: 2000,
      maxRequestDelay: 5000,
      delayBetweenBatches: 10000,
      adaptiveDelayEnabled: true,
      delayMultiplier: 1.5,
    },
    timeouts: {
      script: 20000,
      navigation: 60000,
      idle: 10000,
      pageLoad: 60000,
      selector: 20000,
    },
    resources: {
      maxMemoryMB: 2048,
      maxCpuPercent: 70,
      blockImages: false,
      blockStyles: false,
      blockFonts: false,
      blockMedia: false,
      blockAnalytics: false,
    },
    caching: {
      enableResponseCache: true,
      cacheValidityMinutes: 120,
      maxCacheSize: 2000,
      cacheStrategy: 'lru' as const,
    },
  },
  extraction: {
    platformOverrides: {},
    strategies: {
      jsonLdEnabled: true,
      microdataEnabled: true,
      domScrapingEnabled: true,
      patternLearningEnabled: true,
      fallbackChain: ['json-ld', 'microdata', 'learned-patterns', 'dom'],
    },
    filters: {
      minPrice: 0,
      excludeCategories: [],
      includeCategories: [],
      excludeOutOfStock: true,
      requireImages: true,
      requirePrice: true,
      minDescriptionLength: 10,
    },
    enrichment: {
      normalizeProductNames: true,
      extractColorFromImages: true,
      inferCategories: true,
      calculatePriceHistory: true,
      detectDuplicates: true,
    },
  },
  browser: {
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
    },
    cookies: {
      acceptCookies: true,
      persistCookies: true,
    },
    headless: true,
    stealth: {
      enabled: true,
      evasions: ['chrome.runtime', 'navigator.webdriver'],
    },
    proxy: {
      enabled: false,
      rotateProxies: false,
      proxyList: [],
    },
  },
};
