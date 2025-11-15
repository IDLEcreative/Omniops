/**
 * useDashboardAnalytics Hook - Test Orchestrator
 *
 * This file imports and organizes all useDashboardAnalytics hook tests.
 * Individual test suites are in the tests/analytics/ subdirectory.
 *
 * Test Categories:
 * - Basic Loading: Data fetching, parameter passing, disabled state
 * - Error Handling: HTTP errors, network failures, malformed responses
 * - Refresh & Lifecycle: Refresh functionality, abort handling, cleanup
 * - Edge Cases: Empty arrays, zero values
 */

// Import all test suites
import './tests/analytics/analytics-basic.test';
import './tests/analytics/analytics-errors.test';
import './tests/analytics/analytics-refresh.test';
import './tests/analytics/analytics-edge-cases.test';
