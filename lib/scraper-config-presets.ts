/**
 * Scraper Configuration Presets
 *
 * Pre-configured scraper settings for common use cases.
 * Extracted from scraper-config.ts for better modularity.
 */

import type { ScraperConfig } from './scraper-config-schemas';

/**
 * Configuration presets for different scraping scenarios
 */
export const ConfigPresets = {
  /**
   * Fast extraction for well-structured sites
   */
  fast: {
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
  },

  /**
   * Thorough extraction for complex sites
   */
  thorough: {
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
  },

  /**
   * Stealth mode for sites with anti-bot measures
   */
  stealth: {
    performance: {
      concurrency: {
        maxConcurrentPages: 1,
        maxConcurrentDomains: 1,
        queueSize: 20,
        priorityQueuing: false,
      },
      delays: {
        minRequestDelay: 5000,
        maxRequestDelay: 15000,
        delayBetweenBatches: 20000,
        adaptiveDelayEnabled: true,
        delayMultiplier: 2.0,
      },
      timeouts: {
        script: 30000,
        navigation: 45000,
        idle: 15000,
        pageLoad: 45000,
        selector: 10000,
      },
      resources: {
        maxMemoryMB: 1024,
        maxCpuPercent: 50,
        blockImages: false,
        blockStyles: false,
        blockFonts: true,
        blockMedia: true,
        blockAnalytics: true,
      },
      caching: {
        enableResponseCache: false,
        cacheValidityMinutes: 5,
        maxCacheSize: 100,
        cacheStrategy: 'ttl' as const,
      },
    },
    rateLimiting: {
      perDomain: {
        requestsPerSecond: 0.5,
        requestsPerMinute: 20,
        burstSize: 2,
        cooldownMs: 5000,
      },
      global: {
        respectRobotsTxt: true,
        maxRequestsPerSecond: 2,
        maxActiveDoamins: 1,
        respectCrawlDelay: true,
      },
      backoff: {
        strategy: 'exponential' as const,
        initialDelayMs: 5000,
        maxDelayMs: 60000,
        multiplier: 2,
        jitter: true,
      },
      userAgents: {
        rotationEnabled: true,
        rotationInterval: 1,
        agents: [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ],
      },
    },
    browser: {
      viewport: {
        width: 1366,
        height: 768,
        deviceScaleFactor: 1,
        isMobile: false,
      },
      cookies: {
        acceptCookies: true,
        persistCookies: true,
      },
      headless: false,
      stealth: {
        enabled: true,
        evasions: [
          'chrome.runtime',
          'navigator.webdriver',
          'navigator.plugins',
          'navigator.permissions',
          'navigator.languages',
          'iframe.contentWindow',
          'media.codecs',
        ],
      },
      proxy: {
        enabled: false,
        rotateProxies: false,
        proxyList: [],
      },
    },
  },

  /**
   * E-commerce optimized
   */
  ecommerce: {
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
  },

  /**
   * Own site scraping (no restrictions)
   */
  ownSite: {
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
  },
};

export type PresetName = keyof typeof ConfigPresets;
