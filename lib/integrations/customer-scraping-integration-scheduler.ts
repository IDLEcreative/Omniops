/**
 * Customer Scraping Integration - Scheduling Logic
 *
 * Handles scraping strategy determination and job scheduling for customer configurations.
 */

import { logger } from '@/lib/logger'
import {
  CustomerScrapingConfig,
  ScrapingStrategy,
  DomainStatus,
  JobPriority
} from './customer-scraping-integration-types'

/**
 * Determine the appropriate scraping strategy based on customer config and domain status
 */
export async function determineScrapingStrategy(
  config: CustomerScrapingConfig,
  domainStatus: DomainStatus
): Promise<ScrapingStrategy> {
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

/**
 * Schedule refresh scraping for existing customers
 */
export async function scheduleRefresh(
  customerConfig: { id: string; domain: string; customer_id: string },
  priority: JobPriority = JobPriority.NORMAL
): Promise<CustomerScrapingConfig> {
  logger.info('Scheduling refresh scraping', {
    customerConfigId: customerConfig.id,
    domain: customerConfig.domain,
    priority
  })

  return {
    customerId: customerConfig.customer_id,
    customerConfigId: customerConfig.id,
    domain: customerConfig.domain,
    priority,
    scrapeType: 'refresh'
  }
}

/**
 * Build scraping configuration with sensible defaults
 */
export function buildScrapingConfig(
  strategy: ScrapingStrategy,
  baseConfig?: Record<string, any>
): Record<string, any> {
  return {
    ...strategy.config,
    ...baseConfig
  }
}
