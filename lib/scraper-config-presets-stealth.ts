/**
 * Stealth-focused Scraper Presets
 *
 * Stealth preset configuration for anti-bot evasion.
 * Extracted from scraper-config-presets.ts for modularity.
 */

import type { ScraperConfig } from './scraper-config-schemas';

/**
 * Stealth mode for sites with anti-bot measures
 */
export const stealthPreset: Partial<ScraperConfig> = {
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
};
