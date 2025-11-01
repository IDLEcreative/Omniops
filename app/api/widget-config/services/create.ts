/**
 * Widget configuration creation operations
 */

import type { SupabaseClient } from '@/types/supabase';
import { logger } from '@/lib/logger';
import { CreateWidgetConfig } from '../validators';
import { createHistoryEntry } from './history';

/**
 * Create new widget configuration
 */
export async function createWidgetConfig(
  supabase: SupabaseClient,
  body: CreateWidgetConfig,
  userId: string
): Promise<any> {
  const configData = {
    customer_config_id: body.customerConfigId,
    theme_settings: body.themeSettings || {},
    position_settings: body.positionSettings || {},
    ai_settings: body.aiSettings || {},
    behavior_settings: body.behaviorSettings || {},
    integration_settings: body.integrationSettings || {},
    analytics_settings: body.analyticsSettings || {},
    advanced_settings: body.advancedSettings || {},
    branding_settings: body.brandingSettings || {},
    created_by: userId,
    updated_by: userId,
  };

  const { data: config, error: insertError } = await supabase
    .from('widget_configs')
    .insert(configData)
    .select()
    .single();

  if (insertError) {
    logger.error('Error creating widget config', { error: insertError, configData });
    throw new Error('Failed to create configuration');
  }

  await createHistoryEntry(
    supabase,
    config.id,
    config,
    1,
    'Initial configuration',
    Object.keys(body).filter((k) => k !== 'customerConfigId'),
    userId
  );

  logger.info('Widget configuration created', {
    configId: config.id,
    customerConfigId: body.customerConfigId,
    userId,
  });

  return config;
}
