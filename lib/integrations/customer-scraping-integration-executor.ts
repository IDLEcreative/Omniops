/**
 * Customer Scraping Integration - Execution Logic
 *
 * Handles job creation, queue management, and status tracking for scraping operations.
 */

import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { scrapeJobManager } from '@/lib/scrape-job-manager'
import { JobUtils } from '@/lib/queue/queue-utils'
import {
  CustomerScrapingConfig,
  ScrapingStrategy,
  JobCreationResult,
  QueueAdditionResult,
  IntegrationStatus,
  JobPriority,
  ScrapeJobRow
} from './customer-scraping-integration-types'

/**
 * Create a scraping job in the database
 */
export async function createScrapingJob(
  config: CustomerScrapingConfig & { scrapeType: string; priority: JobPriority; jobType: string }
): Promise<JobCreationResult> {
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

    logger.info('Scraping job created', {
      jobId: job.id,
      domain: config.domain,
      jobType: config.jobType
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

/**
 * Add job to processing queue
 */
export async function addToQueue(
  domain: string,
  options: {
    customerId?: string
    isNewCustomer: boolean
    priority: JobPriority
    metadata: Record<string, any>
  }
): Promise<QueueAdditionResult> {
  try {
    const queueResult = await JobUtils.createSinglePageJob(domain, {
      customerId: options.customerId,
      isNewCustomer: options.isNewCustomer,
      priority: options.priority,
      metadata: options.metadata
    })

    logger.info('Job added to processing queue', {
      domain,
      priority: options.priority,
      isNewCustomer: options.isNewCustomer,
      queueJobId: queueResult.jobId,
      deduplicated: queueResult.deduplicated
    })

    return {
      success: true,
      queueJobId: queueResult.jobId
    }
  } catch (error) {
    logger.error('Failed to add job to queue', {
      domain,
      error: error instanceof Error ? error.message : error
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Queue addition failed'
    }
  }
}

/**
 * Cancel pending jobs for a domain and customer configuration
 */
export async function cancelPendingJobs(domain: string, customerConfigId: string): Promise<void> {
  try {
    const supabase = await createClient()
    if (!supabase) {
      logger.error('Failed to create Supabase client for cancelling jobs')
      return
    }

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
export async function getIntegrationStatus(customerConfigId: string): Promise<IntegrationStatus> {
  try {
    const supabase = await createClient()
    if (!supabase) {
      throw new Error('Failed to create Supabase client')
    }

    const { data: jobs, error } = await supabase
      .from('scrape_jobs')
      .select('status, created_at, completed_at')
      .eq('customer_config_id', customerConfigId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error getting integration status', { customerConfigId, error })
      throw error
    }

    const jobRows = (jobs || []) as ScrapeJobRow[]
    const hasActiveJobs = jobRows.some(job => ['pending', 'running'].includes(job.status))
    const lastJob = jobRows[0]

    return {
      hasActiveJobs,
      lastJobStatus: lastJob?.status,
      lastJobDate: lastJob?.created_at,
      totalJobs: jobRows.length,
      successfulJobs: jobRows.filter(j => j.status === 'completed').length,
      failedJobs: jobRows.filter(j => j.status === 'failed').length
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

/**
 * Create and queue a scraping job in one operation
 */
export async function createAndQueueJob(
  config: CustomerScrapingConfig,
  strategy: ScrapingStrategy
): Promise<{ success: boolean; jobId?: string; queueJobId?: string; error?: string }> {
  // Create the job
  const jobResult = await createScrapingJob({
    ...config,
    scrapeType: strategy.scrapeType as 'initial' | 'refresh' | 'full-crawl',
    priority: strategy.priority,
    jobType: strategy.jobType,
    config: strategy.config
  })

  if (!jobResult.success) {
    return {
      success: false,
      error: jobResult.error
    }
  }

  // Add to queue
  const queueResult = await addToQueue(config.domain, {
    customerId: config.customerId,
    isNewCustomer: config.scrapeType === 'initial',
    priority: strategy.priority,
    metadata: {
      ...config.metadata,
      customerConfigId: config.customerConfigId,
      jobId: jobResult.jobId,
      scrapeType: strategy.scrapeType
    }
  })

  if (!queueResult.success) {
    return {
      success: false,
      jobId: jobResult.jobId,
      error: queueResult.error
    }
  }

  return {
    success: true,
    jobId: jobResult.jobId,
    queueJobId: queueResult.queueJobId
  }
}
