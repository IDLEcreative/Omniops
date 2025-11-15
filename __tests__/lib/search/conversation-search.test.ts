/**
 * Main Conversation Search Test Suite
 * Imports and re-exports all search test suites
 *
 * This file serves as the main entry point for conversation search tests.
 * Individual test suites are split into:
 * - conversation-search-hybrid.test.ts (hybrid search)
 * - conversation-search-fulltext.test.ts (full-text search)
 * - conversation-search-semantic.test.ts (semantic search)
 * - conversation-search-merging.test.ts (result merging and pagination)
 */

// Re-export test suites for compatibility
export * from './conversation-search-hybrid.test';
export * from './conversation-search-fulltext.test';
export * from './conversation-search-semantic.test';
export * from './conversation-search-merging.test';
