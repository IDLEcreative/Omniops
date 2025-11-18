# Chat Route Metadata Integration Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 2 minutes

**Related:** [Metadata Manager](../../../../lib/chat/conversation-metadata.ts), [Response Parser](../../../../lib/chat/response-parser.ts), [System Prompts](../../../../lib/chat/system-prompts.ts)

## Purpose

Tests the integration of conversation metadata in the chat API route. Validates metadata loading, tracking, persistence, and context enhancement flow across complete conversation cycles.

## Module Structure

Each test file focuses on a specific aspect of metadata integration:

- **metadata-loading.test.ts** (95 LOC) - Database loading and initialization
- **turn-counter.test.ts** (50 LOC) - Conversation turn tracking
- **entity-parsing.test.ts** (50 LOC) - Entity extraction and tracking
- **context-enhancement.test.ts** (65 LOC) - Context generation for AI prompts
- **persistence.test.ts** (55 LOC) - Saving and loading from database
- **complete-flow.test.ts** (80 LOC) - Full request-response cycle simulation
- **error-handling.test.ts** (95 LOC) - Error scenarios and edge cases

## Running Tests

```bash
# Run all metadata integration tests
npm test -- __tests__/api/chat/metadata-integration

# Run specific test module
npm test -- __tests__/api/chat/metadata-integration/metadata-loading.test.ts

# Run with coverage
npm test -- __tests__/api/chat/metadata-integration --coverage

# Watch mode
npm test -- __tests__/api/chat/metadata-integration --watch
```

## Key Testing Patterns

### 1. Metadata Loading
Tests ensure conversations can load existing metadata or create fresh instances:
- Loading from database with existing metadata
- Creating new managers for new conversations
- Handling missing or corrupted metadata gracefully

### 2. Turn Tracking
Tests verify turn counters increment and persist correctly:
- Single turn increments
- State persistence through save/load cycles
- Correct turn count on reload

### 3. Entity Parsing
Tests validate entity extraction from responses:
- Parsing links and numbered lists
- Tracking product references
- Detecting user corrections

### 4. Context Enhancement
Tests confirm context is properly generated for AI prompts:
- Context summaries include relevant information
- Enhanced prompts contain tracked entities
- Empty metadata returns base prompt unchanged

### 5. Database Persistence
Tests ensure metadata survives save/load operations:
- Serialization to JSON
- Database updates
- Error handling on failures

### 6. Complete Flow Simulation
Tests validate full chat cycles:
- Load → Increment → Parse → Save sequence
- Multi-turn conversations with state accumulation
- List tracking across turns

### 7. Error Handling
Tests verify graceful degradation:
- Database connection failures
- Corrupted or missing metadata
- Very large metadata payloads
- Serialization errors

## Test Data

Shared test utilities available in `__tests__/utils/metadata/`:
- `createChainableMockSupabaseClient()` - Mock database client
- `createPageView()`, `createSessionMetadata()` - Session data builders

## Coverage Summary

**Total Tests:** 24
**Total LOC:** ~490 (split across 7 modules)
**Coverage Areas:** Loading, Tracking, Parsing, Context, Persistence, Flow, Errors
