/**
 * Customer Configuration Services
 *
 * Business logic for customer config operations
 */

import { logger } from '@/lib/logger'
import { domainValidator, type DomainValidationResult } from '@/lib/utils/domain-validator'
import { customerScrapingIntegration, JobPriority } from '@/lib/integrations/customer-scraping-integration'
import type { CustomerConfig } from './validators'

/**
 * Get scraping status for multiple configurations
 */
export async function enrichConfigsWithStatus(
  configs: CustomerConfig[] | null,
  includeStatus: boolean
): Promise<CustomerConfig[]> {
  if (!includeStatus || !configs) {
    return configs || []
  }

  return await Promise.all(
    configs.map(async (config: CustomerConfig) => {
      try {
        const scrapingStatus = await customerScrapingIntegration.getIntegrationStatus(config.id)
        return { ...config, scrapingStatus }
      } catch (error) {
        logger.warn('Failed to get scraping status', { configId: config.id, error })
        return {
          ...config,
          scrapingStatus: {
            hasActiveJobs: false,
            totalJobs: 0,
            successfulJobs: 0,
            failedJobs: 0,
          },
        }
      }
    })
  )
}

/**
 * Map priority string to JobPriority enum
 */
export function mapPriorityToJobPriority(priority: string): JobPriority {
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
 * Trigger automatic scraping for new config
 */
export async function triggerAutoScraping(
  config: CustomerConfig,
  normalizedDomain: string,
  settings: any
) {
  if (!settings.autoScrape) {
    return null
  }

  const priority = mapPriorityToJobPriority(settings.priority)

  const result = await customerScrapingIntegration.handleNewCustomerConfig({
    customerId: config.customer_id ?? undefined,
    customerConfigId: config.id,
    domain: normalizedDomain,
    priority,
    scrapeType: 'initial',
    config: {
      maxPages: settings.maxPages,
      includeSubdomains: settings.includeSubdomains,
    },
    metadata: {
      triggeredBy: 'customer-config-api',
      autoTriggered: true,
    },
  })

  if (result.success) {
    logger.info('Automatic scraping triggered', {
      configId: config.id,
      domain: normalizedDomain,
      jobId: result.jobId,
    })
  } else {
    logger.warn('Failed to trigger automatic scraping', {
      configId: config.id,
      domain: normalizedDomain,
      error: result.error,
    })
  }

  return result
}

/**
 * Handle domain change and trigger re-scraping
 */
export async function handleDomainChange(
  configId: string,
  existingConfig: CustomerConfig,
  updatedConfig: CustomerConfig,
  normalizedDomain: string
) {
  return await customerScrapingIntegration.handleCustomerConfigUpdate(
    { domain: existingConfig.domain, customerConfigId: configId },
    {
      customerId: existingConfig.customer_id ?? undefined,
      customerConfigId: configId,
      domain: normalizedDomain,
      priority: mapPriorityToJobPriority(updatedConfig.settings.priority ?? 'normal'),
      scrapeType: 'refresh',
      config: {
        maxPages: updatedConfig.settings.maxPages,
        includeSubdomains: updatedConfig.settings.includeSubdomains,
      },
      metadata: {
        triggeredBy: 'customer-config-update-api',
        domainChanged: true,
      },
    }
  )
}

/**
 * Validate domain accessibility
 */
export async function validateDomain(domain: string) {
  try {
    const validation = domainValidator.validateUrl(domain)

    if (!validation.isValid) {
      return {
        valid: false,
        error: validation.error,
        warnings: validation.warnings,
      }
    }

    // Check domain status and accessibility in parallel
    const [domainStatus, accessibility] = await Promise.all([
      domainValidator.checkDomainStatus(validation.domain!),
      domainValidator.checkDomainAccessibility(validation.domain!, 10000),
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
      responseTime: accessibility.responseTime,
    }
  } catch (error) {
    logger.error('Domain validation error', { domain, error })
    return {
      valid: false,
      error: 'Validation failed',
    }
  }
}

/**
 * Prepare configuration data for creation
 */
export function prepareConfigData(
  body: any,
  normalizedDomain: string,
  settings: any,
  domainValidation: DomainValidationResult
) {
  return {
    customer_id: body.customerId || null,
    domain: normalizedDomain,
    settings,
    metadata: {
      originalUrl: body.domain,
      domainValidation,
      createdViaApi: true,
      ...body.metadata,
    },
  }
}

/**
 * Prepare update data for configuration
 */
export function prepareUpdateData(
  body: any,
  existingConfig: CustomerConfig,
  normalizedDomain: string,
  newSettings?: any
) {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (body.domain) {
    updateData.domain = normalizedDomain
  }

  if (newSettings) {
    updateData.settings = {
      ...existingConfig.settings,
      ...newSettings,
    }
  }

  if (body.metadata) {
    updateData.metadata = {
      ...existingConfig.metadata,
      ...body.metadata,
      lastUpdatedViaApi: true,
      updatedAt: new Date().toISOString(),
    }
  }

  return updateData
}
