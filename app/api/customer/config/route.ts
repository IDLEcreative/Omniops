/**
 * Customer Configuration API
 * 
 * Handles customer website configuration including:
 * - Adding/updating website URLs
 * - Validating domains
 * - Automatically triggering scraping
 * - Managing customer scraping settings
 */

import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { domainValidator, type DomainValidationResult } from '@/lib/utils/domain-validator'
import { customerScrapingIntegration, type CustomerScrapingConfig, JobPriority } from '@/lib/integrations/customer-scraping-integration'

interface CreateConfigRequest {
  domain: string
  customerId?: string
  settings?: {
    autoScrape?: boolean
    scrapingFrequency?: 'daily' | 'weekly' | 'monthly'
    priority?: 'high' | 'normal' | 'low'
    maxPages?: number
    includeSubdomains?: boolean
  }
  metadata?: Record<string, any>
}

interface UpdateConfigRequest {
  domain?: string
  settings?: {
    autoScrape?: boolean
    scrapingFrequency?: 'daily' | 'weekly' | 'monthly'
    priority?: 'high' | 'normal' | 'low'
    maxPages?: number
    includeSubdomains?: boolean
  }
  metadata?: Record<string, any>
}

interface CustomerConfig {
  id: string
  customer_id: string | null
  domain: string
  settings: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * GET /api/customer/config
 * Get customer configurations (optionally filtered by customer ID or domain)
 */
export async function GET(request: NextRequest) {
  try {
    // Check environment configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('GET /api/customer/config missing Supabase configuration');
      return NextResponse.json(
        { 
          error: 'Service configuration incomplete',
          message: 'The service is not properly configured. Please contact support.'
        },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const domain = searchParams.get('domain')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    let query = supabase
      .from('customer_configs')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Apply filters
    if (customerId) {
      query = query.eq('customer_id', customerId)
    }
    if (domain) {
      query = query.eq('domain', domain)
    }

    const { data: configs, error, count } = await query

    if (error) {
      logger.error('Error fetching customer configs', { error, customerId, domain })
      return NextResponse.json(
        { error: 'Failed to fetch configurations' }, 
        { status: 500 }
      )
    }

    // Get scraping status for each configuration
    const configsWithStatus = await Promise.all(
      configs?.map(async (config: CustomerConfig) => {
        try {
          const scrapingStatus = await customerScrapingIntegration.getIntegrationStatus(config.id)
          return {
            ...config,
            scrapingStatus
          }
        } catch (error) {
          logger.warn('Failed to get scraping status', { configId: config.id, error })
          return {
            ...config,
            scrapingStatus: {
              hasActiveJobs: false,
              totalJobs: 0,
              successfulJobs: 0,
              failedJobs: 0
            }
          }
        }
      }) || []
    )

    return NextResponse.json({
      success: true,
      data: configsWithStatus,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    logger.error('GET /api/customer/config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

/**
 * POST /api/customer/config
 * Create a new customer configuration and trigger automatic scraping
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateConfigRequest = await request.json()

    // Validate required fields
    if (!body.domain) {
      return NextResponse.json(
        { error: 'Domain is required' }, 
        { status: 400 }
      )
    }

    // Validate domain format
    const domainValidation = domainValidator.validateUrl(body.domain)
    if (!domainValidation.isValid) {
      return NextResponse.json({
        error: 'Invalid domain',
        details: domainValidation.error,
        warnings: domainValidation.warnings
      }, { status: 400 })
    }

    const normalizedDomain = domainValidation.domain!
    const supabase = await createClient()

    // Check if domain already exists
    const domainStatus = await domainValidator.checkDomainStatus(normalizedDomain)
    if (domainStatus.exists && domainStatus.customerConfigId) {
      return NextResponse.json({
        error: 'Domain already configured',
        existingConfigId: domainStatus.customerConfigId
      }, { status: 409 })
    }

    // Prepare configuration data
    const configData = {
      customer_id: body.customerId || null,
      domain: normalizedDomain,
      settings: {
        autoScrape: body.settings?.autoScrape ?? true,
        scrapingFrequency: body.settings?.scrapingFrequency || 'weekly',
        priority: body.settings?.priority || 'normal',
        maxPages: body.settings?.maxPages || 50,
        includeSubdomains: body.settings?.includeSubdomains || false,
        ...body.settings
      },
      metadata: {
        originalUrl: body.domain,
        domainValidation,
        createdViaApi: true,
        ...body.metadata
      }
    }

    // Create customer configuration
    const { data: config, error: configError } = await supabase
      .from('customer_configs')
      .insert(configData)
      .select()
      .single()

    if (configError) {
      logger.error('Error creating customer config', { error: configError, configData })
      return NextResponse.json(
        { error: 'Failed to create configuration' }, 
        { status: 500 }
      )
    }

    logger.info('Customer configuration created', {
      configId: config.id,
      customerId: config.customer_id,
      domain: normalizedDomain
    })

    // Automatically trigger scraping if enabled
    let scrapingResult = null
    if (configData.settings.autoScrape) {
      const priority = mapPriorityToJobPriority(configData.settings.priority)
      
      scrapingResult = await customerScrapingIntegration.handleNewCustomerConfig({
        customerId: config.customer_id,
        customerConfigId: config.id,
        domain: normalizedDomain,
        priority,
        scrapeType: 'initial',
        config: {
          maxPages: configData.settings.maxPages,
          includeSubdomains: configData.settings.includeSubdomains
        },
        metadata: {
          triggeredBy: 'customer-config-api',
          autoTriggered: true
        }
      })

      if (scrapingResult.success) {
        logger.info('Automatic scraping triggered', {
          configId: config.id,
          domain: normalizedDomain,
          jobId: scrapingResult.jobId
        })
      } else {
        logger.warn('Failed to trigger automatic scraping', {
          configId: config.id,
          domain: normalizedDomain,
          error: scrapingResult.error
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        config,
        domainValidation,
        scraping: scrapingResult
      }
    }, { status: 201 })

  } catch (error) {
    logger.error('POST /api/customer/config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

/**
 * PUT /api/customer/config/[id]
 * Update an existing customer configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')
    
    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' }, 
        { status: 400 }
      )
    }

    const body: UpdateConfigRequest = await request.json()
    const supabase = await createClient()

    // Get existing configuration
    const { data: existingConfig, error: fetchError } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (fetchError || !existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' }, 
        { status: 404 }
      )
    }

    let domainValidation: DomainValidationResult | null = null
    let normalizedDomain = existingConfig.domain

    // Validate new domain if provided
    if (body.domain && body.domain !== existingConfig.domain) {
      domainValidation = domainValidator.validateUrl(body.domain)
      if (!domainValidation.isValid) {
        return NextResponse.json({
          error: 'Invalid domain',
          details: domainValidation.error,
          warnings: domainValidation.warnings
        }, { status: 400 })
      }
      normalizedDomain = domainValidation.domain!
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.domain) {
      updateData.domain = normalizedDomain
    }

    if (body.settings) {
      updateData.settings = {
        ...existingConfig.settings,
        ...body.settings
      }
    }

    if (body.metadata) {
      updateData.metadata = {
        ...existingConfig.metadata,
        ...body.metadata,
        lastUpdatedViaApi: true,
        updatedAt: new Date().toISOString()
      }
    }

    // Update configuration
    const { data: updatedConfig, error: updateError } = await supabase
      .from('customer_configs')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating customer config', { error: updateError, configId, updateData })
      return NextResponse.json(
        { error: 'Failed to update configuration' }, 
        { status: 500 }
      )
    }

    logger.info('Customer configuration updated', {
      configId,
      domainChanged: body.domain && body.domain !== existingConfig.domain,
      oldDomain: existingConfig.domain,
      newDomain: normalizedDomain
    })

    // Handle domain change - trigger new scraping
    let scrapingResult = null
    if (body.domain && body.domain !== existingConfig.domain) {
      scrapingResult = await customerScrapingIntegration.handleCustomerConfigUpdate(
        { domain: existingConfig.domain, customerConfigId: configId },
        {
          customerId: existingConfig.customer_id,
          customerConfigId: configId,
          domain: normalizedDomain,
          priority: mapPriorityToJobPriority(updatedConfig.settings.priority || 'normal'),
          scrapeType: 'refresh',
          config: {
            maxPages: updatedConfig.settings.maxPages,
            includeSubdomains: updatedConfig.settings.includeSubdomains
          },
          metadata: {
            triggeredBy: 'customer-config-update-api',
            domainChanged: true
          }
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        config: updatedConfig,
        domainValidation,
        scraping: scrapingResult
      }
    })

  } catch (error) {
    logger.error('PUT /api/customer/config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customer/config/[id]
 * Delete a customer configuration and cancel any pending scraping
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')
    
    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' }, 
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get configuration to be deleted
    const { data: config, error: fetchError } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (fetchError || !config) {
      return NextResponse.json(
        { error: 'Configuration not found' }, 
        { status: 404 }
      )
    }

    // Cancel any pending scraping jobs
    const { data: pendingJobs, error: jobsError } = await supabase
      .from('scrape_jobs')
      .update({ 
        status: 'cancelled',
        error_message: 'Customer configuration deleted',
        completed_at: new Date().toISOString()
      })
      .eq('customer_config_id', configId)
      .in('status', ['pending', 'running'])
      .select('id')

    if (jobsError) {
      logger.warn('Error cancelling jobs during config deletion', { configId, error: jobsError })
    } else {
      logger.info('Cancelled pending jobs for deleted config', {
        configId,
        cancelledJobs: pendingJobs?.length || 0
      })
    }

    // Delete the configuration
    const { error: deleteError } = await supabase
      .from('customer_configs')
      .delete()
      .eq('id', configId)

    if (deleteError) {
      logger.error('Error deleting customer config', { error: deleteError, configId })
      return NextResponse.json(
        { error: 'Failed to delete configuration' }, 
        { status: 500 }
      )
    }

    logger.info('Customer configuration deleted', {
      configId,
      customerId: config.customer_id,
      domain: config.domain
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
      cancelledJobs: pendingJobs?.length || 0
    })

  } catch (error) {
    logger.error('DELETE /api/customer/config error', { error })
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Helper functions

function mapPriorityToJobPriority(priority: string): JobPriority {
  switch (priority.toLowerCase()) {
    case 'high':
      return JobPriority.HIGH
    case 'low':
      return JobPriority.LOW
    case 'normal':
    default:
      return JobPriority.NORMAL
  }
}

/**
 * Validate domain accessibility endpoint
 * GET /api/customer/config/validate?domain=example.com
 */
export async function validateDomain(domain: string) {
  try {
    const validation = domainValidator.validateUrl(domain)
    
    if (!validation.isValid) {
      return {
        valid: false,
        error: validation.error,
        warnings: validation.warnings
      }
    }

    // Check domain status
    const [domainStatus, accessibility] = await Promise.all([
      domainValidator.checkDomainStatus(validation.domain!),
      domainValidator.checkDomainAccessibility(validation.domain!, 10000)
    ])

    return {
      valid: true,
      domain: validation.domain,
      normalizedUrl: validation.normalizedUrl,
      warnings: validation.warnings,
      exists: domainStatus.exists,
      isBeingScrapped: domainStatus.isBeingScrapped,
      accessible: accessibility.accessible,
      statusCode: accessibility.statusCode,
      responseTime: accessibility.responseTime
    }

  } catch (error) {
    logger.error('Domain validation error', { domain, error })
    return {
      valid: false,
      error: 'Validation failed'
    }
  }
}
