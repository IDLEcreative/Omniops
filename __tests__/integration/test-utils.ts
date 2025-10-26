/**
 * Integration Test Utilities - Main Export
 *
 * Central re-export hub for all integration test utilities.
 * Maintains backward compatibility with existing tests while keeping modules organized.
 *
 * @module test-utils
 */

// HTML generators for test fixtures
export { TestDataGenerator } from './html-generators';

// Mock factories for external services
export { MockUtilities } from './mock-factories';

// Performance and memory monitoring
export { PerformanceMonitor, MemoryTracker } from './monitoring-utils';

// Validation and helper utilities
export { TestHelpers } from './validation-utils';
