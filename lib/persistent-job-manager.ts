/**
 * Persistent Job Manager
 *
 * Extends CrawlJobManager with Supabase persistence for long-term audit trail.
 * Jobs and results are stored in both Redis (cache) and Supabase (permanent).
 *
 * Architecture:
 * - Redis: Fast cache with TTL (1-24 hours) for active jobs
 * - Supabase: Permanent audit trail for compliance and analytics
 *
 * Use cases:
 * - Job status tracking beyond Redis TTL
 * - Historical scraping analytics
 * - Compliance audit trail
 * - Performance benchmarking over time
 */

import type { RedisClientWithFallback } from './redis-fallback';
import { CrawlJobManager } from './redis';
import { createServiceRoleClient } from './supabase/server';

// Use the same Redis types as redis.ts
type Redis = any; // Redis client from ioredis (type-only import)

export interface JobMetadata {
  jobId: string;
  customerId: string;
  domain: string;
  jobType: 'full_crawl' | 'incremental' | 'single_page' | 'refresh';
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface JobResult {
  url: string;
  status: 'success' | 'failed' | 'skipped';
  httpStatus?: number;
  contentHash?: string;
  pageId?: string;
  errorMessage?: string;
  processingTimeMs?: number;
}

export class PersistentJobManager extends CrawlJobManager {
  private enablePersistence: boolean;

  constructor(redis: Redis | RedisClientWithFallback, enablePersistence: boolean = true) {
    super(redis);
    this.enablePersistence = enablePersistence;
  }

  /**
   * Create a new job in Redis and Supabase
   */
  async createJob(jobId: string, jobData: any, metadata?: JobMetadata): Promise<void> {
    // Create in Redis (fast cache)
    await super.createJob(jobId, jobData);

    // Optionally persist to Supabase (permanent audit trail)
    if (this.enablePersistence && metadata) {
      try {
        await this.persistJobToSupabase(jobId, metadata);
      } catch (error) {
        console.error('[PersistentJobManager] Failed to persist job to Supabase:', error);
        // Don't throw - we want to continue even if persistence fails
      }
    }
  }

  /**
   * Update job status in both Redis and Supabase
   */
  async updateJob(
    jobId: string,
    updates: any,
    status?: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  ): Promise<void> {
    // Update in Redis
    await super.updateJob(jobId, updates);

    // Update in Supabase if status changed
    if (this.enablePersistence && status) {
      try {
        await this.updateJobStatusInSupabase(jobId, status);
      } catch (error) {
        console.error('[PersistentJobManager] Failed to update job in Supabase:', error);
        // Don't throw - we want to continue even if update fails
      }
    }
  }

  /**
   * Add job result to Redis and Supabase
   */
  async addJobResult(jobId: string, page: any, result?: JobResult): Promise<void> {
    // Add to Redis (cache)
    await super.addJobResult(jobId, page);

    // Persist to Supabase (permanent)
    if (this.enablePersistence && result) {
      try {
        await this.persistResultToSupabase(jobId, result);
      } catch (error) {
        console.error('[PersistentJobManager] Failed to persist result to Supabase:', error);
        // Don't throw - we want to continue even if persistence fails
      }
    }
  }

  /**
   * Persist job metadata to Supabase
   */
  private async persistJobToSupabase(jobId: string, metadata: JobMetadata): Promise<void> {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase.from('scrape_jobs').insert({
      job_id: jobId,
      customer_id: metadata.customerId,
      domain: metadata.domain,
      job_type: metadata.jobType,
      config: metadata.config,
      metadata: metadata.metadata,
      status: 'queued',
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Update job status in Supabase
   */
  private async updateJobStatusInSupabase(
    jobId: string,
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  ): Promise<void> {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const updates: Record<string, any> = {
      status,
    };

    if (status === 'running') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('scrape_jobs').update(updates).eq('job_id', jobId);

    if (error) {
      throw error;
    }
  }

  /**
   * Persist job result to Supabase
   */
  private async persistResultToSupabase(jobId: string, result: JobResult): Promise<void> {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Get customer_id from job
    const { data: job, error: jobError } = await supabase
      .from('scrape_jobs')
      .select('customer_id')
      .eq('job_id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job ${jobId} not found in Supabase`);
    }

    const { error } = await supabase.from('scrape_job_results').insert({
      job_id: jobId,
      customer_id: job.customer_id,
      url: result.url,
      status: result.status,
      http_status: result.httpStatus,
      content_hash: result.contentHash,
      page_id: result.pageId,
      error_message: result.errorMessage,
      processing_time_ms: result.processingTimeMs,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Get job from Supabase (if not in Redis cache)
   */
  async getJobFromSupabase(jobId: string): Promise<any | null> {
    if (!this.enablePersistence) {
      return null;
    }

    try {
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[PersistentJobManager] Failed to get job from Supabase:', error);
      return null;
    }
  }

  /**
   * Get job results from Supabase (beyond Redis TTL)
   */
  async getJobResultsFromSupabase(jobId: string): Promise<JobResult[]> {
    if (!this.enablePersistence) {
      return [];
    }

    try {
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('scrape_job_results')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (
        data?.map((row: any) => ({
          url: row.url,
          status: row.status as 'success' | 'failed' | 'skipped',
          httpStatus: row.http_status,
          contentHash: row.content_hash,
          pageId: row.page_id,
          errorMessage: row.error_message,
          processingTimeMs: row.processing_time_ms,
        })) ?? []
      );
    } catch (error) {
      console.error('[PersistentJobManager] Failed to get results from Supabase:', error);
      return [];
    }
  }

  /**
   * Get job statistics from Supabase
   */
  async getJobStats(jobId: string): Promise<any | null> {
    if (!this.enablePersistence) {
      return null;
    }

    try {
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from('scrape_job_stats')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[PersistentJobManager] Failed to get stats from Supabase:', error);
      return null;
    }
  }

  /**
   * Mark job as failed with error message
   */
  async failJob(jobId: string, errorMessage: string): Promise<void> {
    // Update in Redis
    await this.updateJob(jobId, { status: 'failed', error: errorMessage });

    // Update in Supabase
    if (this.enablePersistence) {
      try {
        const supabase = await createServiceRoleClient();
        if (!supabase) {
          return;
        }

        await supabase
          .from('scrape_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('job_id', jobId);
      } catch (error) {
        console.error('[PersistentJobManager] Failed to mark job as failed in Supabase:', error);
      }
    }
  }

  /**
   * Clean up old jobs from Supabase (beyond retention period)
   */
  async cleanupOldJobs(retentionDays: number = 90): Promise<number> {
    if (!this.enablePersistence) {
      return 0;
    }

    try {
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        return 0;
      }

      const { data, error } = await supabase.rpc('cleanup_old_scrape_jobs', {
        retention_days: retentionDays,
      });

      if (error) {
        throw error;
      }

      return data ?? 0;
    } catch (error) {
      console.error('[PersistentJobManager] Failed to cleanup old jobs:', error);
      return 0;
    }
  }
}

// Singleton with persistence enabled by default
let persistentJobManager: PersistentJobManager | null = null;

export async function getPersistentJobManager(
  redis?: Redis | RedisClientWithFallback,
  enablePersistence: boolean = true
): Promise<PersistentJobManager> {
  if (!persistentJobManager) {
    if (!redis) {
      const { getRedisClient } = await import('./redis');
      redis = getRedisClient();
    }
    persistentJobManager = new PersistentJobManager(redis, enablePersistence);
  }
  return persistentJobManager;
}
