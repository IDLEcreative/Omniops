/**
 * Database configuration loading
 */

import type { SupabaseClient } from '@/types/supabase';
import type { ScraperConfig } from '../scraper-config-schemas';

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
