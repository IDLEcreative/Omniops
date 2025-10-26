/**
 * Scrape Job Manager Types
 * Type definitions and interfaces for scrape job management
 */

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

export interface GetJobsOptions {
  domain?: string
  status?: ScrapeJob['status'][]
  job_type?: string
  limit?: number
  offset?: number
  order_by?: 'created_at' | 'priority' | 'updated_at'
  order_direction?: 'asc' | 'desc'
}

export interface GetJobsResult {
  jobs: ScrapeJob[]
  count: number
}

export interface JobStats {
  total: number
  pending: number
  running: number
  completed: number
  failed: number
  cancelled: number
}

export interface CleanupResult {
  deleted: number
}
