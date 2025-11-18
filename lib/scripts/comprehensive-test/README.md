# Comprehensive Test Suite

**Type:** Utility
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Supabase Client](/home/user/Omniops/lib/supabase-server.ts), [CLI Wrapper](/home/user/Omniops/scripts/comprehensive-test.js)
**Estimated Read Time:** 3 minutes

## Purpose

Business logic for comprehensive integration testing of the chat system with Supabase, following CLI Separation Pattern.

## Quick Links
- [Core Tests](core.ts) - Test implementations
- [Validators](validators.ts) - Test orchestration
- [Reporters](reporters.ts) - Output formatting

## Keywords
- Integration Tests, Chat System, UUID Validation, Concurrency, Embeddings, Error Recovery

---

## Architecture

This module extracts testable business logic from the CLI script, following the CLI Separation Pattern:

```
lib/scripts/comprehensive-test/
├── core.ts          - Test implementations (182 LOC)
├── validators.ts    - Test orchestration (91 LOC)
├── reporters.ts     - Output formatting (85 LOC)
└── README.md        - This file
```

## Modules

### core.ts
**Purpose:** Core test implementations for all system validations

**Exports:**
- `makeRequest()` - HTTP request helper
- `testUUIDSessions()` - Validate UUID session handling
- `testConversationPersistence()` - Verify conversation continuity
- `testConcurrency()` - Test concurrent request handling
- `testEmbeddings()` - Validate embeddings search
- `testErrorRecovery()` - Test error handling
- `testDatabaseState()` - Verify database state
- `testRateLimiting()` - Test rate limiting

**Usage:**
```typescript
import { testUUIDSessions } from './core.js';

const result = await testUUIDSessions(apiUrl, supabaseClient);
if (result.passed) {
  console.log(result.message);
}
```

### validators.ts
**Purpose:** Test orchestration and execution framework

**Exports:**
- `runTest()` - Execute single test with logging
- `getTestDefinitions()` - Get all test definitions
- `runAllTests()` - Run complete test suite

**Usage:**
```typescript
import { runAllTests } from './validators.js';

const config = {
  apiUrl: 'http://localhost:3000/api/chat',
  supabase: supabaseClient
};

const results = await runAllTests(config);
console.log(`${results.passed}/${results.total} tests passed`);
```

### reporters.ts
**Purpose:** Terminal output formatting and result reporting

**Exports:**
- `log()` - Colored logging (success, error, warning, info, test)
- `section()` - Section headers
- `printHeader()` - Test suite header
- `printSummary()` - Final results summary

**Usage:**
```typescript
import { log, section, printSummary } from './reporters.js';

section('TEST 1: UUID Validation');
log('Running test...', 'test');
log('Test passed!', 'success');

printSummary({ passed: 7, failed: 0, total: 7 });
```

## Test Coverage

The suite includes 7 comprehensive tests:

1. **UUID Session Validation** - Valid/invalid UUID handling
2. **Conversation Persistence** - Multi-message conversations
3. **Concurrent Request Handling** - 5 simultaneous requests
4. **Embeddings Search** - Domain-based content search
5. **Error Handling** - Missing fields, oversized messages
6. **Database State** - Conversation and message counts
7. **Rate Limiting** - Burst request protection

## Integration

### CLI Usage
See `scripts/comprehensive-test.js` for CLI wrapper (70 LOC).

### Direct Usage
```typescript
import { createClient } from '@supabase/supabase-js';
import { runAllTests } from './validators.js';
import { printHeader, printSummary } from './reporters.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const config = {
  apiUrl: 'http://localhost:3000/api/chat',
  supabase
};

printHeader();
const results = await runAllTests(config);
printSummary(results);
```

## Testing This Module

While this module contains test implementations, you can validate the test logic itself:

```typescript
// Unit test example
import { testUUIDSessions } from './core.js';

describe('testUUIDSessions', () => {
  it('validates UUID format', async () => {
    const mockApi = 'http://localhost:3000/api/chat';
    const mockSupabase = createMockSupabaseClient();

    const result = await testUUIDSessions(mockApi, mockSupabase);
    expect(result.passed).toBe(true);
  });
});
```

## Future Enhancements

- Add test filtering by category
- Export results to JSON/HTML
- Add performance benchmarking
- Add CI/CD integration helpers
- Add test retry logic for flaky tests
