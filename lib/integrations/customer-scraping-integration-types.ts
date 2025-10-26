/**
 * Customer Scraping Integration - Type Definitions
 *
 * Type definitions, interfaces, and enums for the customer scraping integration system.
 */

import { JobPriority } from '@/lib/queue/queue-utils'

// Re-export JobPriority for consumers
export { JobPriority } from '@/lib/queue/queue-utils'

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

export interface ScrapingStrategy {
  scrapeType: string
  priority: JobPriority
  jobType: string
  config: Record<string, any>
}

export interface JobCreationResult {
  success: boolean
  jobId?: string
  error?: string
}

export interface QueueAdditionResult {
  success: boolean
  queueJobId?: string
  error?: string
}

export interface IntegrationStatus {
  hasActiveJobs: boolean
  lastJobStatus?: string
  lastJobDate?: string
  totalJobs: number
  successfulJobs: number
  failedJobs: number
}

export interface DomainStatus {
  exists: boolean
  isBeingScrapped: boolean
}

export interface CustomerConfigRow {
  id: string
  domain: string
  customer_id: string
}

export interface ScrapeJobRow {
  id: string
  status: string
  created_at: string
  completed_at?: string
}
