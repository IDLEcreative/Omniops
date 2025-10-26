/**
 * Integration Test Helpers
 * Main entry point for all integration test utilities
 *
 * Exports all helper classes for creating test data, mocks, and validation functions
 * for enhanced scraper system integration tests.
 */

// Test data generation and utilities
export { TestDataFactory, TestUtilities } from './integration-test-helpers-data';

// Mock factories (direct exports)
export { MockFactory } from './integration-test-helpers-mocks';

// Performance helpers (direct exports)
export { PerformanceHelpers } from './integration-test-helpers-performance';

// Validation utilities
export { ValidationHelpers } from './integration-test-helpers-assertions';

// HTML generators (for advanced use cases)
export { HTMLGenerators } from './integration-test-helpers-html-generators';

// Combined export for backward compatibility
import { TestDataFactory, TestUtilities } from './integration-test-helpers-data';
import { MockFactory } from './integration-test-helpers-mocks';
import { PerformanceHelpers } from './integration-test-helpers-performance';
import { ValidationHelpers } from './integration-test-helpers-assertions';

export const IntegrationTestHelpers = {
  TestDataFactory,
  MockFactory,
  ValidationHelpers,
  PerformanceHelpers,
  TestUtilities
};
