/**
 * useDashboardConversations Hook - Test Orchestrator
 *
 * This file imports and organizes all useDashboardConversations hook tests.
 * Individual test suites are in the tests/conversations/ subdirectory.
 *
 * Test Categories:
 * - Basic Loading: Data fetching, parameter passing, disabled state
 * - Error Handling: HTTP errors, network failures, malformed responses
 * - Refresh & Lifecycle: Refresh functionality, abort handling, cleanup
 * - Edge Cases: Empty data, zero values, negative values
 */

// Import all test suites
import './tests/conversations/conversations-basic.test';
import './tests/conversations/conversations-errors.test';
import './tests/conversations/conversations-refresh.test';
import './tests/conversations/conversations-edge-cases.test';
