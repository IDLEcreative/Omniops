/**
 * Domain Database Checker
 * Handles all database operations for domain validation
 */

import { createClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { normalizeDomain } from './validators'
import type { DomainCheckResult, DomainAccessibilityResult } from './types'

/**
 * Domain Database Checker Class
 * Handles domain lookups, suggestions, and accessibility checks
 */
export class DomainDatabaseChecker {
  private static instance: DomainDatabaseChecker

  constructor() {
    // Don't create Supabase client in constructor - it needs request context
  }

  private async getSupabase() {
    // Create client on-demand during request handling
    return await createClient()
  }

  static getInstance(): DomainDatabaseChecker {
    if (!DomainDatabaseChecker.instance) {
      DomainDatabaseChecker.instance = new DomainDatabaseChecker()
    }
    return DomainDatabaseChecker.instance
  }

  /**
   * Check if a domain is already being scraped or exists in the system
   */
  async checkDomainStatus(domain: string): Promise<DomainCheckResult> {
    try {
      const normalizedDomain = normalizeDomain(domain)

      // Check if domain exists in customer_configs
      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Failed to create Supabase client')
      }
      const { data: customerConfig, error: configError } = await supabase
        .from('customer_configs')
        .select('id, domain')
        .eq('domain', normalizedDomain)
        .maybeSingle()

      if (configError && configError.code !== 'PGRST116') {
        logger.error('Error checking customer config', { domain: normalizedDomain, error: configError })
      }

      // Check if domain exists in domains table
      const supabase2 = await this.getSupabase()
      if (!supabase2) {
        throw new Error('Failed to create Supabase client')
      }
      const { data: domainRecord, error: domainError } = await supabase2
        .from('domains')
        .select('id, domain')
        .eq('domain', normalizedDomain)
        .maybeSingle()

      if (domainError && domainError.code !== 'PGRST116') {
        logger.error('Error checking domain record', { domain: normalizedDomain, error: domainError })
      }

      // Check for recent scrape jobs
      const supabase3 = await this.getSupabase()
      if (!supabase3) {
        throw new Error('Failed to create Supabase client')
      }
      const { data: lastScrapeJob, error: jobError } = await supabase3
        .from('scrape_jobs')
        .select('id, status, created_at')
        .eq('domain', normalizedDomain)
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (jobError && jobError.code !== 'PGRST116') {
        logger.error('Error checking scrape jobs', { domain: normalizedDomain, error: jobError })
      }

      const isBeingScrapped = lastScrapeJob?.status === 'pending' || lastScrapeJob?.status === 'running'

      return {
        exists: !!(customerConfig || domainRecord),
        isBeingScrapped,
        customerConfigId: customerConfig?.id || null,
        domainId: domainRecord?.id || null,
        lastScrapeJob: lastScrapeJob || null
      }

    } catch (error) {
      logger.error('Error checking domain status', { domain, error: error instanceof Error ? error.message : error })

      return {
        exists: false,
        isBeingScrapped: false,
        customerConfigId: null,
        domainId: null,
        lastScrapeJob: null
      }
    }
  }

  /**
   * Get domain suggestions based on partial input
   */
  async getDomainSuggestions(partialDomain: string, limit: number = 10): Promise<string[]> {
    try {
      if (!partialDomain || partialDomain.length < 2) {
        return []
      }

      const supabase = await this.getSupabase()
      if (!supabase) {
        throw new Error('Failed to create Supabase client')
      }
      const { data: domains, error } = await supabase
        .from('customer_configs')
        .select('domain')
        .ilike('domain', `%${partialDomain}%`)
        .limit(limit)

      if (error) {
        logger.error('Error getting domain suggestions', { partialDomain, error })
        return []
      }

      return domains?.map(d => d.domain) || []

    } catch (error) {
      logger.error('Error in getDomainSuggestions', { partialDomain, error })
      return []
    }
  }

  /**
   * Check if a domain is accessible (basic connectivity test)
   */
  async checkDomainAccessibility(
    domain: string,
    timeout: number = 5000
  ): Promise<DomainAccessibilityResult> {
    const startTime = Date.now()

    try {
      const normalizedDomain = normalizeDomain(domain)
      const url = `https://${normalizedDomain}`

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Customer-Service-Agent/1.0 (Website Checker)'
        }
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      return {
        accessible: response.ok || response.status < 500,
        statusCode: response.status,
        responseTime
      }

    } catch (error) {
      const responseTime = Date.now() - startTime

      return {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      }
    }
  }
}

// Export singleton instance
export const domainDatabaseChecker = DomainDatabaseChecker.getInstance()
