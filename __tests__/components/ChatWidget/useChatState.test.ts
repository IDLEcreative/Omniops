/**
 * @jest-environment jsdom
 */
/**
 * Tests for useChatState hook
 *
 * This file re-exports all modularized tests from the useChatState/ directory.
 * Tests have been split into focused modules to comply with 300 LOC limit.
 *
 * Test Modules:
 * - initialization.test.ts - Default values, session/conversation ID restoration
 * - conversation-persistence.test.ts - Conversation ID localStorage persistence
 * - loading-messages.test.ts - Loading previous messages functionality (SKIPPED - see file for details)
 * - error-recovery.test.ts - Error handling and recovery scenarios
 * - widget-state.test.ts - Widget open/close state management
 * - message-state.test.ts - Message array updates and clearing
 * - privacy-settings.test.ts - Privacy settings and consent handling
 *
 * Shared Fixtures:
 * - __tests__/utils/chat-widget/test-fixtures.ts - Mock setup and test data
 *
 * Original file: 672 LOC
 * After refactoring: 26 LOC (re-exports only)
 * Reduction: 96%
 *
 * NOTE: This file causes Jest worker crashes when run directly.
 * Run individual test modules instead: npm test -- __tests__/components/ChatWidget/useChatState/initialization.test.ts
 * Root cause: loading-messages.test.ts has infinite loop issue (see that file for details)
 */

// Import all test modules to execute them
import './useChatState/initialization.test';
import './useChatState/conversation-persistence.test';
import './useChatState/loading-messages.test'; // Contains skipped tests
import './useChatState/error-recovery.test';
import './useChatState/widget-state.test';
import './useChatState/message-state.test';
import './useChatState/privacy-settings.test';
