/**
 * Scraper Configuration Manager - Persistence Module
 *
 * Handles saving and updating configuration:
 * - Database persistence (Supabase)
 * - File exports (JSON/YAML)
 * - Configuration validation
 *
 * Extracted from scraper-config-manager.ts for modularity.
 */

import { ZodError } from 'zod';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ScraperConfigSchema, type ScraperConfig } from './scraper-config-schemas';

// ============================================================================
// DATABASE PERSISTENCE
// ============================================================================

/**
 * Save configuration to database
 */
export async function saveToDatabase(
  supabase: SupabaseClient,
  domainConfigId: string,
  config: ScraperConfig
): Promise<void> {
  try {
    const { error } = await supabase
      .from('scraper_configs')
      .upsert({
        domain_config_id: domainConfigId,
        config: config,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving config to database:', error);
    throw error;
  }
}

// ============================================================================
// FILE EXPORT
// ============================================================================

/**
 * Export configuration to file
 */
export async function exportToFile(
  config: ScraperConfig,
  filepath: string,
  format: 'json' | 'yaml' = 'yaml'
): Promise<void> {
  let content: string;

  if (format === 'json') {
    content = JSON.stringify(config, null, 2);
  } else {
    content = yaml.dump(config);
  }

  await fs.promises.writeFile(filepath, content, 'utf-8');
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a configuration object
 */
export function validateConfig(config: unknown): { valid: boolean; errors?: ZodError } {
  try {
    ScraperConfigSchema.parse(config);
    return { valid: true };
  } catch (error) {
    return { valid: false, errors: error instanceof ZodError ? error : undefined };
  }
}

// ============================================================================
// CONFIGURATION MERGING
// ============================================================================

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result: any = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

// ============================================================================
// CHANGE DETECTION
// ============================================================================

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
 * Detect changes between two configuration objects
 */
export function detectChanges(
  oldConfig: Record<string, unknown>,
  newConfig: Record<string, unknown>,
  path: string = ''
): ConfigChangeEvent[] {
  const changes: ConfigChangeEvent[] = [];

  for (const key in newConfig) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof newConfig[key] === 'object' && !Array.isArray(newConfig[key]) && newConfig[key] !== null) {
      if (oldConfig && typeof oldConfig[key] === 'object' && oldConfig[key] !== null && !Array.isArray(oldConfig[key])) {
        changes.push(...detectChanges(oldConfig[key] as Record<string, unknown>, newConfig[key] as Record<string, unknown>, currentPath));
      }
    } else {
      if (!oldConfig || oldConfig[key] !== newConfig[key]) {
        changes.push({
          section: currentPath.split('.')[0] || '',
          key: currentPath,
          oldValue: oldConfig?.[key],
          newValue: newConfig[key],
          source: 'merge',
        });
      }
    }
  }

  return changes;
}

// ============================================================================
// CONFIGURATION UTILITIES
// ============================================================================

/**
 * Get a configuration value by path
 */
export function getValueByPath(config: Record<string, any>, path: string): unknown {
  const keys = path.split('.');
  let current: any = config;

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
