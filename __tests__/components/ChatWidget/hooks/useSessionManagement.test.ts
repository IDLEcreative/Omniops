/**
 * @jest-environment jsdom
 */
/**
 * useSessionManagement Hook - Test Suite Index
 *
 * Tests have been split into focused modules for maintainability:
 * - useSessionManagement-basic.test.ts: Session ID and Conversation ID management, Loading states
 * - useSessionManagement-errors.test.ts: Error handling and edge cases
 * - useSessionManagement-advanced.test.ts: Unmount safety, useCallback stability, integration scenarios
 * - fixtures/session-management-mocks.ts: Shared test utilities and mocks
 *
 * Run all tests: npm test useSessionManagement
 * Run specific module: npm test useSessionManagement-basic
 */

export * from './useSessionManagement-basic.test';
export * from './useSessionManagement-errors.test';
export * from './useSessionManagement-advanced.test';
