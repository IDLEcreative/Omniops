/**
 * Domain Validator Types
 * Type definitions for domain validation and checking
 */

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

export interface DomainAccessibilityResult {
  accessible: boolean
  statusCode?: number
  error?: string
  responseTime: number
}
