/**
 * Widget Configuration Business Logic
 *
 * Core service functions for widget config operations
 * Multi-tenant, brand-agnostic configuration management
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { CreateWidgetConfig, UpdateWidgetConfig } from './validators'

export interface WidgetConfigWithHistory {
  config: any
  history: any[] | null
  variants: any[] | null
}

/**
 * Fetch widget configuration with optional history and variants
 */
export async function fetchWidgetConfig(
  supabase: SupabaseClient,
  customerConfigId: string | null,
  includeHistory: boolean,
  includeVariants: boolean
): Promise<WidgetConfigWithHistory> {
  let query = supabase
    .from('widget_configs')
    .select('*')
    .eq('is_active', true)

  if (customerConfigId) {
    query = query.eq('customer_config_id', customerConfigId)
  }

  const { data: configs, error } = await query.order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching widget configs', { error, customerConfigId })
    throw new Error('Failed to fetch configurations')
  }

  if (!configs || configs.length === 0) {
    return {
      config: null,
      history: null,
      variants: null,
    }
  }

  const configId = configs[0].id
  let history = null
  let variants = null

  if (includeHistory) {
    const { data: historyData } = await supabase
      .from('widget_config_history')
      .select('*')
      .eq('widget_config_id', configId)
      .order('version', { ascending: false })
      .limit(10)
    history = historyData
  }

  if (includeVariants) {
    const { data: variantsData } = await supabase
      .from('widget_config_variants')
      .select('*')
      .eq('widget_config_id', configId)
      .eq('is_active', true)
    variants = variantsData
  }

  return {
    config: configs[0],
    history,
    variants,
  }
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
    .single()

  return !!existing
}

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
  }

  const { data: config, error: insertError } = await supabase
    .from('widget_configs')
    .insert(configData)
    .select()
    .single()

  if (insertError) {
    logger.error('Error creating widget config', { error: insertError, configData })
    throw new Error('Failed to create configuration')
  }

  await createHistoryEntry(
    supabase,
    config.id,
    config,
    1,
    'Initial configuration',
    Object.keys(body).filter(k => k !== 'customerConfigId'),
    userId
  )

  logger.info('Widget configuration created', {
    configId: config.id,
    customerConfigId: body.customerConfigId,
    userId,
  })

  return config
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
    .single()

  if (fetchError || !existing) {
    throw new Error('Configuration not found')
  }

  return existing
}

/**
 * Merge settings updates with existing configuration
 */
export function mergeSettingsUpdates(
  existing: any,
  body: UpdateWidgetConfig,
  userId: string
): { updateData: any; changedFields: string[] } {
  const updateData: any = {
    updated_by: userId,
    version: existing.version + 1,
  }

  const changedFields: string[] = []

  if (body.themeSettings) {
    updateData.theme_settings = { ...existing.theme_settings, ...body.themeSettings }
    changedFields.push('theme_settings')
  }
  if (body.positionSettings) {
    updateData.position_settings = { ...existing.position_settings, ...body.positionSettings }
    changedFields.push('position_settings')
  }
  if (body.aiSettings) {
    updateData.ai_settings = { ...existing.ai_settings, ...body.aiSettings }
    changedFields.push('ai_settings')
  }
  if (body.behaviorSettings) {
    updateData.behavior_settings = { ...existing.behavior_settings, ...body.behaviorSettings }
    changedFields.push('behavior_settings')
  }
  if (body.integrationSettings) {
    updateData.integration_settings = { ...existing.integration_settings, ...body.integrationSettings }
    changedFields.push('integration_settings')
  }
  if (body.analyticsSettings) {
    updateData.analytics_settings = { ...existing.analytics_settings, ...body.analyticsSettings }
    changedFields.push('analytics_settings')
  }
  if (body.advancedSettings) {
    updateData.advanced_settings = { ...existing.advanced_settings, ...body.advancedSettings }
    changedFields.push('advanced_settings')
  }
  if (body.brandingSettings) {
    updateData.branding_settings = { ...existing.branding_settings, ...body.brandingSettings }
    changedFields.push('branding_settings')
  }

  return { updateData, changedFields }
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
    .single()

  if (updateError) {
    logger.error('Error updating widget config', { error: updateError, configId, updateData })
    throw new Error('Failed to update configuration')
  }

  await createHistoryEntry(
    supabase,
    configId,
    updated,
    updated.version,
    `Updated ${changedFields.join(', ')}`,
    changedFields,
    userId
  )

  logger.info('Widget configuration updated', {
    configId,
    version: updated.version,
    changedFields,
    userId,
  })

  return updated
}

/**
 * Create history entry for configuration changes
 */
async function createHistoryEntry(
  supabase: SupabaseClient,
  widgetConfigId: string,
  configSnapshot: any,
  version: number,
  changeDescription: string,
  changedFields: string[],
  userId: string
): Promise<void> {
  await supabase
    .from('widget_config_history')
    .insert({
      widget_config_id: widgetConfigId,
      config_snapshot: configSnapshot,
      version,
      change_description: changeDescription,
      changed_fields: changedFields,
      created_by: userId,
    })
}

/**
 * Soft delete widget configuration
 */
export async function deleteWidgetConfig(
  supabase: SupabaseClient,
  configId: string,
  userId: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('widget_configs')
    .update({
      is_active: false,
      updated_by: userId,
    })
    .eq('id', configId)

  if (updateError) {
    logger.error('Error deleting widget config', { error: updateError, configId })
    throw new Error('Failed to delete configuration')
  }

  logger.info('Widget configuration deleted', {
    configId,
    userId,
  })
}
