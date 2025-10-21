/**
 * Widget Configuration API
 *
 * Manages chat widget configurations for customers
 * Supports multi-tenant, brand-agnostic customization
 */

import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient, validateSupabaseEnv } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Validation schemas
const ThemeSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderRadius: z.string().optional(),
  fontSize: z.string().optional(),
  fontFamily: z.string().optional(),
  darkMode: z.boolean().optional(),
  customCSS: z.string().max(10000).optional(),
})

const PositionSettingsSchema = z.object({
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
  offsetX: z.number().min(0).max(200).optional(),
  offsetY: z.number().min(0).max(200).optional(),
  width: z.number().min(300).max(600).optional(),
  height: z.number().min(400).max(800).optional(),
  mobileBreakpoint: z.number().min(320).max(1024).optional(),
})

const AISettingsSchema = z.object({
  personality: z.enum(['professional', 'friendly', 'helpful', 'concise', 'technical']).optional(),
  responseLength: z.enum(['short', 'balanced', 'detailed']).optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  fallbackBehavior: z.enum(['apologize_and_offer_help', 'redirect_to_human', 'suggest_alternatives']).optional(),
  language: z.string().optional(),
  customSystemPrompt: z.string().max(2000).optional(),
  enableSmartSuggestions: z.boolean().optional(),
  maxTokens: z.number().min(50).max(2000).optional(),
  temperature: z.number().min(0).max(1).optional(),
})

const BehaviorSettingsSchema = z.object({
  welcomeMessage: z.string().max(500).optional(),
  placeholderText: z.string().max(100).optional(),
  botName: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  showAvatar: z.boolean().optional(),
  showTypingIndicator: z.boolean().optional(),
  autoOpen: z.boolean().optional(),
  openDelay: z.number().min(0).max(60000).optional(),
  minimizable: z.boolean().optional(),
  soundNotifications: z.boolean().optional(),
  persistConversation: z.boolean().optional(),
  messageDelay: z.number().min(0).max(5000).optional(),
})

const IntegrationSettingsSchema = z.object({
  enableWooCommerce: z.boolean().optional(),
  enableWebSearch: z.boolean().optional(),
  enableKnowledgeBase: z.boolean().optional(),
  apiRateLimit: z.number().min(1).max(1000).optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  customHeaders: z.record(z.string()).optional(),
  allowedDomains: z.array(z.string()).optional(),
  dataSourcePriority: z.array(z.string()).optional(),
})

const AnalyticsSettingsSchema = z.object({
  trackConversations: z.boolean().optional(),
  trackUserBehavior: z.boolean().optional(),
  trackPerformance: z.boolean().optional(),
  customEvents: z.array(z.string()).optional(),
  dataRetentionDays: z.number().min(1).max(365).optional(),
  anonymizeData: z.boolean().optional(),
  shareAnalyticsWithCustomer: z.boolean().optional(),
})

const AdvancedSettingsSchema = z.object({
  corsOrigins: z.array(z.string()).optional(),
  cacheEnabled: z.boolean().optional(),
  cacheTTL: z.number().min(0).max(86400).optional(),
  debugMode: z.boolean().optional(),
  customJSHooks: z.record(z.string()).optional(),
  securityHeaders: z.record(z.string()).optional(),
  rateLimitOverride: z.number().optional().nullable(),
  experimentalFeatures: z.array(z.string()).optional(),
})

const BrandingSettingsSchema = z.object({
  showPoweredBy: z.boolean().optional(),
  customBrandingText: z.string().max(100).optional(),
  customLogoUrl: z.string().url().optional().or(z.literal('')),
  customFaviconUrl: z.string().url().optional().or(z.literal('')),
  brandColors: z.record(z.string()).optional(),
})

const CreateWidgetConfigSchema = z.object({
  customerConfigId: z.string().uuid(),
  themeSettings: ThemeSettingsSchema.optional(),
  positionSettings: PositionSettingsSchema.optional(),
  aiSettings: AISettingsSchema.optional(),
  behaviorSettings: BehaviorSettingsSchema.optional(),
  integrationSettings: IntegrationSettingsSchema.optional(),
  analyticsSettings: AnalyticsSettingsSchema.optional(),
  advancedSettings: AdvancedSettingsSchema.optional(),
  brandingSettings: BrandingSettingsSchema.optional(),
})

const UpdateWidgetConfigSchema = CreateWidgetConfigSchema.partial()

/**
 * GET /api/widget-config
 * Retrieve widget configuration for a customer
 */
export async function GET(request: NextRequest) {
  try {
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const customerConfigId = searchParams.get('customerConfigId')
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const includeVariants = searchParams.get('includeVariants') === 'true'

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      )
    }

    // Optionally include history and variants
    if (configs && configs.length > 0) {
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

      return NextResponse.json({
        success: true,
        data: {
          config: configs[0],
          history,
          variants,
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        config: configs?.[0] || null,
        history: null,
        variants: null,
      }
    })

  } catch (error) {
    logger.error('GET /api/widget-config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/widget-config
 * Create new widget configuration
 */
export async function POST(request: NextRequest) {
  try {
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const json = await request.json()
    const parsed = CreateWidgetConfigSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const body = parsed.data
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if configuration already exists for this customer
    const { data: existing } = await supabase
      .from('widget_configs')
      .select('id')
      .eq('customer_config_id', body.customerConfigId)
      .eq('is_active', true)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Configuration already exists for this customer. Use PUT to update.' },
        { status: 409 }
      )
    }

    // Create new configuration
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
      created_by: user.id,
      updated_by: user.id,
    }

    const { data: config, error: insertError } = await supabase
      .from('widget_configs')
      .insert(configData)
      .select()
      .single()

    if (insertError) {
      logger.error('Error creating widget config', { error: insertError, configData })
      return NextResponse.json(
        { error: 'Failed to create configuration' },
        { status: 500 }
      )
    }

    // Create initial history entry
    await supabase
      .from('widget_config_history')
      .insert({
        widget_config_id: config.id,
        config_snapshot: config,
        version: 1,
        change_description: 'Initial configuration',
        changed_fields: Object.keys(body).filter(k => k !== 'customerConfigId'),
        created_by: user.id,
      })

    logger.info('Widget configuration created', {
      configId: config.id,
      customerConfigId: body.customerConfigId,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      data: config,
    }, { status: 201 })

  } catch (error) {
    logger.error('POST /api/widget-config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/widget-config
 * Update existing widget configuration
 */
export async function PUT(request: NextRequest) {
  try {
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    const json = await request.json()
    const parsed = UpdateWidgetConfigSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const body = parsed.data
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get existing configuration
    const { data: existing, error: fetchError } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_by: user.id,
      version: existing.version + 1,
    }

    const changedFields: string[] = []

    // Merge settings
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

    // Update configuration
    const { data: updated, error: updateError } = await supabase
      .from('widget_configs')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating widget config', { error: updateError, configId, updateData })
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      )
    }

    // Create history entry
    await supabase
      .from('widget_config_history')
      .insert({
        widget_config_id: configId,
        config_snapshot: updated,
        version: updated.version,
        change_description: `Updated ${changedFields.join(', ')}`,
        changed_fields: changedFields,
        created_by: user.id,
      })

    logger.info('Widget configuration updated', {
      configId,
      version: updated.version,
      changedFields,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })

  } catch (error) {
    logger.error('PUT /api/widget-config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/widget-config
 * Soft delete widget configuration (sets is_active to false)
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Soft delete by setting is_active to false
    const { error: updateError } = await supabase
      .from('widget_configs')
      .update({
        is_active: false,
        updated_by: user.id,
      })
      .eq('id', configId)

    if (updateError) {
      logger.error('Error deleting widget config', { error: updateError, configId })
      return NextResponse.json(
        { error: 'Failed to delete configuration' },
        { status: 500 }
      )
    }

    logger.info('Widget configuration deleted', {
      configId,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
    })

  } catch (error) {
    logger.error('DELETE /api/widget-config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}