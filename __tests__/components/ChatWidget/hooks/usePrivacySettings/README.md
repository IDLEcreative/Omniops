**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Refactored Test Suite (Modular)

# usePrivacySettings Hook Tests

**Type:** Refactored Test Suite (Modular)
**Status:** Active
**Last Updated:** 2025-11-10
**Test Count:** 42 tests across 9 modules
**Build Status:** ✅ Passing

## Overview

This is a refactored test suite for the `usePrivacySettings` React hook. The original 581 LOC monolithic test file has been split into focused, single-responsibility test modules, each under 300 LOC.

## Module Structure

| Module | LOC | Tests | Purpose |
|--------|-----|-------|---------|
| `default-settings.test.ts` | 66 | 3 | Initial state and prop defaults |
| `url-parsing.test.ts` | 86 | 6 | URL parameter parsing and prop precedence |
| `retention-validation.test.ts` | 79 | 8 | retentionDays boundary and validation |
| `consent-handling.test.ts` | 101 | 5 | Consent state management and postMessage |
| `error-handling.test.ts` | 78 | 4 | Error recovery and logging |
| `edge-cases.test.ts` | 80 | 5 | SSR, special chars, boundary conditions |
| `lifecycle-stability.test.ts` | 98 | 6 | Unmount handling, hook stability |
| `logging.test.ts` | 71 | 3 | Environment-specific logging |
| `demo-mode.test.ts` | 58 | 2 | Demo mode URL parsing suppression |

**Utility Module:**
- `__tests__/utils/privacy/test-setup.ts` | 92 LOC | Shared mocks and helpers

## Total Stats

- **Original LOC:** 581
- **Refactored LOC Distribution:**
  - Test files: 717 LOC (includes better organization and documentation)
  - Shared utilities: 92 LOC
  - **Total:** 809 LOC (includes ~100 LOC of additional documentation)
  - **Largest file:** 101 LOC (well under 300 LOC limit)
  - **Smallest file:** 58 LOC

- **Tests:** 42 total (all passing)
- **Build Status:** ✅ Successful

## Shared Utilities

The `__tests__/utils/privacy/test-setup.ts` module provides:

- `setupWindowMock()` - Mock browser window object
- `setupTestEnvironment()` - Create full test context with spies
- `cleanupTestEnvironment()` - Cleanup after each test
- `setURLSearchParams()` - Helper for URL testing
- `mockURLSearchParamsError()` - Error injection for resilience tests
- `restoreURLSearchParams()` - Restore after error tests

**Benefits:**
- ✅ Eliminates duplicate setup code
- ✅ Reduces test file size by ~100 LOC
- ✅ Centralizes mock configuration
- ✅ Enables consistent error testing across files

## Running Tests

```bash
# Run all usePrivacySettings tests
npm test -- __tests__/components/ChatWidget/hooks/usePrivacySettings

# Run specific test file
npm test -- __tests__/components/ChatWidget/hooks/usePrivacySettings/url-parsing.test.ts

# Run with coverage
npm test -- __tests__/components/ChatWidget/hooks/usePrivacySettings --coverage

# Watch mode
npm test -- __tests__/components/ChatWidget/hooks/usePrivacySettings --watch
```

## Test Coverage

**Default Settings (3 tests)**
- Default initialization
- Prop overrides
- Missing prop handling

**URL Parsing (6 tests)**
- Individual parameter parsing (optOut, privacyNotice, requireConsent, consentGiven, retentionDays)
- Merged defaults with URL params
- Prop precedence over URL params

**Retention Days Validation (8 tests)**
- Valid range (1-365)
- Boundary values
- Negative numbers, zero, >365 values
- NaN and missing params
- Decimal handling

**Consent Handling (5 tests)**
- State updates
- postMessage communication
- Environment variable targeting
- Error handling
- Multiple rapid calls

**Error Handling (4 tests)**
- URL parsing failures
- Malformed params
- Development-only logging
- Production safety

**Edge Cases (5 tests)**
- Empty URL params
- SSR scenarios
- Special characters
- Very large values
- All false parameters

**Lifecycle & Stability (6 tests)**
- Unmount race condition prevention
- State setter functionality
- useCallback stability
- Function reference preservation

**Logging (3 tests)**
- Development console logging
- Production silence
- Error logging by environment

**Demo Mode (2 tests)**
- URL parsing suppression
- Prop-only settings in demo

## Refactoring Benefits

1. **Maintainability:** Each test file focuses on single concern
2. **Scalability:** Easy to add new tests to appropriate module
3. **Readability:** Shorter files = faster comprehension
4. **Parallelization:** Jest runs test files in parallel by default
5. **Code Reuse:** Shared setup utilities eliminate duplication
6. **Performance:** Smaller files = faster TypeScript compilation

## Migration from Monolithic File

The refactoring preserved **100% of test coverage**:
- ✅ All 42 tests passing
- ✅ No test logic modified
- ✅ Same assertions and expectations
- ✅ Same mocking strategy
- ✅ Identical coverage metrics

Original file imports have been replaced with shared utility imports:
```typescript
// Before: 15 lines of setup code per file
// After: Single import
import { setupTestEnvironment, cleanupTestEnvironment } from '__tests__/utils/privacy/test-setup';
```

## Related Documentation

- [Privacy Settings Hook](https://github.com/omniops/customer-service-agent/blob/main/components/ChatWidget/hooks/usePrivacySettings.ts)
- [Testing Best Practices](../../README.md)
- [Test Utilities](../../../utils/README.md)
