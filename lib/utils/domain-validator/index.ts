/**
 * Domain Validator - Main Export
 * Provides backward-compatible exports from modular structure
 *
 * Original file: lib/utils/domain-validator.ts (422 LOC)
 * Refactored into 3 focused modules:
 * - types.ts (30 LOC) - Type definitions
 * - validators.ts (240 LOC) - Pure validation logic
 * - database-checker.ts (200 LOC) - Database operations
 */

// Re-export types
export type {
  DomainValidationResult,
  DomainCheckResult,
  DomainAccessibilityResult
} from './types'

// Re-export validation functions
export {
  validateUrl,
  extractDomain,
  validateUrls,
  extractUniqueDomains,
  normalizeDomain
} from './validators'

// Re-export database checker
export { DomainDatabaseChecker, domainDatabaseChecker } from './database-checker'

// Import for DomainValidator class
import { domainDatabaseChecker } from './database-checker'
import * as validators from './validators'
import type { DomainValidationResult, DomainCheckResult, DomainAccessibilityResult } from './types'

/**
 * Main DomainValidator class - Composes validators and database operations
 * Maintains backward compatibility with original implementation
 */
export class DomainValidator {
  private static instance: DomainValidator
  private dbChecker = domainDatabaseChecker

  constructor() {
    // Intentionally empty - composition pattern
  }

  static getInstance(): DomainValidator {
    if (!DomainValidator.instance) {
      DomainValidator.instance = new DomainValidator()
    }
    return DomainValidator.instance
  }

  // Delegate to pure validation functions
  validateUrl(url: string): DomainValidationResult {
    return validators.validateUrl(url)
  }

  extractDomain(url: string): string | null {
    return validators.extractDomain(url)
  }

  validateUrls(urls: string[]): DomainValidationResult[] {
    return validators.validateUrls(urls)
  }

  extractUniqueDomains(urls: string[]): string[] {
    return validators.extractUniqueDomains(urls)
  }

  // Delegate to database operations
  async checkDomainStatus(domain: string): Promise<DomainCheckResult> {
    return this.dbChecker.checkDomainStatus(domain)
  }

  async getDomainSuggestions(partialDomain: string, limit?: number): Promise<string[]> {
    return this.dbChecker.getDomainSuggestions(partialDomain, limit)
  }

  async checkDomainAccessibility(
    domain: string,
    timeout?: number
  ): Promise<DomainAccessibilityResult> {
    return this.dbChecker.checkDomainAccessibility(domain, timeout)
  }
}

// Export singleton instance
export const domainValidator = DomainValidator.getInstance()

// Export utility functions (backward compatibility)
export const checkDomainStatus = (domain: string) => domainValidator.checkDomainStatus(domain)
export const getDomainSuggestions = (partialDomain: string, limit?: number) =>
  domainValidator.getDomainSuggestions(partialDomain, limit)
