/**
 * Widget configuration update operations
 */

import type { SupabaseClient } from '@/types/supabase';
import { logger } from '@/lib/logger';
import { UpdateWidgetConfig } from '../validators';
import { createHistoryEntry } from './history';
import type { UpdateData } from './types';

/**
 * Merge settings updates with existing configuration
 */
export function mergeSettingsUpdates(
  existing: any,
  body: UpdateWidgetConfig,
  userId: string
): UpdateData {
  const updateData: any = {
    updated_by: userId,
    version: existing.version + 1,
  };

  const changedFields: string[] = [];

  if (body.themeSettings) {
    updateData.theme_settings = { ...existing.theme_settings, ...body.themeSettings };
    changedFields.push('theme_settings');
  }
  if (body.positionSettings) {
    updateData.position_settings = { ...existing.position_settings, ...body.positionSettings };
    changedFields.push('position_settings');
  }
  if (body.aiSettings) {
    updateData.ai_settings = { ...existing.ai_settings, ...body.aiSettings };
    changedFields.push('ai_settings');
  }
  if (body.behaviorSettings) {
    updateData.behavior_settings = { ...existing.behavior_settings, ...body.behaviorSettings };
    changedFields.push('behavior_settings');
  }
  if (body.integrationSettings) {
    updateData.integration_settings = {
      ...existing.integration_settings,
      ...body.integrationSettings,
    };
    changedFields.push('integration_settings');
  }
  if (body.analyticsSettings) {
    updateData.analytics_settings = { ...existing.analytics_settings, ...body.analyticsSettings };
    changedFields.push('analytics_settings');
  }
  if (body.advancedSettings) {
    updateData.advanced_settings = { ...existing.advanced_settings, ...body.advancedSettings };
    changedFields.push('advanced_settings');
  }
  if (body.brandingSettings) {
    updateData.branding_settings = { ...existing.branding_settings, ...body.brandingSettings };
    changedFields.push('branding_settings');
  }

  return { updateData, changedFields };
}

/**
 * Update widget configuration
 */
export async function updateWidgetConfig(
  supabase: SupabaseClient,
  configId: string,
  updateData: any,
  changedFields: string[],
  userId: string
): Promise<any> {
  const { data: updated, error: updateError } = await supabase
    .from('widget_configs')
    .update(updateData)
    .eq('id', configId)
    .select()
    .single();

  if (updateError) {
    logger.error('Error updating widget config', { error: updateError, configId, updateData });
    throw new Error('Failed to update configuration');
  }

  await createHistoryEntry(
    supabase,
    configId,
    updated,
    updated.version,
    `Updated ${changedFields.join(', ')}`,
    changedFields,
    userId
  );

  logger.info('Widget configuration updated', {
    configId,
    version: updated.version,
    changedFields,
    userId,
  });

  return updated;
}
