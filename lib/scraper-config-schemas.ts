/**
 * Scraper Configuration Schemas
 *
 * Zod validation schemas for scraper configuration.
 * Extracted from scraper-config.ts for better modularity.
 */

import { z } from 'zod';

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Extraction settings schema
 */
export const ExtractionSettingsSchema = z.object({
  // Platform-specific selectors
  platformOverrides: z.record(z.string(), z.object({
    selectors: z.object({
      productName: z.array(z.string()).optional(),
      price: z.array(z.string()).optional(),
      image: z.array(z.string()).optional(),
      availability: z.array(z.string()).optional(),
      sku: z.array(z.string()).optional(),
      description: z.array(z.string()).optional(),
      variants: z.array(z.string()).optional(),
      specifications: z.array(z.string()).optional(),
    }).optional(),
    waitForSelectors: z.array(z.string()).optional(),
    extractionPriority: z.array(z.enum(['json-ld', 'microdata', 'dom', 'learned-patterns'])).optional(),
  })).default({}),

  // Extraction strategies
  strategies: z.object({
    jsonLdEnabled: z.boolean().default(true),
    microdataEnabled: z.boolean().default(true),
    domScrapingEnabled: z.boolean().default(true),
    patternLearningEnabled: z.boolean().default(true),
    fallbackChain: z.array(z.string()).default(['json-ld', 'microdata', 'learned-patterns', 'dom']),
  }).default({}),

  // Content filters
  filters: z.object({
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    excludeCategories: z.array(z.string()).default([]),
    includeCategories: z.array(z.string()).default([]),
    excludeOutOfStock: z.boolean().default(false),
    requireImages: z.boolean().default(false),
    requirePrice: z.boolean().default(true),
    minDescriptionLength: z.number().default(0),
    maxDescriptionLength: z.number().optional(),
  }).default({}),

  // Data enrichment
  enrichment: z.object({
    normalizeProductNames: z.boolean().default(true),
    extractColorFromImages: z.boolean().default(false),
    inferCategories: z.boolean().default(true),
    calculatePriceHistory: z.boolean().default(false),
    detectDuplicates: z.boolean().default(true),
  }).default({}),
});

/**
 * Performance tuning schema
 */
export const PerformanceSettingsSchema = z.object({
  // Concurrent pages
  concurrency: z.object({
    maxConcurrentPages: z.number().min(1).max(100).default(5),
    maxConcurrentDomains: z.number().min(1).max(20).default(3),
    queueSize: z.number().min(100).max(100000).default(1000),
    priorityQueuing: z.boolean().default(true),
  }).default({}),

  // Request delays
  delays: z.object({
    minRequestDelay: z.number().min(0).max(10000).default(100),
    maxRequestDelay: z.number().min(0).max(30000).default(2000),
    delayBetweenBatches: z.number().min(0).max(60000).default(5000),
    adaptiveDelayEnabled: z.boolean().default(true),
    delayMultiplier: z.number().min(1).max(5).default(1.5),
  }).default({}),

  // Timeout values
  timeouts: z.object({
    pageLoad: z.number().min(5000).max(120000).default(30000),
    navigation: z.number().min(5000).max(120000).default(30000),
    selector: z.number().min(1000).max(30000).default(10000),
    script: z.number().min(1000).max(30000).default(10000),
    idle: z.number().min(0).max(10000).default(2000),
  }).default({}),

  // Resource management
  resources: z.object({
    maxMemoryMB: z.number().min(512).max(8192).default(2048),
    maxCpuPercent: z.number().min(10).max(100).default(80),
    blockImages: z.boolean().default(false),
    blockStyles: z.boolean().default(false),
    blockFonts: z.boolean().default(true),
    blockMedia: z.boolean().default(true),
    blockAnalytics: z.boolean().default(true),
  }).default({}),

  // Caching
  caching: z.object({
    enableResponseCache: z.boolean().default(true),
    cacheValidityMinutes: z.number().min(0).max(1440).default(60),
    maxCacheSize: z.number().min(0).max(10000).default(1000),
    cacheStrategy: z.enum(['lru', 'lfu', 'ttl']).default('lru'),
  }).default({}),
});

/**
 * Pattern learning settings schema
 */
export const PatternLearningSchema = z.object({
  enabled: z.boolean().default(true),

  // Learning thresholds
  thresholds: z.object({
    minConfidence: z.number().min(0).max(1).default(0.7),
    minSamples: z.number().min(1).max(100).default(5),
    successRateThreshold: z.number().min(0).max(1).default(0.8),
    patternAgeMaxDays: z.number().min(1).max(365).default(30),
  }).default({}),

  // Pattern management
  patterns: z.object({
    maxPatternsPerDomain: z.number().min(10).max(1000).default(100),
    maxPatternsTotal: z.number().min(100).max(100000).default(10000),
    autoCleanupEnabled: z.boolean().default(true),
    mergeSimilarPatterns: z.boolean().default(true),
  }).default({}),

  // Learning behavior
  behavior: z.object({
    learnFromFailures: z.boolean().default(true),
    adaptToChanges: z.boolean().default(true),
    shareAcrossDomains: z.boolean().default(false),
    persistToDatabase: z.boolean().default(true),
  }).default({}),
});

/**
 * Rate limiting settings schema
 */
export const RateLimitingSchema = z.object({
  // Per-domain limits
  perDomain: z.object({
    requestsPerSecond: z.number().min(0.1).max(100).default(2),
    requestsPerMinute: z.number().min(1).max(1000).default(60),
    burstSize: z.number().min(1).max(100).default(10),
    cooldownMs: z.number().min(0).max(60000).default(1000),
  }).default({}),

  // Global limits
  global: z.object({
    maxRequestsPerSecond: z.number().min(1).max(1000).default(20),
    maxActiveDoamins: z.number().min(1).max(100).default(10),
    respectRobotsTxt: z.boolean().default(true),
    respectCrawlDelay: z.boolean().default(true),
  }).default({}),

  // Backoff strategies
  backoff: z.object({
    strategy: z.enum(['exponential', 'linear', 'constant', 'adaptive']).default('exponential'),
    initialDelayMs: z.number().min(100).max(10000).default(1000),
    maxDelayMs: z.number().min(1000).max(300000).default(60000),
    multiplier: z.number().min(1).max(5).default(2),
    jitter: z.boolean().default(true),
  }).default({}),

  // User agent rotation
  userAgents: z.object({
    rotationEnabled: z.boolean().default(true),
    rotationInterval: z.number().min(1).max(100).default(10),
    agents: z.array(z.string()).default([
      'Mozilla/5.0 (compatible; CustomerServiceBot/1.0)',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    ]),
  }).default({}),
});

/**
 * Browser settings schema
 */
export const BrowserSettingsSchema = z.object({
  headless: z.boolean().default(true),

  viewport: z.object({
    width: z.number().min(320).max(3840).default(1920),
    height: z.number().min(240).max(2160).default(1080),
    deviceScaleFactor: z.number().min(1).max(3).default(1),
    isMobile: z.boolean().default(false),
  }).default({}),

  stealth: z.object({
    enabled: z.boolean().default(true),
    evasions: z.array(z.string()).default([
      'chrome.runtime',
      'navigator.webdriver',
      'navigator.plugins',
      'iframe.contentWindow',
    ]),
  }).default({}),

  cookies: z.object({
    acceptCookies: z.boolean().default(true),
    persistCookies: z.boolean().default(false),
    cookieFile: z.string().optional(),
  }).default({}),

  proxy: z.object({
    enabled: z.boolean().default(false),
    url: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    rotateProxies: z.boolean().default(false),
    proxyList: z.array(z.string()).default([]),
  }).default({}),
});

/**
 * Complete scraper configuration schema
 */
export const ScraperConfigSchema = z.object({
  // Configuration metadata
  version: z.string().default('1.0.0'),
  name: z.string().optional(),
  description: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production']).default('development'),

  // Main configuration sections
  extraction: ExtractionSettingsSchema.default({}),
  performance: PerformanceSettingsSchema.default({}),
  patternLearning: PatternLearningSchema.default({}),
  rateLimiting: RateLimitingSchema.default({}),
  browser: BrowserSettingsSchema.default({}),

  // Feature flags
  features: z.object({
    enableEcommerce: z.boolean().default(true),
    enablePatternLearning: z.boolean().default(true),
    enableAdaptiveDelays: z.boolean().default(true),
    enableMemoryManagement: z.boolean().default(true),
    enableErrorRecovery: z.boolean().default(true),
    enableMetrics: z.boolean().default(true),
  }).default({}),

  // Logging
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    logToFile: z.boolean().default(false),
    logFile: z.string().optional(),
    logRotation: z.boolean().default(true),
    maxLogSizeMB: z.number().default(100),
  }).default({}),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;
export type ExtractionSettings = z.infer<typeof ExtractionSettingsSchema>;
export type PerformanceSettings = z.infer<typeof PerformanceSettingsSchema>;
export type PatternLearningSettings = z.infer<typeof PatternLearningSchema>;
export type RateLimitingSettings = z.infer<typeof RateLimitingSchema>;
export type BrowserSettings = z.infer<typeof BrowserSettingsSchema>;
