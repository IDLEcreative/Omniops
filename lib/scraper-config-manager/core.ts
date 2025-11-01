/**
 * Core Configuration Manager
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import type { SupabaseClient } from '@/types/supabase';
import { ScraperConfigSchema, type ScraperConfig } from '../scraper-config-schemas';
import {
  ConfigPriority,
  getDefaultConfig,
  loadFromFile,
  loadFromEnvironment,
  loadFromDatabase,
  setNestedProperty,
} from '../scraper-config-manager-loaders';
import {
  saveToDatabase,
  exportToFile,
  validateConfig,
  deepMerge,
  detectChanges,
  getValueByPath,
  type ConfigChangeEvent,
  type PlatformConfig,
} from '../scraper-config-manager-persistence';
import { createServiceRoleClientSync } from '../supabase/server';

// Re-export types
export type { ConfigChangeEvent, PlatformConfig };

/**
 * Advanced configuration manager with hot reload and multiple sources
 */
export class ScraperConfigManager extends EventEmitter {
  private static instance: ScraperConfigManager;
  private config: ScraperConfig;
  private configSources: Map<ConfigPriority, Partial<ScraperConfig>> = new Map();
  private fileWatcher?: fs.FSWatcher;
  private supabase?: SupabaseClient | null;
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
    this.configSources.set(ConfigPriority.DEFAULTS, getDefaultConfig());

    // Load from file if exists
    const fileConfig = await loadFromFile();
    if (fileConfig) {
      this.configSources.set(ConfigPriority.FILE, fileConfig);
    }

    // Load from environment
    const envConfig = loadFromEnvironment();
    if (Object.keys(envConfig).length > 0) {
      this.configSources.set(ConfigPriority.ENVIRONMENT, envConfig);
    }

    // Initialize database connection if credentials available
    this.initializeDatabase();

    // Merge all sources
    this.mergeConfigurations();

    // Set up file watching for hot reload
    this.setupFileWatcher();
  }

  /**
   * Initialize database connection for config storage
   */
  private initializeDatabase(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createServiceRoleClientSync();
    }
  }

  /**
   * Load configuration from database for a specific customer
   */
  async loadCustomerConfig(customerId: string): Promise<void> {
    if (!this.supabase) {
      console.warn('Database not initialized, skipping database config load');
      return;
    }

    this.customerId = customerId;

    const dbConfig = await loadFromDatabase(this.supabase, customerId);
    if (dbConfig) {
      this.configSources.set(ConfigPriority.DATABASE, dbConfig);
      this.mergeConfigurations();
      this.emit('configLoaded', { source: 'database', customerId });
    }
  }

  /**
   * Save current configuration to database
   */
  async saveConfig(customerId?: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Database not initialized');
    }

    const targetCustomerId = customerId || this.customerId;
    if (!targetCustomerId) {
      throw new Error('Customer ID required to save configuration');
    }

    await saveToDatabase(this.supabase, targetCustomerId, this.config);
    this.emit('configSaved', { customerId: targetCustomerId });
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
        mergedConfig = deepMerge(mergedConfig, source);
      }
    }

    // Validate and parse the merged configuration
    try {
      const oldConfig = this.config;
      this.config = ScraperConfigSchema.parse(mergedConfig);

      // Emit change events
      const changes = detectChanges(oldConfig, this.config);
      changes.forEach(change => this.emit('configChanged', change));
    } catch (error) {
      console.error('Invalid configuration after merge:', error);
    }
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
    const fileConfig = await loadFromFile();
    if (fileConfig) {
      this.configSources.set(ConfigPriority.FILE, fileConfig);
    }

    // Reload from environment
    const envConfig = loadFromEnvironment();
    if (Object.keys(envConfig).length > 0) {
      this.configSources.set(ConfigPriority.ENVIRONMENT, envConfig);
    }

    // Reload from database if customer ID is set
    if (this.customerId && this.supabase) {
      const dbConfig = await loadFromDatabase(this.supabase, this.customerId);
      if (dbConfig) {
        this.configSources.set(ConfigPriority.DATABASE, dbConfig);
      }
    }

    // Merge all sources
    this.mergeConfigurations();

    this.emit('configReloaded');
  }

  // Getters and setters
  getConfig(): ScraperConfig {
    return this.config;
  }

  getSection<K extends keyof ScraperConfig>(section: K): ScraperConfig[K] {
    return this.config[section];
  }

  get(path: string): unknown {
    return getValueByPath(this.config, path);
  }

  set(path: string, value: unknown): void {
    const runtimeConfig = this.configSources.get(ConfigPriority.RUNTIME) || {};
    setNestedProperty(runtimeConfig, path, value);
    this.configSources.set(ConfigPriority.RUNTIME, runtimeConfig);
    this.mergeConfigurations();
  }

  update(updates: Partial<ScraperConfig>): void {
    const runtimeConfig = this.configSources.get(ConfigPriority.RUNTIME) || {};
    const merged = deepMerge(runtimeConfig, updates);
    this.configSources.set(ConfigPriority.RUNTIME, merged);
    this.mergeConfigurations();
  }

  reset(): void {
    this.configSources.clear();
    this.configSources.set(ConfigPriority.DEFAULTS, getDefaultConfig());
    this.mergeConfigurations();
    this.emit('configReset');
  }

  validate(config: unknown): { valid: boolean; errors?: any } {
    return validateConfig(config);
  }

  async exportConfig(filepath: string, format: 'json' | 'yaml' = 'yaml'): Promise<void> {
    await exportToFile(this.config, filepath, format);
    this.emit('configExported', { filepath, format });
  }

  getPlatformConfig(platform: string): PlatformConfig | undefined {
    return this.config.extraction.platformOverrides[platform] || {};
  }

  setPlatformConfig(platform: string, config: PlatformConfig): void {
    this.set(`extraction.platformOverrides.${platform}`, config);
  }

  getEffectiveConfig(url: string): ScraperConfig {
    return this.config;
  }

  dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
    this.removeAllListeners();
  }
}
