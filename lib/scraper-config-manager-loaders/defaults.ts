/**
 * Default configuration values
 */

import type { ScraperConfig } from '../scraper-config-schemas';

/**
 * Get default configuration
 */
export function getDefaultConfig(): Partial<ScraperConfig> {
  return {
    version: '1.0.0',
    environment: 'development',
    extraction: {
      strategies: {
        jsonLdEnabled: true,
        microdataEnabled: true,
        domScrapingEnabled: true,
        patternLearningEnabled: true,
        fallbackChain: ['json-ld', 'microdata', 'learned-patterns', 'dom'],
      },
      filters: {
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
        inferCategories: true,
        calculatePriceHistory: false,
        detectDuplicates: true,
      },
      platformOverrides: {},
    },
    performance: {
      concurrency: {
        maxConcurrentPages: 5,
        maxConcurrentDomains: 3,
        queueSize: 100,
        priorityQueuing: false,
      },
      delays: {
        minRequestDelay: 100,
        maxRequestDelay: 2000,
        delayBetweenBatches: 5000,
        adaptiveDelayEnabled: true,
        delayMultiplier: 1.5,
      },
      timeouts: {
        script: 10000,
        navigation: 30000,
        idle: 5000,
        pageLoad: 30000,
        selector: 5000,
      },
      caching: {
        enableResponseCache: true,
        cacheValidityMinutes: 60,
        maxCacheSize: 100,
        cacheStrategy: 'lru' as const,
      },
      resources: {
        maxMemoryMB: 512,
        maxCpuPercent: 50,
        blockImages: false,
        blockStyles: false,
        blockFonts: false,
        blockMedia: false,
        blockAnalytics: false,
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
    rateLimiting: {
      perDomain: {
        requestsPerSecond: 2,
        requestsPerMinute: 60,
        burstSize: 5,
        cooldownMs: 1000,
      },
      global: {
        respectRobotsTxt: true,
        maxRequestsPerSecond: 10,
        maxActiveDoamins: 5,
        respectCrawlDelay: true,
      },
      backoff: {
        strategy: 'exponential',
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        multiplier: 2,
        jitter: true,
      },
      userAgents: {
        rotationEnabled: true,
        rotationInterval: 10,
        agents: [],
      },
    },
    browser: {
      headless: true,
      viewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
      },
      cookies: {
        acceptCookies: true,
        persistCookies: false,
      },
      proxy: {
        enabled: false,
        rotateProxies: false,
        proxyList: [],
      },
      stealth: {
        enabled: true,
        evasions: [
          'chrome.app',
          'chrome.csi',
          'chrome.loadTimes',
          'chrome.runtime',
          'iframe.contentWindow',
          'media.codecs',
          'navigator.hardwareConcurrency',
          'navigator.languages',
          'navigator.permissions',
          'navigator.platform',
          'navigator.plugins',
          'navigator.webdriver',
          'window.outerHeight',
          'window.outerWidth'
        ],
      },
    },
  };
}
