/**
 * Hybrid Search Tests - Orchestrator
 *
 * This file orchestrates all hybrid search tests.
 * Individual test suites are in the tests/ subdirectory.
 */

// Import all test suites
import './tests/result-merging.test';
import './tests/scoring-filtering.test';
import './tests/error-handling.test';

// Re-export for test discovery
export {};
