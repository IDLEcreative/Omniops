/**
 * Credential Vault Tests - Orchestrator
 *
 * This file orchestrates all credential vault tests.
 * Individual test suites are in the tests/ subdirectory.
 */

// Import all test suites
import './tests/storage.test';
import './tests/retrieval.test';
import './tests/list-delete.test';
import './tests/encryption-rotation.test';
import './tests/concurrent-access.test';

// Re-export for test discovery
export {};
