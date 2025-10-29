/**
 * Customer Configuration Update Handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { domainValidator } from '@/lib/utils/domain-validator'
import { UpdateConfigSchema, SettingsSchema } from './validators'
import { handleDomainChange, prepareUpdateData } from './services'
import { checkSupabaseEnv, getSupabaseClient } from './utils'

/**
 * PUT /api/customer/config/[id]
 * Update an existing customer configuration
 * REQUIRES AUTHENTICATION: User must be admin/owner of the organization
 */
export async function handlePut(request: NextRequest) {
  try {
    const envError = checkSupabaseEnv()
    if (envError) return envError

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 })
    }

    const { client: supabase, error: clientError } = await getSupabaseClient()
    if (clientError) return clientError

    // SECURITY: Require authentication
    const { data: { user }, error: authError } = await supabase!.auth.getUser()
    if (authError || !user) {
      logger.warn('Unauthenticated request to PUT /api/customer/config')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch config first to get organization_id
    const { data: existingConfig, error: fetchError } = await supabase!
      .from('customer_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (fetchError || !existingConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // SECURITY: Verify user is member of the config's organization
    const { data: membership, error: membershipError } = await supabase!
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', existingConfig.organization_id)
      .single()

    if (membershipError || !membership) {
      logger.warn('User not authorized to update config', {
        userId: user.id,
        configId,
        organizationId: existingConfig.organization_id
      })
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this organization' },
        { status: 403 }
      )
    }

    // SECURITY: Only admins and owners can update configs
    if (!['admin', 'owner'].includes(membership.role)) {
      logger.warn('Insufficient permissions to update config', {
        userId: user.id,
        role: membership.role,
        configId
      })
      return NextResponse.json(
        { error: 'Forbidden: Only admins and owners can update configurations' },
        { status: 403 }
      )
    }

    const json = await request.json()
    const parsed = UpdateConfigSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data

    let domainValidation = null
    let normalizedDomain = existingConfig.domain

    if (body.domain && body.domain !== existingConfig.domain) {
      domainValidation = domainValidator.validateUrl(body.domain)
      if (!domainValidation.isValid) {
        return NextResponse.json(
          {
            error: 'Invalid domain',
            details: domainValidation.error,
            warnings: domainValidation.warnings,
          },
          { status: 400 }
        )
      }
      normalizedDomain = domainValidation.domain!
    }

    const newSettings = body.settings ? SettingsSchema.partial().parse(body.settings) : undefined
    const updateData = prepareUpdateData(body, existingConfig, normalizedDomain, newSettings)

    const { data: updatedConfig, error: updateError } = await supabase!
      .from('customer_configs')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating customer config', { error: updateError, configId, updateData })
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
    }

    logger.info('Customer configuration updated', {
      configId,
      domainChanged: body.domain && body.domain !== existingConfig.domain,
      oldDomain: existingConfig.domain,
      newDomain: normalizedDomain,
    })

    let scrapingResult = null
    if (body.domain && body.domain !== existingConfig.domain) {
      scrapingResult = await handleDomainChange(
        configId,
        existingConfig,
        updatedConfig,
        normalizedDomain
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        config: updatedConfig,
        domainValidation,
        scraping: scrapingResult,
      },
    })
  } catch (error) {
    logger.error('PUT /api/customer/config error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
