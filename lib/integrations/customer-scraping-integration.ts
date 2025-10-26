/**
 * Customer Scraping Integration
 *
 * Manages the seamless integration between customer onboarding and automatic scraping.
 * Handles triggering scraping jobs when customers add or update their website configurations.
 */

import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { domainValidator } from '@/lib/utils/domain-validator'
import {
  CustomerScrapingConfig,
  ScrapingTriggerResult,
  JobPriority,
  CustomerConfigRow
} from './customer-scraping-integration-types'
import { determineScrapingStrategy, scheduleRefresh } from './customer-scraping-integration-scheduler'
import {
  createAndQueueJob,
  cancelPendingJobs,
  getIntegrationStatus as getStatus
} from './customer-scraping-integration-executor'

// Re-export types and utilities
export { JobPriority } from './customer-scraping-integration-types'
export type {
  CustomerScrapingConfig,
  ScrapingTriggerResult,
  IntegrationStatus
} from './customer-scraping-integration-types'

export class CustomerScrapingIntegration {
  private static instance: CustomerScrapingIntegration

  private async getSupabase() {
    return await createClient()
  }

  static getInstance(): CustomerScrapingIntegration {
    if (!CustomerScrapingIntegration.instance) {
      CustomerScrapingIntegration.instance = new CustomerScrapingIntegration()
    }
    return CustomerScrapingIntegration.instance
  }

  /**
   * Handle new customer configuration - automatically trigger scraping
   */
  async handleNewCustomerConfig(config: CustomerScrapingConfig): Promise<ScrapingTriggerResult> {
    try {
      logger.info('Processing new customer configuration', {
        customerConfigId: config.customerConfigId,
        domain: config.domain,
        scrapeType: config.scrapeType || 'initial'
      })

      // Validate domain first
      const domainValidation = domainValidator.validateUrl(config.domain)
      if (!domainValidation.isValid) {
        return {
          success: false,
          error: `Invalid domain: ${domainValidation.error}`,
          warnings: domainValidation.warnings
        }
      }

      const domain = domainValidation.domain!
      const warnings: string[] = [...domainValidation.warnings]

      // Check if domain is already being scraped
      const domainStatus = await domainValidator.checkDomainStatus(domain)
      if (domainStatus.isBeingScrapped) {
        return {
          success: false,
          skipped: true,
          skipReason: `Domain ${domain} is already being scraped`,
          warnings
        }
      }

      // Determine scraping strategy based on customer and domain
      const scrapingStrategy = await determineScrapingStrategy(config, domainStatus)

      // Create and queue scraping job
      const result = await createAndQueueJob(
        { ...config, domain },
        scrapingStrategy
      )

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          warnings
        }
      }

      logger.info('Customer scraping integration completed successfully', {
        customerConfigId: config.customerConfigId,
        domain,
        jobId: result.jobId,
        queueJobId: result.queueJobId,
        strategy: scrapingStrategy.scrapeType
      })

      return {
        success: true,
        jobId: result.jobId,
        queueJobId: result.queueJobId,
        warnings
      }
    } catch (error) {
      logger.error('Error in customer scraping integration', {
        customerConfigId: config.customerConfigId,
        domain: config.domain,
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown integration error'
      }
    }
  }

  /**
   * Handle customer configuration updates
   */
  async handleCustomerConfigUpdate(
    oldConfig: { domain: string; customerConfigId: string },
    newConfig: CustomerScrapingConfig
  ): Promise<ScrapingTriggerResult> {
    try {
      logger.info('Processing customer configuration update', {
        customerConfigId: newConfig.customerConfigId,
        oldDomain: oldConfig.domain,
        newDomain: newConfig.domain
      })

      // If domain hasn't changed, skip scraping
      if (oldConfig.domain === newConfig.domain) {
        return {
          success: true,
          skipped: true,
          skipReason: 'Domain unchanged, no scraping needed'
        }
      }

      // Cancel any pending jobs for the old domain
      await cancelPendingJobs(oldConfig.domain, oldConfig.customerConfigId)

      // Trigger scraping for new domain
      return await this.handleNewCustomerConfig({
        ...newConfig,
        scrapeType: 'refresh' // Use refresh type for updates
      })
    } catch (error) {
      logger.error('Error handling customer config update', {
        customerConfigId: newConfig.customerConfigId,
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration update error'
      }
    }
  }

  /**
   * Handle domain changes or updates
   */
  async handleDomainUpdate(domainId: string, newDomain: string): Promise<ScrapingTriggerResult[]> {
    try {
      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }

      const { data: customerConfigs, error } = await supabase
        .from('customer_configs')
        .select('id, customer_id, domain')
        .eq('domain', newDomain)

      if (error) {
        throw new Error(`Failed to fetch customer configs: ${error.message}`)
      }

      if (!customerConfigs || customerConfigs.length === 0) {
        return [
          {
            success: true,
            skipped: true,
            skipReason: 'No customer configurations found for domain'
          }
        ]
      }

      // Trigger scraping for all affected customer configurations
      const results: ScrapingTriggerResult[] = []

      for (const config of customerConfigs as CustomerConfigRow[]) {
        const result = await this.handleNewCustomerConfig({
          customerId: config.customer_id,
          customerConfigId: config.id,
          domain: newDomain,
          scrapeType: 'refresh'
        })
        results.push(result)
      }

      logger.info('Domain update processing completed', {
        domainId,
        domain: newDomain,
        affectedConfigs: customerConfigs.length,
        successfulJobs: results.filter(r => r.success).length
      })

      return results
    } catch (error) {
      logger.error('Error handling domain update', {
        domainId,
        newDomain,
        error: error instanceof Error ? error.message : error
      })

      return [
        {
          success: false,
          error: error instanceof Error ? error.message : 'Domain update error'
        }
      ]
    }
  }

  /**
   * Schedule refresh scraping for existing customers
   */
  async scheduleRefreshScraping(
    customerConfigId: string,
    priority: JobPriority = JobPriority.NORMAL
  ): Promise<ScrapingTriggerResult> {
    try {
      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Failed to create Supabase client')
      }

      const { data: customerConfig, error } = await supabase
        .from('customer_configs')
        .select('id, domain, customer_id')
        .eq('id', customerConfigId)
        .single()

      if (error || !customerConfig) {
        return {
          success: false,
          error: `Customer configuration not found: ${error?.message || 'Unknown error'}`
        }
      }

      const config = await scheduleRefresh(customerConfig as CustomerConfigRow, priority)
      return await this.handleNewCustomerConfig(config)
    } catch (error) {
      logger.error('Error scheduling refresh scraping', {
        customerConfigId,
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refresh scheduling error'
      }
    }
  }

  /**
   * Get integration status for a customer configuration
   */
  async getIntegrationStatus(customerConfigId: string) {
    return await getStatus(customerConfigId)
  }
}

// Export singleton instance
export const customerScrapingIntegration = CustomerScrapingIntegration.getInstance()

// Export utility functions
export const handleNewCustomerConfig = (config: CustomerScrapingConfig) =>
  customerScrapingIntegration.handleNewCustomerConfig(config)

export const handleCustomerConfigUpdate = (oldConfig: any, newConfig: CustomerScrapingConfig) =>
  customerScrapingIntegration.handleCustomerConfigUpdate(oldConfig, newConfig)

export const scheduleRefreshScraping = (customerConfigId: string, priority?: JobPriority) =>
  customerScrapingIntegration.scheduleRefreshScraping(customerConfigId, priority)

export const getIntegrationStatus = (customerConfigId: string) =>
  customerScrapingIntegration.getIntegrationStatus(customerConfigId)
