/**
 * E-commerce Scraper Presets
 *
 * E-commerce and own-site preset configurations.
 * Extracted from scraper-config-presets.ts for modularity.
 */

import type { ScraperConfig } from './scraper-config-schemas';

/**
 * E-commerce optimized preset
 */
export const ecommercePreset: Partial<ScraperConfig> = {
  extraction: {
    platformOverrides: {},
    strategies: {
      jsonLdEnabled: true,
      microdataEnabled: true,
      domScrapingEnabled: true,
      patternLearningEnabled: true,
      fallbackChain: ['json-ld', 'microdata', 'dom', 'learned-patterns'],
    },
    filters: {
      minPrice: 0,
      excludeCategories: [],
      includeCategories: [],
      excludeOutOfStock: false,
      requireImages: true,
      requirePrice: true,
      minDescriptionLength: 5,
    },
    enrichment: {
      normalizeProductNames: true,
      extractColorFromImages: false,
      inferCategories: true,
      calculatePriceHistory: false,
      detectDuplicates: true,
    },
  },
  performance: {
    concurrency: {
      maxConcurrentPages: 5,
      maxConcurrentDomains: 2,
      queueSize: 100,
      priorityQueuing: true,
    },
    delays: {
      minRequestDelay: 1000,
      maxRequestDelay: 3000,
      delayBetweenBatches: 5000,
      adaptiveDelayEnabled: true,
      delayMultiplier: 1.2,
    },
    timeouts: {
      script: 15000,
      navigation: 30000,
      idle: 5000,
      pageLoad: 30000,
      selector: 10000,
    },
    resources: {
      maxMemoryMB: 1024,
      maxCpuPercent: 60,
      blockImages: false, // Need images for products
      blockStyles: false, // Need styles for layout detection
      blockFonts: true,
      blockMedia: true,
      blockAnalytics: true,
    },
    caching: {
      enableResponseCache: true,
      cacheValidityMinutes: 60,
      maxCacheSize: 1000,
      cacheStrategy: 'lru' as const,
    },
  },
  patternLearning: {
    enabled: true,
    behavior: {
      learnFromFailures: true,
      adaptToChanges: true,
      shareAcrossDomains: false,
      persistToDatabase: true,
    },
    patterns: {
      maxPatternsPerDomain: 100,
      maxPatternsTotal: 1000,
      autoCleanupEnabled: true,
      mergeSimilarPatterns: true,
    },
    thresholds: {
      minConfidence: 0.7,
      minSamples: 5,
      successRateThreshold: 0.8,
      patternAgeMaxDays: 30,
    },
  },
};

/**
 * Own site scraping (no restrictions)
 */
export const ownSitePreset: Partial<ScraperConfig> = {
  performance: {
    concurrency: {
      maxConcurrentPages: 50,
      maxConcurrentDomains: 10,
      queueSize: 500,
      priorityQueuing: false,
    },
    delays: {
      minRequestDelay: 0,
      maxRequestDelay: 0,
      delayBetweenBatches: 0,
      adaptiveDelayEnabled: false,
      delayMultiplier: 1.0,
    },
    timeouts: {
      script: 5000,
      navigation: 10000,
      idle: 2000,
      pageLoad: 10000,
      selector: 2000,
    },
    resources: {
      maxMemoryMB: 4096,
      maxCpuPercent: 90,
      blockImages: false,
      blockStyles: false,
      blockFonts: false,
      blockMedia: false,
      blockAnalytics: false,
    },
    caching: {
      enableResponseCache: true,
      cacheValidityMinutes: 240,
      maxCacheSize: 5000,
      cacheStrategy: 'lru' as const,
    },
  },
  rateLimiting: {
    perDomain: {
      requestsPerSecond: 100,
      requestsPerMinute: 6000,
      burstSize: 50,
      cooldownMs: 0,
    },
    global: {
      respectRobotsTxt: false,
      maxRequestsPerSecond: 500,
      maxActiveDoamins: 20,
      respectCrawlDelay: false,
    },
    backoff: {
      strategy: 'constant' as const,
      initialDelayMs: 0,
      maxDelayMs: 0,
      multiplier: 1,
      jitter: false,
    },
    userAgents: {
      rotationEnabled: false,
      rotationInterval: 100,
      agents: [
        'Mozilla/5.0 (compatible; InternalBot/1.0)',
      ],
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
      acceptCookies: false,
      persistCookies: false,
    },
    headless: true,
    stealth: {
      enabled: false,
      evasions: [],
    },
    proxy: {
      enabled: false,
      rotateProxies: false,
      proxyList: [],
    },
  },
};
