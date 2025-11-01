/**
 * Domain Validators
 * Pure validation functions without database dependencies
 */

import { logger } from '@/lib/logger'
import type { DomainValidationResult } from './types'

/**
 * Validate and normalize a URL
 */
export function validateUrl(url: string): DomainValidationResult {
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
    if (isLocalhost(parsedUrl.hostname)) {
      warnings.push('Localhost or internal domain detected - scraping may not work')
    }

    // Check for IP addresses
    if (isIpAddress(parsedUrl.hostname)) {
      warnings.push('IP address detected instead of domain name')
    }

    // Normalize the domain
    const domain = normalizeDomain(parsedUrl.hostname)

    // Normalize the full URL
    const normalizedUrl = normalizeUrl(parsedUrl)

    // Additional validation checks
    if (!isValidDomain(domain)) {
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
export function extractDomain(url: string): string | null {
  const validation = validateUrl(url)
  return validation.domain
}

/**
 * Validate multiple URLs in batch
 */
export function validateUrls(urls: string[]): DomainValidationResult[] {
  return urls.map(url => validateUrl(url))
}

/**
 * Get all unique domains from a list of URLs
 */
export function extractUniqueDomains(urls: string[]): string[] {
  const domains = new Set<string>()

  urls.forEach(url => {
    const domain = extractDomain(url)
    if (domain) {
      domains.add(domain)
    }
  })

  return Array.from(domains)
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Normalize domain by removing www. prefix and lowercasing
 */
export function normalizeDomain(hostname: string): string {
  // Remove www. prefix
  const normalized = hostname.toLowerCase().replace(/^www\./, '')
  return normalized
}

/**
 * Normalize URL by removing www., default ports, and trailing slashes
 */
function normalizeUrl(url: URL): string {
  // Remove www. from hostname
  const normalizedHostname = normalizeDomain(url.hostname)

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

/**
 * Check if hostname is localhost or internal domain
 */
function isLocalhost(hostname: string): boolean {
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

/**
 * Check if hostname is an IP address
 */
function isIpAddress(hostname: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

  // IPv6 pattern (simplified)
  const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/

  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname)
}

/**
 * Validate domain format using regex
 */
function isValidDomain(domain: string): boolean {
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
