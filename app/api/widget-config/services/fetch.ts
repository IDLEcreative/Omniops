/**
 * Widget configuration fetching operations
 */

import type { SupabaseClient } from '@/types/supabase';
import { logger } from '@/lib/logger';
import type { WidgetConfigWithHistory } from './types';

/**
 * Fetch widget configuration with optional history and variants
 */
export async function fetchWidgetConfig(
  supabase: SupabaseClient,
  customerConfigId: string | null,
  includeHistory: boolean,
  includeVariants: boolean
): Promise<WidgetConfigWithHistory> {
  let query = supabase.from('widget_configs').select('*').eq('is_active', true);

  if (customerConfigId) {
    query = query.eq('customer_config_id', customerConfigId);
  }

  const { data: configs, error } = await query.order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching widget configs', { error, customerConfigId });
    throw new Error('Failed to fetch configurations');
  }

  if (!configs || configs.length === 0) {
    return {
      config: null,
      history: null,
      variants: null,
    };
  }

  const configId = configs[0].id;
  let history = null;
  let variants = null;

  if (includeHistory) {
    const { data: historyData } = await supabase
      .from('widget_config_history')
      .select('*')
      .eq('widget_config_id', configId)
      .order('version', { ascending: false })
      .limit(10);
    history = historyData;
  }

  if (includeVariants) {
    const { data: variantsData } = await supabase
      .from('widget_config_variants')
      .select('*')
      .eq('widget_config_id', configId)
      .eq('is_active', true);
    variants = variantsData;
  }

  return {
    config: configs[0],
    history,
    variants,
  };
}

/**
 * Check if configuration exists for customer
 */
export async function checkExistingConfig(
  supabase: SupabaseClient,
  customerConfigId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('widget_configs')
    .select('id')
    .eq('customer_config_id', customerConfigId)
    .eq('is_active', true)
    .single();

  return !!existing;
}

/**
 * Fetch existing configuration by ID
 */
export async function fetchExistingConfig(
  supabase: SupabaseClient,
  configId: string
): Promise<any> {
  const { data: existing, error: fetchError } = await supabase
    .from('widget_configs')
    .select('*')
    .eq('id', configId)
    .single();

  if (fetchError || !existing) {
    throw new Error('Configuration not found');
  }

  return existing;
}
