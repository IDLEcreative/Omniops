/**
 * Customer Configuration Create Handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { domainValidator } from '@/lib/utils/domain-validator'
import { CreateConfigSchema, SettingsSchema } from './validators'
import { triggerAutoScraping, prepareConfigData } from './services'
import { checkSupabaseEnv, getSupabaseClient } from './utils'

/**
 * POST /api/customer/config
 * Create a new customer configuration and trigger automatic scraping
 */
export async function handlePost(request: NextRequest) {
  try {
    const envError = checkSupabaseEnv()
    if (envError) return envError

    const json = await request.json()
    const parsed = CreateConfigSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data

    const domainValidation = domainValidator.validateUrl(body.domain)
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

    const normalizedDomain = domainValidation.domain!
    const { client: supabase, error: clientError } = await getSupabaseClient()
    if (clientError) return clientError

    const domainStatus = await domainValidator.checkDomainStatus(normalizedDomain)
    if (domainStatus.exists && domainStatus.customerConfigId) {
      return NextResponse.json(
        {
          error: 'Domain already configured',
          existingConfigId: domainStatus.customerConfigId,
        },
        { status: 409 }
      )
    }

    const settings = SettingsSchema.parse(body.settings ?? {})
    const configData = prepareConfigData(body, normalizedDomain, settings, domainValidation)

    const { data: config, error: configError } = await supabase!
      .from('customer_configs')
      .insert(configData)
      .select()
      .single()

    if (configError) {
      logger.error('Error creating customer config', { error: configError, configData })
      return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 })
    }

    logger.info('Customer configuration created', {
      configId: config.id,
      customerId: config.customer_id,
      domain: normalizedDomain,
    })

    const scrapingResult = await triggerAutoScraping(config, normalizedDomain, settings)

    return NextResponse.json(
      {
        success: true,
        data: {
          config,
          domainValidation,
          scraping: scrapingResult,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/customer/config error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
