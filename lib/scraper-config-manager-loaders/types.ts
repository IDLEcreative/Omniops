/**
 * Types for Configuration Manager Loaders
 */

import type { SupabaseClient } from '@/types/supabase';
import type { ScraperConfig } from '../scraper-config-schemas';

export { ScraperConfig };
export { SupabaseClient };

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
