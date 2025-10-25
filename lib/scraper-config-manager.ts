/**
 * Scraper Configuration Manager
 *
 * Advanced configuration management with hot reload, multiple sources,
 * and hierarchical priority system.
 * Extracted from scraper-config.ts for better modularity.
 */

import { ZodError } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { EventEmitter } from 'events';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScraperConfigSchema, type ScraperConfig } from './scraper-config-schemas';

// ============================================================================
// TYPES & ENUMS
// ============================================================================

/**
 * Configuration source priority (higher number = higher priority)
 */
enum ConfigPriority {
  DEFAULTS = 0,
  FILE = 1,
  DATABASE = 2,
  ENVIRONMENT = 3,
  RUNTIME = 4,
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  section: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  source: string;
}

/**
 * Platform-specific configuration type
 */
export type PlatformConfig = {
  selectors?: {
    productName?: string[];
    price?: string[];
    image?: string[];
    availability?: string[];
    sku?: string[];
    description?: string[];
    variants?: string[];
    specifications?: string[];
  };
  waitForSelectors?: string[];
  extractionPriority?: ('json-ld' | 'microdata' | 'dom' | 'learned-patterns')[];
};

// ============================================================================
// CONFIGURATION MANAGER
// ============================================================================

/**
 * Advanced configuration manager with hot reload and multiple sources
 */
export class ScraperConfigManager extends EventEmitter {
  private static instance: ScraperConfigManager;
  private config: ScraperConfig;
  private configSources: Map<ConfigPriority, Partial<ScraperConfig>> = new Map();
  private fileWatcher?: fs.FSWatcher;
  private supabase?: SupabaseClient;
  private customerId?: string;
  private configCache: Map<string, unknown> = new Map();
  private lastReload: number = 0;
  private reloadInterval: number = 60000; // 1 minute

  private constructor() {
    super();
    this.config = ScraperConfigSchema.parse({});
    this.initializeSources();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ScraperConfigManager {
    if (!ScraperConfigManager.instance) {
      ScraperConfigManager.instance = new ScraperConfigManager();
    }
    return ScraperConfigManager.instance;
  }

  /**
   * Initialize configuration sources
   */
  private async initializeSources() {
    // Load defaults
    this.configSources.set(ConfigPriority.DEFAULTS, this.getDefaultConfig());

    // Load from file if exists
    await this.loadFromFile();

    // Load from environment
    this.loadFromEnvironment();

    // Initialize database connection if credentials available
    this.initializeDatabase();

    // Merge all sources
    this.mergeConfigurations();

    // Set up file watching for hot reload
    this.setupFileWatcher();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): Partial<ScraperConfig> {
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

  /**
   * Load configuration from file
   */
  private async loadFromFile(filepath?: string): Promise<void> {
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
            this.configSources.set(ConfigPriority.FILE, parsedConfig);
            console.log(`Loaded configuration from ${configPath}`);
            break;
          }
        } catch (error) {
          console.error(`Error loading configuration from ${configPath}:`, error);
        }
      }
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
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
        this.setNestedProperty(envConfig, configPath, this.parseEnvValue(value));
      }
    }

    if (Object.keys(envConfig).length > 0) {
      this.configSources.set(ConfigPriority.ENVIRONMENT, envConfig);
    }
  }

  /**
   * Initialize database connection for config storage
   */
  private initializeDatabase(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Load configuration from database for a specific customer
   */
  async loadFromDatabase(customerId: string): Promise<void> {
    if (!this.supabase) {
      console.warn('Database not initialized, skipping database config load');
      return;
    }

    this.customerId = customerId;

    try {
      const { data, error } = await this.supabase
        .from('scraper_configs')
        .select('config')
        .eq('customer_id', customerId)
        .single();

      if (error) {
        console.error('Error loading config from database:', error);
        return;
      }

      if (data?.config) {
        this.configSources.set(ConfigPriority.DATABASE, data.config);
        this.mergeConfigurations();
        this.emit('configLoaded', { source: 'database', customerId });
      }
    } catch (error) {
      console.error('Error loading config from database:', error);
    }
  }

  /**
   * Save current configuration to database
   */
  async saveToDatabase(customerId?: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Database not initialized');
    }

    const targetCustomerId = customerId || this.customerId;
    if (!targetCustomerId) {
      throw new Error('Customer ID required to save configuration');
    }

    try {
      const { error } = await this.supabase
        .from('scraper_configs')
        .upsert({
          customer_id: targetCustomerId,
          config: this.config,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      this.emit('configSaved', { customerId: targetCustomerId });
    } catch (error) {
      console.error('Error saving config to database:', error);
      throw error;
    }
  }

  /**
   * Merge all configuration sources
   */
  private mergeConfigurations(): void {
    const priorities = [
      ConfigPriority.DEFAULTS,
      ConfigPriority.FILE,
      ConfigPriority.DATABASE,
      ConfigPriority.ENVIRONMENT,
      ConfigPriority.RUNTIME,
    ];

    let mergedConfig = {};

    for (const priority of priorities) {
      const source = this.configSources.get(priority);
      if (source) {
        mergedConfig = this.deepMerge(mergedConfig, source);
      }
    }

    // Validate and parse the merged configuration
    try {
      const oldConfig = this.config;
      this.config = ScraperConfigSchema.parse(mergedConfig);

      // Emit change events
      this.detectAndEmitChanges(oldConfig, this.config);
    } catch (error) {
      console.error('Invalid configuration after merge:', error);
    }
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result: any = { ...target };

    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Set nested property in object
   */
  private setNestedProperty(obj: Record<string, any>, path: string, value: unknown): void {
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
   * Parse environment variable value
   */
  private parseEnvValue(value: string): unknown {
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
   * Set up file watcher for hot reload
   */
  private setupFileWatcher(): void {
    const configPaths = [
      path.join(process.cwd(), 'scraper-config.yaml'),
      path.join(process.cwd(), 'scraper-config.yml'),
      path.join(process.cwd(), 'scraper-config.json'),
    ];

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        this.fileWatcher = fs.watch(configPath, async (eventType) => {
          if (eventType === 'change') {
            console.log('Configuration file changed, reloading...');
            await this.reload();
          }
        });
        break;
      }
    }
  }

  /**
   * Reload configuration from all sources
   */
  async reload(): Promise<void> {
    const now = Date.now();
    if (now - this.lastReload < 1000) {
      // Debounce rapid reloads
      return;
    }

    this.lastReload = now;

    // Clear runtime overrides
    this.configSources.delete(ConfigPriority.RUNTIME);

    // Reload from file
    await this.loadFromFile();

    // Reload from environment
    this.loadFromEnvironment();

    // Reload from database if customer ID is set
    if (this.customerId) {
      await this.loadFromDatabase(this.customerId);
    }

    // Merge all sources
    this.mergeConfigurations();

    this.emit('configReloaded');
  }

  /**
   * Detect and emit change events
   */
  private detectAndEmitChanges(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>, path: string = ''): void {
    for (const key in newConfig) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof newConfig[key] === 'object' && !Array.isArray(newConfig[key]) && newConfig[key] !== null) {
        if (oldConfig && typeof oldConfig[key] === 'object' && oldConfig[key] !== null && !Array.isArray(oldConfig[key])) {
          this.detectAndEmitChanges(oldConfig[key] as Record<string, unknown>, newConfig[key] as Record<string, unknown>, currentPath);
        }
      } else {
        if (!oldConfig || oldConfig[key] !== newConfig[key]) {
          this.emit('configChanged', {
            section: currentPath.split('.')[0],
            key: currentPath,
            oldValue: oldConfig?.[key],
            newValue: newConfig[key],
            source: 'merge',
          } as ConfigChangeEvent);
        }
      }
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get the current configuration
   */
  getConfig(): ScraperConfig {
    return this.config;
  }

  /**
   * Get a specific configuration section
   */
  getSection<K extends keyof ScraperConfig>(section: K): ScraperConfig[K] {
    return this.config[section];
  }

  /**
   * Get a configuration value by path
   */
  get(path: string): unknown {
    const keys = path.split('.');
    let current: any = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Set a runtime configuration override
   */
  set(path: string, value: unknown): void {
    const runtimeConfig = this.configSources.get(ConfigPriority.RUNTIME) || {};
    this.setNestedProperty(runtimeConfig, path, value);
    this.configSources.set(ConfigPriority.RUNTIME, runtimeConfig);
    this.mergeConfigurations();
  }

  /**
   * Update multiple configuration values
   */
  update(updates: Partial<ScraperConfig>): void {
    const runtimeConfig = this.configSources.get(ConfigPriority.RUNTIME) || {};
    const merged = this.deepMerge(runtimeConfig, updates);
    this.configSources.set(ConfigPriority.RUNTIME, merged);
    this.mergeConfigurations();
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.configSources.clear();
    this.configSources.set(ConfigPriority.DEFAULTS, this.getDefaultConfig());
    this.mergeConfigurations();
    this.emit('configReset');
  }

  /**
   * Validate a configuration object
   */
  validate(config: unknown): { valid: boolean; errors?: ZodError } {
    try {
      ScraperConfigSchema.parse(config);
      return { valid: true };
    } catch (error) {
      return { valid: false, errors: error instanceof ZodError ? error : undefined };
    }
  }

  /**
   * Export configuration to file
   */
  async exportToFile(filepath: string, format: 'json' | 'yaml' = 'yaml'): Promise<void> {
    let content: string;

    if (format === 'json') {
      content = JSON.stringify(this.config, null, 2);
    } else {
      content = yaml.dump(this.config);
    }

    await fs.promises.writeFile(filepath, content, 'utf-8');
    this.emit('configExported', { filepath, format });
  }

  /**
   * Get platform-specific configuration
   */
  getPlatformConfig(platform: string): PlatformConfig | undefined {
    return this.config.extraction.platformOverrides[platform] || {};
  }

  /**
   * Set platform-specific configuration
   */
  setPlatformConfig(platform: string, config: PlatformConfig): void {
    this.set(`extraction.platformOverrides.${platform}`, config);
  }

  /**
   * Get effective configuration for a URL
   */
  getEffectiveConfig(url: string): ScraperConfig {
    // This could be extended to apply domain-specific overrides
    // For now, return the base configuration
    return this.config;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const configManager = ScraperConfigManager.getInstance();
