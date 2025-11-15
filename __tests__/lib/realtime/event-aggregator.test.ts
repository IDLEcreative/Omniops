/**
 * Event Aggregator Tests - Orchestrator
 *
 * This file orchestrates all event aggregator tests.
 * Individual test suites are in the tests/ subdirectory.
 */

// Import all test suites
import './tests/session-metrics.test';
import './tests/response-times.test';
import './tests/engagement-activity.test';

// Re-export for test discovery
export {};
