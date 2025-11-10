/**
 * Session Persistence Integration Tests - Orchestrator
 *
 * Purpose: Centralized entry point that imports all focused session persistence tests
 * This file serves as the orchestrator - it does not contain tests directly
 * All test logic is delegated to focused modules in __tests__/integration/session/
 *
 * Test Structure:
 * - Conversation Persistence: 4 tests
 * - Message Loading: 4 tests
 * - Session Validation: 3 tests
 * - Error Handling: 5 tests
 * - Graceful Degradation: 4 tests
 * - Session Lifecycle: 3 tests
 *
 * Total: 23 tests
 *
 * Related Files:
 * - __tests__/integration/session/conversation-persistence.test.ts
 * - __tests__/integration/session/message-loading.test.ts
 * - __tests__/integration/session/session-validation.test.ts
 * - __tests__/integration/session/error-handling.test.ts
 * - __tests__/integration/session/graceful-degradation.test.ts
 * - __tests__/integration/session/session-lifecycle.test.ts
 *
 * Test Utilities:
 * - __tests__/utils/session/mock-storage.ts
 * - __tests__/utils/session/test-fixtures.ts
 * - __tests__/utils/session/fetch-helpers.ts
 */

// Import all focused test modules
import './session/conversation-persistence.test';
import './session/message-loading.test';
import './session/session-validation.test';
import './session/error-handling.test';
import './session/graceful-degradation.test';
import './session/session-lifecycle.test';

// Re-export utilities for convenience
export * from '../utils/session/mock-storage';
export * from '../utils/session/test-fixtures';
export * from '../utils/session/fetch-helpers';
