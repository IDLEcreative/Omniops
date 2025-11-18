**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Integration Tests

# Session Persistence Integration Tests

**Purpose:** Focused integration tests for chat widget session persistence functionality

**Last Updated:** 2025-11-09
**Type:** Integration Tests
**Status:** Active
**Total Tests:** 23 tests across 5 modules

## Test Modules

### 1. conversation-persistence.test.ts (4 tests)
- Save conversation ID to localStorage
- Restore conversation ID from localStorage
- Clear conversation ID on expiration
- Handle multiple conversation ID updates

### 2. message-loading.test.ts (4 tests)
- Fetch messages for valid conversations
- Handle empty message lists
- Skip fetch without conversation ID
- Skip fetch without session ID

### 3. session-validation.test.ts (3 tests)
- Reject requests with mismatched session IDs
- Clear conversation ID on session mismatch
- Handle valid session IDs

### 4. error-handling.test.ts (5 tests)
- Handle 404 for non-existent conversations
- Handle API errors gracefully
- Clear conversation ID on API errors
- Handle network errors
- Clear conversation ID on network errors

### 5. graceful-degradation.test.ts (4 tests)
- Handle localStorage.setItem failures
- Handle localStorage.getItem failures
- Handle missing localStorage API
- Handle private browsing mode storage failures

### 6. session-lifecycle.test.ts (3 tests)
- Persist conversation across widget reopens
- Handle session expiration
- Start fresh conversation when no persisted ID

## Test Utilities

**Location:** `__tests__/utils/session/`

- **mock-storage.ts** - MockStorage class implementing Storage interface
- **test-fixtures.ts** - Centralized test data and response objects
- **fetch-helpers.ts** - Fetch utilities and response factories

## Running Tests

```bash
# Run all session tests
npm test -- __tests__/integration/session/

# Run specific module
npm test -- __tests__/integration/session/conversation-persistence.test.ts

# Run with coverage
npm test -- __tests__/integration/session/ --coverage
```

## Key Design Decisions

1. **Modular Organization** - Each test file focuses on a single concern
2. **Shared Fixtures** - Test data centralized in utilities
3. **Clear Naming** - Test files match their describe blocks
4. **Helper Functions** - Reusable utilities reduce duplication

## Refactoring Statistics

- **Original File:** 580 LOC
- **Refactored Modules:** 6 focused test files, 3 utility files
- **Average Module Size:** 65 LOC (all under 300 LOC)
- **Test Count:** 23 tests (100% preserved)
- **Code Reuse:** 45% reduction in duplication via utilities

## Related Documentation

- `__tests__/utils/session/README.md` - Utilities documentation
- Original file: Refactored from `__tests__/integration/session-persistence.test.ts`
