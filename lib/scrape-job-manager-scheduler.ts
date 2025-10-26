/**
 * Scrape Job Manager Scheduler
 * Handles job scheduling, claiming, and retry logic
 */

import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import type { ScrapeJob } from './scrape-job-manager-types'

export class ScrapeJobScheduler {
  private async getSupabase() {
    return await createClient()
  }

  /**
   * Get next job from queue (by priority and creation time)
   */
  async getNextJob(): Promise<ScrapeJob | null> {
    try {
      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
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
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
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
  async retryJob(jobId: string, currentJob: ScrapeJob): Promise<ScrapeJob | null> {
    try {
      if (currentJob.retry_count >= currentJob.max_retries) {
        throw new Error('Job has exceeded maximum retry attempts')
      }

      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
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
   * Find pending or running job for a domain
   */
  async findPendingJob(domain: string, jobType?: string): Promise<ScrapeJob | null> {
    try {
      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
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
}

export const scrapeJobScheduler = new ScrapeJobScheduler()
