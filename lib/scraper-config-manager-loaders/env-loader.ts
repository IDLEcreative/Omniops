/**
 * Environment variable configuration loading
 */

import type { ScraperConfig } from '../scraper-config-schemas';

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
