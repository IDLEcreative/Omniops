/**
 * Scrape Job Manager
 * Helper functions for managing scraping jobs in the database
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface ScrapeJob {
  id: string
  domain_id?: string
  customer_config_id?: string
  domain: string
  job_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  priority: number
  retry_count: number
  max_retries: number
  config: Record<string, any>
  metadata: Record<string, any>
  started_at?: string
  completed_at?: string
  error_message?: string
  stats: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateScrapeJobOptions {
  domain: string
  job_type?: string
  priority?: number
  config?: Record<string, any>
  metadata?: Record<string, any>
}

export interface UpdateScrapeJobOptions {
  status?: ScrapeJob['status']
  error_message?: string
  stats?: Record<string, any>
  retry_count?: number
  started_at?: string
  completed_at?: string
  metadata?: Record<string, any>
}

export class ScrapeJobManager {
  private supabasePromise: ReturnType<typeof createClient>

  constructor() {
    this.supabasePromise = createClient()
  }

  private async getSupabase() {
    return await this.supabasePromise
  }

  /**
   * Create a new scrape job
   */
  async createJob(options: CreateScrapeJobOptions): Promise<ScrapeJob> {
    try {
      const {
        domain,
        job_type = 'domain_scrape',
        priority = 5,
        config = {},
        metadata = {}
      } = options

      // Validate domain
      if (!domain || domain.trim() === '') {
        throw new Error('Domain is required')
      }

      // Validate priority
      if (priority < 1 || priority > 10) {
        throw new Error('Priority must be between 1 and 10')
      }

      // Check for existing pending/running job
      const existingJob = await this.findPendingJob(domain, job_type)
      if (existingJob) {
        throw new Error(`A ${existingJob.status} job already exists for domain: ${domain}`)
      }

      // Get domain and customer config IDs if they exist
      const supabaseClient = await this.getSupabase()
      const [domainResult, configResult] = await Promise.all([
        supabaseClient
          .from('domains')
          .select('id')
          .eq('domain', domain)
          .maybeSingle(),
        supabaseClient
          .from('customer_configs')
          .select('id')
          .eq('domain', domain)
          .maybeSingle()
      ])

      const domain_id = domainResult.data?.id
      const customer_config_id = configResult.data?.id

      // Create the job
      const supabase = await this.getSupabase()
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
   * Get a scrape job by ID
   */
  async getJob(jobId: string): Promise<ScrapeJob | null> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to get scrape job', { error, jobId })
        throw new Error(`Failed to get scrape job: ${error.message}`)
      }

      return data as ScrapeJob | null

    } catch (error) {
      logger.error('Error getting scrape job', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }

  /**
   * Find pending or running job for a domain
   */
  async findPendingJob(domain: string, jobType?: string): Promise<ScrapeJob | null> {
    try {
      const supabase = await this.getSupabase()
      let query = supabase
        .from('scrape_jobs')
        .select('*')
        .eq('domain', domain)
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false })

      if (jobType) {
        query = query.eq('job_type', jobType)
      }

      const { data, error } = await query.maybeSingle()

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to find pending job', { error, domain })
        throw new Error(`Failed to find pending job: ${error.message}`)
      }

      return data as ScrapeJob | null

    } catch (error) {
      logger.error('Error finding pending job', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }

  /**
   * Get jobs with optional filters
   */
  async getJobs(options: {
    domain?: string
    status?: ScrapeJob['status'][]
    job_type?: string
    limit?: number
    offset?: number
    order_by?: 'created_at' | 'priority' | 'updated_at'
    order_direction?: 'asc' | 'desc'
  } = {}): Promise<{ jobs: ScrapeJob[], count: number }> {
    try {
      const {
        domain,
        status,
        job_type,
        limit = 50,
        offset = 0,
        order_by = 'created_at',
        order_direction = 'desc'
      } = options

      const supabase = await this.getSupabase()
      let query = supabase
        .from('scrape_jobs')
        .select('*', { count: 'exact' })

      // Apply filters
      if (domain) {
        query = query.eq('domain', domain)
      }
      if (status && status.length > 0) {
        query = query.in('status', status)
      }
      if (job_type) {
        query = query.eq('job_type', job_type)
      }

      // Apply ordering and pagination
      query = query
        .order(order_by, { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        logger.error('Failed to get scrape jobs', { error, options })
        throw new Error(`Failed to get scrape jobs: ${error.message}`)
      }

      return {
        jobs: data as ScrapeJob[],
        count: count || 0
      }

    } catch (error) {
      logger.error('Error getting scrape jobs', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }

  /**
   * Get next job from queue (by priority and creation time)
   */
  async getNextJob(): Promise<ScrapeJob | null> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false }) // Higher priority first
        .order('created_at', { ascending: true }) // Older jobs first within same priority
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to get next job', { error })
        throw new Error(`Failed to get next job: ${error.message}`)
      }

      return data as ScrapeJob | null

    } catch (error) {
      logger.error('Error getting next job', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }

  /**
   * Mark job as started and return it (atomic operation)
   */
  async claimJob(jobId: string): Promise<ScrapeJob | null> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('scrape_jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'pending') // Only update if still pending
        .select()
        .maybeSingle()

      if (error) {
        logger.error('Failed to claim job', { error, jobId })
        throw new Error(`Failed to claim job: ${error.message}`)
      }

      if (data) {
        logger.info('Job claimed successfully', { job_id: jobId, domain: data.domain })
      }

      return data as ScrapeJob | null

    } catch (error) {
      logger.error('Error claiming job', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }

  /**
   * Retry a failed job (increment retry count and reset to pending)
   */
  async retryJob(jobId: string): Promise<ScrapeJob | null> {
    try {
      // Get current job to check retry limit
      const currentJob = await this.getJob(jobId)
      if (!currentJob) {
        throw new Error('Job not found')
      }

      if (currentJob.retry_count >= currentJob.max_retries) {
        throw new Error('Job has exceeded maximum retry attempts')
      }

      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('scrape_jobs')
        .update({
          status: 'pending',
          retry_count: currentJob.retry_count + 1,
          started_at: null,
          completed_at: null,
          error_message: null
        })
        .eq('id', jobId)
        .select()
        .single()

      if (error) {
        logger.error('Failed to retry job', { error, jobId })
        throw new Error(`Failed to retry job: ${error.message}`)
      }

      logger.info('Job scheduled for retry', { 
        job_id: jobId, 
        domain: data.domain,
        retry_count: data.retry_count
      })

      return data as ScrapeJob

    } catch (error) {
      logger.error('Error retrying job', { error: error instanceof Error ? error.message : error })
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

  /**
   * Get job statistics
   */
  async getJobStats(domain?: string): Promise<{
    total: number
    pending: number
    running: number
    completed: number
    failed: number
    cancelled: number
  }> {
    try {
      const supabase = await this.getSupabase()
      let query = supabase
        .from('scrape_jobs')
        .select('status')

      if (domain) {
        query = query.eq('domain', domain)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Failed to get job stats', { error })
        throw new Error(`Failed to get job stats: ${error.message}`)
      }

      const stats = {
        total: data.length,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      }

      data.forEach(job => {
        stats[job.status as keyof typeof stats]++
      })

      return stats

    } catch (error) {
      logger.error('Error getting job stats', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }

  /**
   * Clean up old completed/failed jobs (older than specified days)
   */
  async cleanupOldJobs(olderThanDays: number = 30): Promise<{ deleted: number }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('scrape_jobs')
        .delete()
        .in('status', ['completed', 'failed', 'cancelled'])
        .lt('completed_at', cutoffDate.toISOString())
        .select('id')

      if (error) {
        logger.error('Failed to cleanup old jobs', { error })
        throw new Error(`Failed to cleanup old jobs: ${error.message}`)
      }

      const deletedCount = data?.length || 0
      logger.info('Old jobs cleaned up', { deleted_count: deletedCount, older_than_days: olderThanDays })

      return { deleted: deletedCount }

    } catch (error) {
      logger.error('Error cleaning up old jobs', { error: error instanceof Error ? error.message : error })
      throw error
    }
  }
}

// Export singleton instance
export const scrapeJobManager = new ScrapeJobManager()

// Export utility functions
export const createScrapeJob = (options: CreateScrapeJobOptions) => 
  scrapeJobManager.createJob(options)

export const updateScrapeJob = (jobId: string, updates: UpdateScrapeJobOptions) => 
  scrapeJobManager.updateJob(jobId, updates)

export const getScrapeJob = (jobId: string) => 
  scrapeJobManager.getJob(jobId)

export const getNextScrapeJob = () => 
  scrapeJobManager.getNextJob()

export const claimScrapeJob = (jobId: string) => 
  scrapeJobManager.claimJob(jobId)