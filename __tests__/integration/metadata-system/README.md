# Metadata System E2E Tests

**Status:** Active
**Last Updated:** 2025-11-10
**Related:** `__tests__/integration/test-metadata-system-e2e.ts`, `__tests__/utils/metadata/metadata-system-helpers.ts`

## Purpose

This directory contains focused, modular E2E tests for the conversation metadata system. Originally a single 551 LOC file, the tests have been split into 7 independent modules following the 300 LOC limit principle.

Each test module is self-contained and can be executed independently or as part of the full orchestration.

## Test Modules

### 1. database-schema.test.ts (27 LOC)
Validates that the `conversations.metadata` column exists and is accessible.
- Tests Supabase connectivity
- Verifies JSONB column type

**Run independently:**
```bash
npx tsx __tests__/integration/metadata-system/database-schema.test.ts
```

### 2. metadata-manager.test.ts (97 LOC)
Tests core `ConversationMetadataManager` functionality:
- Turn counter incrementation
- Entity tracking and alias resolution
- Pronoun resolution ("it", "that", etc.)
- Correction tracking
- List management (numbered lists)
- Serialization/deserialization

**Run independently:**
```bash
npx tsx __tests__/integration/metadata-system/metadata-manager.test.ts
```

### 3. response-parser.test.ts (82 LOC)
Tests `ResponseParser` entity extraction:
- Correction pattern detection ("I meant X not Y")
- Product reference extraction from markdown links
- Order number detection
- Numbered list detection

**Run independently:**
```bash
npx tsx __tests__/integration/metadata-system/response-parser.test.ts
```

### 4. feature-flag.test.ts (51 LOC)
Tests `USE_ENHANCED_METADATA_CONTEXT` feature flag:
- Flag defaults to false (conservative deployment)
- Metadata tracking works regardless of flag state
- Context generation functions independently of flag

**Run independently:**
```bash
npx tsx __tests__/integration/metadata-system/feature-flag.test.ts
```

### 5. parse-and-track.test.ts (52 LOC)
Tests `parseAndTrackEntities` integration:
- Combined parser + metadata manager workflow
- Entity and correction extraction from AI responses
- Context summary generation

**Run independently:**
```bash
npx tsx __tests__/integration/metadata-system/parse-and-track.test.ts
```

### 6. database-persistence.test.ts (95 LOC)
Tests persistence layer:
- Save metadata to conversations table
- Retrieve metadata from database
- Verify JSONB structure
- Deserialization from database round-trip
- Test cleanup with proper database isolation

**Run independently:**
```bash
npx tsx __tests__/integration/metadata-system/database-persistence.test.ts
```

### 7. multi-turn-flow.test.ts (112 LOC)
Tests complete conversation simulation:
- **Turn 1:** Initial product + order tracking
- **Turn 2:** Load previous metadata, add new entities
- **Turn 3:** Verify context accumulation across turns
- Tests metadata persistence between API calls

**Run independently:**
```bash
npx tsx __tests__/integration/metadata-system/multi-turn-flow.test.ts
```

## Shared Utilities

All tests use helpers from `__tests__/utils/metadata/metadata-system-helpers.ts`:

- `TestResult` interface for uniform reporting
- `logSection()` and `logTest()` for formatted console output
- `createTestConversation()` for safe test conversation creation
- `cleanupTestConversation()` for test isolation
- `saveMetadataToConversation()` for database operations
- `loadMetadataFromConversation()` for retrieval
- `verifyMetadataStructure()` for validation

## Orchestration

Run all tests via the orchestrator:

```bash
npx tsx __tests__/integration/test-metadata-system-e2e.ts
```

The orchestrator:
- Runs tests sequentially (order matters: schema → manager → parser → etc.)
- Collects results from all modules
- Generates unified summary report
- Returns exit code 0 (all pass) or 1 (any fail)

## Architecture

```
test-metadata-system-e2e.ts (74 LOC - orchestrator)
├── database-schema.test.ts (27 LOC)
├── metadata-manager.test.ts (97 LOC)
├── response-parser.test.ts (82 LOC)
├── feature-flag.test.ts (51 LOC)
├── parse-and-track.test.ts (52 LOC)
├── database-persistence.test.ts (95 LOC)
└── multi-turn-flow.test.ts (112 LOC)

Shared:
└── __tests__/utils/metadata/metadata-system-helpers.ts (170 LOC)

Total: 516 LOC (originally 551 LOC)
Each module: <300 LOC ✅
```

## Test Execution Path

1. **Database Schema** - Verifies infrastructure
2. **Metadata Manager** - Tests core logic (no database)
3. **Response Parser** - Tests entity extraction (no database)
4. **Feature Flag** - Tests environment configuration
5. **Parse & Track** - Tests integration of parser + manager
6. **Database Persistence** - Tests save/load cycle
7. **Multi-Turn Flow** - Tests full conversation with persistence

Each test creates its own database fixtures and cleans up after completion.

## Debugging

To debug a specific test, run it independently with output:

```bash
# See full error stack
npx tsx __tests__/integration/metadata-system/database-persistence.test.ts

# Run with Node debugger
node --inspect-brk -r esbuild-register __tests__/integration/metadata-system/multi-turn-flow.test.ts
```

## Refactoring Notes

**Original structure (551 LOC):**
- 7 test functions with duplicated setup code
- Helper functions mixed with test logic
- High cognitive load for individual test understanding

**New structure:**
- Each test module focuses on single feature area
- Shared utilities centralized in metadata-system-helpers.ts
- Clear module dependencies via imports
- 35 LOC reduction through extraction

**Benefits:**
- Modules can evolve independently
- Each test <300 LOC for easy review
- Reusable helpers for future metadata tests
- Faster test execution with parallel potential
- Clear test isolation and cleanup

## Adding New Tests

To add a new metadata system test:

1. Create `new-feature.test.ts` in this directory
2. Export a function `testNewFeature(): Promise<TestResult>`
3. Use helpers from `metadata-system-helpers.ts`
4. Keep module <300 LOC
5. Add to orchestrator imports in `test-metadata-system-e2e.ts`
6. Update this README

Example template:

```typescript
import { TestResult, logTest } from '../../utils/metadata/metadata-system-helpers';

export async function testNewFeature(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Test implementation
    return {
      name: 'New Feature Test',
      passed: true,
      details: 'Feature works as expected',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'New Feature Test',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}
```

## Dependencies

- `@/lib/chat/conversation-metadata` - Core metadata manager
- `@/lib/chat/response-parser` - Entity extraction
- `@/lib/supabase-server` - Database access
- Test utilities in `__tests__/utils/metadata/`

## Test Results Format

Each test returns a `TestResult` object:
```typescript
{
  name: string;           // Human-readable test name
  passed: boolean;        // Success/failure
  details: string;        // Description or error message
  duration: number;       // Execution time in milliseconds
}
```

Output format:
```
✅ Test Name
   Description or details
   ⏱️  123ms
```
