/**
 * Domain Validator Utility
 *
 * NOTE: This file has been refactored into modular structure.
 * See lib/utils/domain-validator/ directory for implementation details.
 *
 * Original file backed up as: lib/utils/domain-validator.ts.old
 */

// Re-export all functionality from modular structure for backward compatibility
export {
  // Types
  type DomainValidationResult,
  type DomainCheckResult,
  type DomainAccessibilityResult,

  // Main class
  DomainValidator,
  domainValidator,

  // Validation functions
  validateUrl,
  extractDomain,
  validateUrls,
  extractUniqueDomains,
  normalizeDomain,

  // Database operations
  DomainDatabaseChecker,
  domainDatabaseChecker,
  checkDomainStatus,
  getDomainSuggestions,
} from './domain-validator/'
