/**
 * Customer Scraping Integration
 * 
 * Manages the seamless integration between customer onboarding and automatic scraping.
 * Handles triggering scraping jobs when customers add or update their website configurations.
 */

import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { scrapeJobManager } from '@/lib/scrape-job-manager'
import { domainValidator } from '@/lib/utils/domain-validator'
// import { getQueueManager, JobPriority, JobUtils } from '@/lib/queue'

// Define JobPriority locally since queue system isn't fully set up yet
export enum JobPriority {
  CRITICAL = 10,
  HIGH = 5,
  NORMAL = 0,
  LOW = -5,
  DEFERRED = -10,
}

export interface CustomerScrapingConfig {
  customerId?: string
  customerConfigId: string
  domain: string
  priority?: JobPriority
  scrapeType?: 'initial' | 'refresh' | 'full-crawl'
  config?: Record<string, any>
  metadata?: Record<string, any>
}

export interface ScrapingTriggerResult {
  success: boolean
  jobId?: string
  queueJobId?: string
  error?: string
  warnings?: string[]
  skipped?: boolean
  skipReason?: string
}

export class CustomerScrapingIntegration {
  private static instance: CustomerScrapingIntegration
  // Create Supabase client on-demand within request context
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
      const scrapingStrategy = await this.determineScrapingStrategy(config, domainStatus)
      
      // Create scraping job
      const jobResult = await this.createScrapingJob({
        customerId: config.customerId,
        customerConfigId: config.customerConfigId,
        domain,
        metadata: config.metadata,
        scrapeType: scrapingStrategy.scrapeType as 'initial' | 'refresh' | 'full-crawl',
        priority: scrapingStrategy.priority,
        jobType: scrapingStrategy.jobType,
        config: scrapingStrategy.config
      })

      if (!jobResult.success) {
        return {
          success: false,
          error: jobResult.error,
          warnings
        }
      }

      // TODO: Add to queue for immediate processing
      // For now, we'll simulate queue addition since queue system is not fully set up
      const queueResult = {
        success: true,
        queueJobId: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Job would be queued for processing (simulated)'
      }
      
      logger.info('Scraping job created and would be queued', {
        jobId: jobResult.jobId,
        domain,
        queueJobId: queueResult.queueJobId
      })

      logger.info('Customer scraping integration completed successfully', {
        customerConfigId: config.customerConfigId,
        domain,
        jobId: jobResult.jobId,
        queueJobId: queueResult.queueJobId,
        strategy: scrapingStrategy.scrapeType
      })

      return {
        success: true,
        jobId: jobResult.jobId,
        queueJobId: queueResult.queueJobId,
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
    oldConfig: { domain: string, customerConfigId: string },
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
      await this.cancelPendingJobs(oldConfig.domain, oldConfig.customerConfigId)

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
      // Find all customer configs using this domain
      const supabase = await this.getSupabase()
      const { data: customerConfigs, error } = await supabase
        .from('customer_configs')
        .select('id, customer_id, domain')
        .eq('domain', newDomain)

      if (error) {
        throw new Error(`Failed to fetch customer configs: ${error.message}`)
      }

      if (!customerConfigs || customerConfigs.length === 0) {
        return [{
          success: true,
          skipped: true,
          skipReason: 'No customer configurations found for domain'
        }]
      }

      // Trigger scraping for all affected customer configurations
      const results: ScrapingTriggerResult[] = []
      
      for (const config of customerConfigs) {
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

      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Domain update error'
      }]
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
      // Get customer configuration
      const supabase = await this.getSupabase()
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

      return await this.handleNewCustomerConfig({
        customerId: customerConfig.customer_id,
        customerConfigId: customerConfig.id,
        domain: customerConfig.domain,
        priority,
        scrapeType: 'refresh'
      })

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

  // Private helper methods

  private async determineScrapingStrategy(
    config: CustomerScrapingConfig, 
    domainStatus: any
  ): Promise<{
    scrapeType: string
    priority: JobPriority
    jobType: string
    config: Record<string, any>
  }> {
    const isNewCustomer = config.scrapeType === 'initial'
    const hasExistingData = domainStatus.exists

    // New customers get high priority initial scraping
    if (isNewCustomer && !hasExistingData) {
      return {
        scrapeType: 'initial',
        priority: JobPriority.HIGH,
        jobType: 'initial_scrape',
        config: {
          turboMode: true,
          timeout: 30000,
          maxPages: 5, // Start with key pages for new customers
          depth: 2,
          skipRobotsTxt: false,
          ...config.config
        }
      }
    }

    // Refresh for existing customers or data
    if (config.scrapeType === 'refresh' || hasExistingData) {
      return {
        scrapeType: 'refresh',
        priority: config.priority || JobPriority.NORMAL,
        jobType: 'refresh_scrape',
        config: {
          forceRefresh: true,
          compareContent: true,
          timeout: 45000,
          skipUnchangedPages: true,
          ...config.config
        }
      }
    }

    // Full crawl for comprehensive scraping
    if (config.scrapeType === 'full-crawl') {
      return {
        scrapeType: 'full-crawl',
        priority: config.priority || JobPriority.LOW,
        jobType: 'full_crawl',
        config: {
          maxPages: 100,
          depth: 3,
          respectRobotsTxt: true,
          delay: 1000,
          timeout: 60000,
          ...config.config
        }
      }
    }

    // Default to initial scraping
    return {
      scrapeType: 'initial',
      priority: JobPriority.NORMAL,
      jobType: 'domain_scrape',
      config: {
        timeout: 30000,
        maxPages: 10,
        ...config.config
      }
    }
  }

  private async createScrapingJob(config: CustomerScrapingConfig & {
    scrapeType: string
    priority: JobPriority
    jobType: string
  }): Promise<{ success: boolean, jobId?: string, error?: string }> {
    try {
      const job = await scrapeJobManager.createJob({
        domain: config.domain,
        job_type: config.jobType,
        priority: config.priority,
        config: config.config || {},
        metadata: {
          customerConfigId: config.customerConfigId,
          customerId: config.customerId,
          scrapeType: config.scrapeType,
          triggeredBy: 'customer-integration',
          ...config.metadata
        }
      })

      return {
        success: true,
        jobId: job.id
      }

    } catch (error) {
      logger.error('Failed to create scraping job', {
        domain: config.domain,
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Job creation failed'
      }
    }
  }

  private async addToQueue(
    jobId: string, 
    options: {
      priority: JobPriority
      isNewCustomer: boolean
      domain: string
      customerConfigId: string
    }
  ): Promise<{ success: boolean, queueJobId?: string, error?: string }> {
    try {
      // TODO: Implement actual queue integration when queue system is ready
      // For now, simulate queue addition
      
      const queueJobId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      logger.info('Simulating queue job creation', {
        scrapeJobId: jobId,
        domain: options.domain,
        priority: options.priority,
        isNewCustomer: options.isNewCustomer,
        queueJobId
      })

      return {
        success: true,
        queueJobId
      }

    } catch (error) {
      logger.error('Failed to add job to queue', {
        jobId,
        domain: options.domain,
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Queue addition failed'
      }
    }
  }

  private async cancelPendingJobs(domain: string, customerConfigId: string): Promise<void> {
    try {
      // Find pending/running jobs for this domain and customer
      const supabase = await this.getSupabase()
      const { data: pendingJobs, error } = await supabase
        .from('scrape_jobs')
        .select('id')
        .eq('domain', domain)
        .eq('customer_config_id', customerConfigId)
        .in('status', ['pending', 'running'])

      if (error) {
        logger.error('Error finding pending jobs to cancel', { domain, customerConfigId, error })
        return
      }

      if (pendingJobs && pendingJobs.length > 0) {
        // Cancel each pending job
        for (const job of pendingJobs) {
          await scrapeJobManager.cancelJob(job.id, 'Domain configuration updated')
        }

        logger.info('Cancelled pending jobs for domain update', {
          domain,
          customerConfigId,
          cancelledJobs: pendingJobs.length
        })
      }

    } catch (error) {
      logger.error('Error cancelling pending jobs', {
        domain,
        customerConfigId,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * Get integration status for a customer configuration
   */
  async getIntegrationStatus(customerConfigId: string): Promise<{
    hasActiveJobs: boolean
    lastJobStatus?: string
    lastJobDate?: string
    totalJobs: number
    successfulJobs: number
    failedJobs: number
  }> {
    try {
      const supabase = await this.getSupabase()
      const { data: jobs, error } = await supabase
        .from('scrape_jobs')
        .select('status, created_at, completed_at')
        .eq('customer_config_id', customerConfigId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error getting integration status', { customerConfigId, error })
        throw error
      }

      const hasActiveJobs = jobs?.some(job => ['pending', 'running'].includes(job.status)) || false
      const lastJob = jobs?.[0]
      
      return {
        hasActiveJobs,
        lastJobStatus: lastJob?.status,
        lastJobDate: lastJob?.created_at,
        totalJobs: jobs?.length || 0,
        successfulJobs: jobs?.filter((j: any) => j.status === 'completed').length || 0,
        failedJobs: jobs?.filter((j: any) => j.status === 'failed').length || 0
      }

    } catch (error) {
      logger.error('Error in getIntegrationStatus', {
        customerConfigId,
        error: error instanceof Error ? error.message : error
      })
      
      return {
        hasActiveJobs: false,
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0
      }
    }
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
