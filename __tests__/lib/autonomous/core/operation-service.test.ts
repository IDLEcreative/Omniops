/**
 * Main OperationService Test Suite
 * Tests operation lifecycle management with organization_id
 *
 * This file serves as the main entry point for operation service tests.
 * Individual test suites are split into:
 * - operation-service-create.test.ts (creation with consent)
 * - operation-service-queries.test.ts (get, list, getStats)
 * - operation-service-updates.test.ts (grantConsent, cancel)
 */

// Re-export test suites for compatibility
export * from './operation-service-create.test';
export * from './operation-service-queries.test';
export * from './operation-service-updates.test';
