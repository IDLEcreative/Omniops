/**
 * Scrape Job Manager Executor
 * Handles job creation, updates, and cancellation
 */

import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import type { ScrapeJob, CreateScrapeJobOptions, UpdateScrapeJobOptions } from './scrape-job-manager-types'

export class ScrapeJobExecutor {
  private async getSupabase() {
    return await createClient()
  }

  /**
   * Validate job creation options
   */
  private validateCreateOptions(options: CreateScrapeJobOptions): void {
    if (!options.domain || options.domain.trim() === '') {
      throw new Error('Domain is required')
    }

    const priority = options.priority ?? 5
    if (priority < 1 || priority > 10) {
      throw new Error('Priority must be between 1 and 10')
    }
  }

  /**
   * Get domain and customer config IDs
   */
  private async getDomainInfo(domain: string): Promise<{
    domain_id?: string
    customer_config_id?: string
  }> {
    const supabase = await this.getSupabase()
    if (!supabase) {
      throw new Error('Database connection unavailable')
    }

    const [domainResult, configResult] = await Promise.all([
      supabase
        .from('domains')
        .select('id')
        .eq('domain', domain)
        .maybeSingle(),
      supabase
        .from('customer_configs')
        .select('id')
        .eq('domain', domain)
        .maybeSingle()
    ])

    return {
      domain_id: domainResult.data?.id,
      customer_config_id: configResult.data?.id
    }
  }

  /**
   * Create a new scrape job
   */
  async createJob(
    options: CreateScrapeJobOptions,
    existingJob: ScrapeJob | null
  ): Promise<ScrapeJob> {
    try {
      this.validateCreateOptions(options)

      const {
        domain,
        job_type = 'domain_scrape',
        priority = 5,
        config = {},
        metadata = {}
      } = options

      // Check for existing pending/running job
      if (existingJob) {
        throw new Error(`A ${existingJob.status} job already exists for domain: ${domain}`)
      }

      // Get domain and customer config IDs
      const { domain_id, customer_config_id } = await this.getDomainInfo(domain)

      // Create the job
      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
      const { data, error } = await supabase
        .from('scrape_jobs')
        .insert({
          domain_id,
          customer_config_id,
          domain,
          job_type,
          status: 'pending',
          priority,
          config,
          metadata: {
            ...metadata,
            created_manually: true,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to create scrape job', { error, domain, job_type })
        throw new Error(`Failed to create scrape job: ${error.message}`)
      }

      logger.info('Scrape job created successfully', {
        job_id: data.id,
        domain,
        job_type,
        priority
      })

      return data as ScrapeJob

    } catch (error) {
      logger.error('Error creating scrape job', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }

  /**
   * Update an existing scrape job
   */
  async updateJob(jobId: string, updates: UpdateScrapeJobOptions): Promise<ScrapeJob> {
    try {
      const updateData: any = { ...updates }

      // Set timestamps based on status changes
      if (updates.status === 'running' && !updates.started_at) {
        updateData.started_at = new Date().toISOString()
      }
      if (['completed', 'failed', 'cancelled'].includes(updates.status!) && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }

      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
      const { data, error } = await supabase
        .from('scrape_jobs')
        .update(updateData)
        .eq('id', jobId)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update scrape job', { error, jobId, updates })
        throw new Error(`Failed to update scrape job: ${error.message}`)
      }

      logger.info('Scrape job updated successfully', {
        job_id: jobId,
        status: updates.status,
        domain: data.domain
      })

      return data as ScrapeJob

    } catch (error) {
      logger.error('Error updating scrape job', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, reason?: string): Promise<ScrapeJob | null> {
    try {
      const updateData: any = {
        status: 'cancelled',
        completed_at: new Date().toISOString()
      }

      if (reason) {
        updateData.error_message = `Cancelled: ${reason}`
      }

      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
      const { data, error } = await supabase
        .from('scrape_jobs')
        .update(updateData)
        .eq('id', jobId)
        .in('status', ['pending', 'running'])
        .select()
        .maybeSingle()

      if (error) {
        logger.error('Failed to cancel job', { error, jobId })
        throw new Error(`Failed to cancel job: ${error.message}`)
      }

      if (data) {
        logger.info('Job cancelled successfully', { job_id: jobId, domain: data.domain, reason })
      }

      return data as ScrapeJob | null

    } catch (error) {
      logger.error('Error cancelling job', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }
}

export const scrapeJobExecutor = new ScrapeJobExecutor()
