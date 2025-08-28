/**
 * Domain Validator Utility
 * 
 * Provides comprehensive URL validation, domain extraction, and domain checking
 * for the customer onboarding and scraping integration system.
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface DomainValidationResult {
  isValid: boolean
  domain: string | null
  normalizedUrl: string | null
  error: string | null
  warnings: string[]
}

export interface DomainCheckResult {
  exists: boolean
  isBeingScrapped: boolean
  customerConfigId: string | null
  domainId: string | null
  lastScrapeJob: {
    id: string
    status: string
    created_at: string
  } | null
}

export class DomainValidator {
  private static instance: DomainValidator
  private supabasePromise: ReturnType<typeof createClient>

  constructor() {
    this.supabasePromise = createClient()
  }

  private async getSupabase() {
    return await this.supabasePromise
  }

  static getInstance(): DomainValidator {
    if (!DomainValidator.instance) {
      DomainValidator.instance = new DomainValidator()
    }
    return DomainValidator.instance
  }

  /**
   * Validate and normalize a URL
   */
  validateUrl(url: string): DomainValidationResult {
    const warnings: string[] = []
    
    try {
      // Clean up the URL
      let cleanUrl = url.trim()
      
      if (!cleanUrl) {
        return {
          isValid: false,
          domain: null,
          normalizedUrl: null,
          error: 'URL cannot be empty',
          warnings: []
        }
      }

      // Add protocol if missing
      if (!cleanUrl.match(/^https?:\/\//)) {
        cleanUrl = `https://${cleanUrl}`
        warnings.push('Added HTTPS protocol to URL')
      }

      // Parse the URL
      const parsedUrl = new URL(cleanUrl)

      // Basic validation checks
      if (!parsedUrl.hostname) {
        return {
          isValid: false,
          domain: null,
          normalizedUrl: null,
          error: 'Invalid URL: missing hostname',
          warnings
        }
      }

      // Check for localhost/internal domains
      if (this.isLocalhost(parsedUrl.hostname)) {
        warnings.push('Localhost or internal domain detected - scraping may not work')
      }

      // Check for IP addresses
      if (this.isIpAddress(parsedUrl.hostname)) {
        warnings.push('IP address detected instead of domain name')
      }

      // Normalize the domain
      const domain = this.normalizeDomain(parsedUrl.hostname)
      
      // Normalize the full URL
      const normalizedUrl = this.normalizeUrl(parsedUrl)

      // Additional validation checks
      if (!this.isValidDomain(domain)) {
        return {
          isValid: false,
          domain: null,
          normalizedUrl: null,
          error: 'Invalid domain format',
          warnings
        }
      }

      return {
        isValid: true,
        domain,
        normalizedUrl,
        error: null,
        warnings
      }

    } catch (error) {
      logger.error('URL validation error', { url, error: error instanceof Error ? error.message : error })
      
      return {
        isValid: false,
        domain: null,
        normalizedUrl: null,
        error: error instanceof Error ? error.message : 'Invalid URL format',
        warnings
      }
    }
  }

  /**
   * Extract domain from URL string
   */
  extractDomain(url: string): string | null {
    const validation = this.validateUrl(url)
    return validation.domain
  }

  /**
   * Check if a domain is already being scraped or exists in the system
   */
  async checkDomainStatus(domain: string): Promise<DomainCheckResult> {
    try {
      const normalizedDomain = this.normalizeDomain(domain)

      // Check if domain exists in customer_configs
      const supabase = await this.getSupabase()
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
   * Validate multiple URLs in batch
   */
  validateUrls(urls: string[]): DomainValidationResult[] {
    return urls.map(url => this.validateUrl(url))
  }

  /**
   * Get all unique domains from a list of URLs
   */
  extractUniqueDomains(urls: string[]): string[] {
    const domains = new Set<string>()
    
    urls.forEach(url => {
      const domain = this.extractDomain(url)
      if (domain) {
        domains.add(domain)
      }
    })

    return Array.from(domains)
  }

  // Private helper methods

  private normalizeDomain(hostname: string): string {
    // Remove www. prefix
    const normalized = hostname.toLowerCase().replace(/^www\./, '')
    return normalized
  }

  private normalizeUrl(url: URL): string {
    // Remove www. from hostname
    const normalizedHostname = this.normalizeDomain(url.hostname)
    
    // Reconstruct URL with normalized hostname
    url.hostname = normalizedHostname
    
    // Remove default ports
    if ((url.protocol === 'https:' && url.port === '443') || 
        (url.protocol === 'http:' && url.port === '80')) {
      url.port = ''
    }

    // Remove trailing slash for root URLs
    if (url.pathname === '/' && !url.search && !url.hash) {
      return `${url.protocol}//${url.host}`
    }

    return url.toString()
  }

  private isLocalhost(hostname: string): boolean {
    const localhostPatterns = [
      'localhost',
      '127.0.0.1',
      '::1',
      '0.0.0.0',
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /\.local$/,
      /\.test$/,
      /\.dev$/
    ]

    return localhostPatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return hostname.toLowerCase() === pattern
      }
      return pattern.test(hostname.toLowerCase())
    })
  }

  private isIpAddress(hostname: string): boolean {
    // IPv4 pattern
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/

    return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname)
  }

  private isValidDomain(domain: string): boolean {
    // Basic domain validation
    const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
    
    if (!domainPattern.test(domain)) {
      return false
    }

    // Check for minimum valid domain (at least one dot)
    if (!domain.includes('.') || domain.length < 3) {
      return false
    }

    // Check for valid TLD (at least 2 characters)
    const parts = domain.split('.')
    const tld = parts[parts.length - 1]
    if (!tld || tld.length < 2) {
      return false
    }

    return true
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
  async checkDomainAccessibility(domain: string, timeout: number = 5000): Promise<{
    accessible: boolean
    statusCode?: number
    error?: string
    responseTime: number
  }> {
    const startTime = Date.now()
    
    try {
      const normalizedDomain = this.normalizeDomain(domain)
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
export const domainValidator = DomainValidator.getInstance()

// Export utility functions
export const validateUrl = (url: string) => domainValidator.validateUrl(url)
export const extractDomain = (url: string) => domainValidator.extractDomain(url)
export const checkDomainStatus = (domain: string) => domainValidator.checkDomainStatus(domain)
export const validateUrls = (urls: string[]) => domainValidator.validateUrls(urls)
export const extractUniqueDomains = (urls: string[]) => domainValidator.extractUniqueDomains(urls)
export const getDomainSuggestions = (partialDomain: string, limit?: number) => 
  domainValidator.getDomainSuggestions(partialDomain, limit)
export const checkDomainAccessibility = (domain: string, timeout?: number) => 
  domainValidator.checkDomainAccessibility(domain, timeout)