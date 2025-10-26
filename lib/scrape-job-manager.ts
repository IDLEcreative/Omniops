/**
 * Scrape Job Manager
 * Orchestrates job management using modular components
 */

import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { scrapeJobScheduler } from './scrape-job-manager-scheduler'
import { scrapeJobExecutor } from './scrape-job-manager-executor'
import type {
  ScrapeJob,
  CreateScrapeJobOptions,
  UpdateScrapeJobOptions,
  GetJobsOptions,
  GetJobsResult,
  JobStats,
  CleanupResult
} from './scrape-job-manager-types'

export * from './scrape-job-manager-types'

export class ScrapeJobManager {
  private async getSupabase() {
    return await createClient()
  }

  /**
   * Create a new scrape job
   */
  async createJob(options: CreateScrapeJobOptions): Promise<ScrapeJob> {
    const existingJob = await scrapeJobScheduler.findPendingJob(
      options.domain,
      options.job_type
    )
    return scrapeJobExecutor.createJob(options, existingJob)
  }

  /**
   * Update an existing scrape job
   */
  async updateJob(jobId: string, updates: UpdateScrapeJobOptions): Promise<ScrapeJob> {
    return scrapeJobExecutor.updateJob(jobId, updates)
  }

  /**
   * Get a scrape job by ID
   */
  async getJob(jobId: string): Promise<ScrapeJob | null> {
    try {
      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
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
    return scrapeJobScheduler.findPendingJob(domain, jobType)
  }

  /**
   * Get jobs with optional filters
   */
  async getJobs(options: GetJobsOptions = {}): Promise<GetJobsResult> {
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
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
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
    return scrapeJobScheduler.getNextJob()
  }

  /**
   * Mark job as started and return it (atomic operation)
   */
  async claimJob(jobId: string): Promise<ScrapeJob | null> {
    return scrapeJobScheduler.claimJob(jobId)
  }

  /**
   * Retry a failed job (increment retry count and reset to pending)
   */
  async retryJob(jobId: string): Promise<ScrapeJob | null> {
    const currentJob = await this.getJob(jobId)
    if (!currentJob) {
      throw new Error('Job not found')
    }
    return scrapeJobScheduler.retryJob(jobId, currentJob)
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, reason?: string): Promise<ScrapeJob | null> {
    return scrapeJobExecutor.cancelJob(jobId, reason)
  }

  /**
   * Get job statistics
   */
  async getJobStats(domain?: string): Promise<JobStats> {
    try {
      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
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

      const stats: JobStats = {
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
  async cleanupOldJobs(olderThanDays: number = 30): Promise<CleanupResult> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
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
