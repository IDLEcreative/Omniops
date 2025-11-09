# useChatState Hook Tests

**Purpose:** Modular test suite for the `useChatState` hook, split from a monolithic 672 LOC file into focused modules.

**Last Updated:** 2025-11-08
**Status:** Active
**Related:** [useChatState hook](../../../../components/ChatWidget/hooks/useChatState.ts)

## Structure

This directory contains focused test modules for different aspects of the `useChatState` hook:

| File | LOC | Tests | Coverage |
|------|-----|-------|----------|
| `initialization.test.ts` | 74 | 4 | Default state, session ID generation/restoration |
| `conversation-persistence.test.ts` | 97 | 3 | Conversation ID localStorage sync |
| `loading-messages.test.ts` | 209 | 6 | Message fetching, loading states, deduplication |
| `error-recovery.test.ts` | 128 | 4 | API errors, network failures, cleanup |
| `widget-state.test.ts` | 91 | 3 | Open/close state, parent notifications |
| `message-state.test.ts` | 62 | 2 | Message array updates and clearing |
| `privacy-settings.test.ts` | 79 | 3 | Privacy configuration and consent |

**Total:** 740 LOC, 25 tests

## Shared Fixtures

Test setup and mocks are extracted to:
- `__tests__/utils/chat-widget/test-fixtures.ts` (135 LOC)

Includes:
- `MockStorage` - localStorage implementation for tests
- `setupGlobalMocks()` - Initialize all global mocks
- `cleanupMocks()` - Clean up after tests
- Mock response factories for API calls
- Reusable test data

## Running Tests

```bash
# Run all useChatState tests
npm test -- useChatState

# Run specific module
npm test -- useChatState/initialization.test

# Watch mode
npm test -- useChatState --watch
```

## Refactoring Notes

**Original File:** `useChatState.test.ts` - 672 LOC
**Refactored:** 31 LOC (re-exports only)
**Reduction:** 95.4%

**Rationale:** Enforce 300 LOC limit while maintaining test coverage and improving maintainability.

## Adding New Tests

When adding tests to this hook:

1. Determine which category the test belongs to
2. Add to the appropriate test module
3. Reuse fixtures from `test-fixtures.ts`
4. Keep each file under 300 LOC
5. If a module exceeds 300 LOC, consider splitting further

## Troubleshooting

**Issue:** Tests are flaky or timing-dependent
**Solution:** These timing issues are pre-existing and not caused by the refactoring. The tests use `waitFor()` extensively due to async state updates.

**Issue:** Mock not working in new test file
**Solution:** Ensure you call `setupGlobalMocks()` in `beforeEach()` and `cleanupMocks()` in `afterEach()`
