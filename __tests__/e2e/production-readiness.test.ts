/**
 * E2E Production Readiness Test Suite
 *
 * Verifies complete production readiness:
 * - Complete user journeys
 * - Cross-page persistence
 * - Multi-tab synchronization
 * - Error recovery flows
 * - Performance benchmarks
 * - Analytics accuracy
 *
 * Run: npm test -- production-readiness
 *
 * This file serves as the main entry point for production readiness tests.
 * Individual test suites are split into:
 * - production-readiness-journeys.test.ts (user journeys, persistence, multi-tab)
 * - production-readiness-performance.test.ts (performance, error recovery, analytics)
 */

// Re-export test suites for compatibility
export * from './production-readiness-journeys.test';
export * from './production-readiness-performance.test';
