/**
 * Scraper Configuration Manager - Loaders Module
 *
 * Handles loading configuration from different sources:
 * - File system (JSON/YAML)
 * - Environment variables
 * - Database (Supabase)
 *
 * Extracted from scraper-config-manager.ts for modularity.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScraperConfig } from './scraper-config-schemas';

// ============================================================================
// CONFIGURATION PRIORITY
// ============================================================================

/**
 * Configuration source priority (higher number = higher priority)
 */
export enum ConfigPriority {
  DEFAULTS = 0,
  FILE = 1,
  DATABASE = 2,
  ENVIRONMENT = 3,
  RUNTIME = 4,
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

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

// ============================================================================
// FILE LOADING
// ============================================================================

/**
 * Load configuration from file
 */
export async function loadFromFile(filepath?: string): Promise<Partial<ScraperConfig> | null> {
  const configPaths = [
    filepath,
    path.join(process.cwd(), 'scraper-config.yaml'),
    path.join(process.cwd(), 'scraper-config.yml'),
    path.join(process.cwd(), 'scraper-config.json'),
    path.join(process.cwd(), '.scraper-config.yaml'),
    path.join(process.cwd(), '.scraper-config.json'),
  ].filter(Boolean) as string[];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        let parsedConfig: unknown;

        if (configPath.endsWith('.json')) {
          parsedConfig = JSON.parse(fileContent);
        } else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
          parsedConfig = yaml.load(fileContent);
        }

        if (parsedConfig) {
          console.log(`Loaded configuration from ${configPath}`);
          return parsedConfig;
        }
      } catch (error) {
        console.error(`Error loading configuration from ${configPath}:`, error);
      }
    }
  }

  return null;
}

// ============================================================================
// ENVIRONMENT LOADING
// ============================================================================

/**
 * Parse environment variable value
 */
function parseEnvValue(value: string): unknown {
  // Try to parse as JSON
  try {
    return JSON.parse(value);
  } catch {
    // Not JSON
  }

  // Check for boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Check for number
  const num = Number(value);
  if (!isNaN(num)) return num;

  // Return as string
  return value;
}

/**
 * Set nested property in object
 */
export function setNestedProperty(obj: Record<string, any>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current: any = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // Handle array notation
    if (key && key.includes('[')) {
      const parts = key.split('[');
      const arrayKey = parts[0];
      const indexStr = parts[1];

      if (arrayKey && indexStr) {
        const index = parseInt(indexStr.replace(']', ''));

        if (!current[arrayKey]) {
          current[arrayKey] = [];
        }

        const arr = current[arrayKey] as any[];
        if (!arr[index]) {
          arr[index] = {};
        }

        current = arr[index] as Record<string, unknown> || {};
      }
    } else if (key) {
      if (!current[key]) {
        current[key] = {};
      }
      current = (current[key] as Record<string, unknown>) || {};
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey && lastKey.includes('[')) {
    const parts = lastKey.split('[');
    const arrayKey = parts[0];
    const indexStr = parts[1];
    if (arrayKey && indexStr) {
      const index = parseInt(indexStr.replace(']', ''));

      if (!current[arrayKey]) {
        current[arrayKey] = [];
      }

      if (!isNaN(index)) {
        (current[arrayKey] as any[])[index] = value;
      }
    }
  } else if (lastKey) {
    current[lastKey] = value;
  }
}

/**
 * Load configuration from environment variables
 */
export function loadFromEnvironment(): Partial<ScraperConfig> {
  const envConfig: Record<string, unknown> = {};

  // Map environment variables to configuration
  const envMappings = {
    'SCRAPER_MAX_CONCURRENT_PAGES': 'performance.concurrency.maxConcurrentPages',
    'SCRAPER_MIN_DELAY': 'performance.delays.minRequestDelay',
    'SCRAPER_MAX_DELAY': 'performance.delays.maxRequestDelay',
    'SCRAPER_PAGE_TIMEOUT': 'performance.timeouts.pageLoad',
    'SCRAPER_REQUESTS_PER_SECOND': 'rateLimiting.perDomain.requestsPerSecond',
    'SCRAPER_RESPECT_ROBOTS': 'rateLimiting.global.respectRobotsTxt',
    'SCRAPER_HEADLESS': 'browser.headless',
    'SCRAPER_USER_AGENT': 'rateLimiting.userAgents.agents[0]',
    'SCRAPER_ENABLE_PATTERNS': 'patternLearning.enabled',
    'SCRAPER_MIN_CONFIDENCE': 'patternLearning.thresholds.minConfidence',
    'SCRAPER_BLOCK_IMAGES': 'performance.resources.blockImages',
    'SCRAPER_PROXY_URL': 'browser.proxy.url',
    'SCRAPER_LOG_LEVEL': 'logging.level',
  };

  for (const [envVar, configPath] of Object.entries(envMappings)) {
    const value = process.env[envVar];
    if (value !== undefined) {
      setNestedProperty(envConfig, configPath, parseEnvValue(value));
    }
  }

  return envConfig;
}

// ============================================================================
// DATABASE LOADING
// ============================================================================

/**
 * Load configuration from database for a specific domain config
 */
export async function loadFromDatabase(
  supabase: SupabaseClient,
  domainConfigId: string
): Promise<Partial<ScraperConfig> | null> {
  try {
    const { data, error } = await supabase
      .from('scraper_configs')
      .select('config')
      .eq('domain_config_id', domainConfigId)
      .single();

    if (error) {
      console.error('Error loading config from database:', error);
      return null;
    }

    if (data?.config) {
      return data.config;
    }

    return null;
  } catch (error) {
    console.error('Error loading config from database:', error);
    return null;
  }
}
