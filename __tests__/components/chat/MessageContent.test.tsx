/**
 * MessageContent Component - Test Orchestrator
 *
 * This file imports and organizes all MessageContent component tests.
 * Individual test suites are in the tests/ subdirectory for better organization.
 *
 * Test Categories:
 * - Rendering: Plain text, whitespace, formatting, edge cases
 * - Links: URL detection, markdown links, styling
 * - Security: XSS prevention, sanitization
 * - Performance: React.memo optimization, large content handling
 */

// Import all test suites
import './tests/message-content-rendering.test';
import './tests/message-content-links.test';
import './tests/message-content-security.test';
import './tests/message-content-performance.test';
