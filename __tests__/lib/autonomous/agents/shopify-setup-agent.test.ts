/**
 * Shopify Setup Agent Tests - Orchestrator
 *
 * This file orchestrates all Shopify setup agent tests.
 * Individual test suites are in the tests/ subdirectory.
 */

// Import all test suites
import './tests/initialization.test';
import './tests/workflow.test';
import './tests/extraction.test';

// Re-export for test discovery
export {};
