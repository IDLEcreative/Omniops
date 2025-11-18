**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Shared Test Infrastructure

# Privacy Test Utilities

**Type:** Test Infrastructure
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 4 minutes

**Purpose:** Centralized mocks and helpers for privacy-related hook testing

## Overview

This module provides reusable test utilities for privacy feature testing. It was created to support the refactored `usePrivacySettings` test suite and can be extended for other privacy-related tests.

## Exported Utilities

### Setup Functions

**`setupWindowMock()`**
- Creates a mock `window` object with `location` and `parent.postMessage`
- Returns: `{ window, mockPostMessage }`
- Used when: Individual test setup is needed

**`setupTestEnvironment(): TestContext`**
- Complete environment setup including:
  - Window mock
  - Console spies (log, error)
  - Environment variables
  - Full context object
- Returns: `TestContext` for cleanup
- Used when: Full beforeEach setup

**`cleanupTestEnvironment(context: TestContext): void`**
- Restores original environment
- Clears mocks and spies
- Must be called in `afterEach`

### URL Testing Helpers

**`setURLSearchParams(search: string): void`**
- Sets `window.location.search` for URL parameter tests
- Example: `setURLSearchParams('?retentionDays=90')`

### Error Testing Helpers

**`mockURLSearchParamsError(originalClass: any): void`**
- Replaces URLSearchParams with error-throwing mock
- For testing error resilience
- Must pair with `restoreURLSearchParams()`

**`restoreURLSearchParams(originalClass: any): void`**
- Restores original URLSearchParams class
- Cleanup after error injection tests

## TestContext Type

```typescript
interface TestContext {
  originalEnv: string | undefined;           // Saved NODE_ENV
  originalWindow: typeof window;              // Saved window object
  consoleLogSpy: jest.SpiedFunction<...>;    // Spy on console.log
  consoleErrorSpy: jest.SpiedFunction<...>;  // Spy on console.error
  mockPostMessage: jest.Mock;                // Mock parent.postMessage
}
```

## Usage Example

```typescript
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  setURLSearchParams,
} from '__tests__/utils/privacy/test-setup';

describe('MyPrivacyHook', () => {
  let context;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  it('should parse URL params', () => {
    setURLSearchParams('?retentionDays=90');
    const { result } = renderHook(() => useMyHook());
    expect(result.current.retentionDays).toBe(90);
  });

  it('should log in development', () => {
    process.env.NODE_ENV = 'development';
    // ... test code
    expect(context.consoleLogSpy).toHaveBeenCalled();
  });

  it('should post message', () => {
    // ... test code
    expect(context.mockPostMessage).toHaveBeenCalledWith(
      { type: 'privacy', action: 'giveConsent' },
      expect.any(String)
    );
  });
});
```

## Best Practices

1. **Always use `setupTestEnvironment()` in `beforeEach()`**
   - Ensures clean state for each test
   - Prevents test isolation issues

2. **Always call `cleanupTestEnvironment()` in `afterEach()`**
   - Restores original environment
   - Clears all mocks
   - Prevents memory leaks

3. **Use context spies for assertions**
   - `context.consoleLogSpy`
   - `context.consoleErrorSpy`
   - `context.mockPostMessage`

4. **Set URL params before rendering hooks**
   ```typescript
   setURLSearchParams('?param=value');
   const { result } = renderHook(() => useHook());
   ```

5. **For error tests, save original class**
   ```typescript
   const original = global.URLSearchParams;
   mockURLSearchParamsError(original);
   // ... test code
   restoreURLSearchParams(original);
   ```

## Integration with usePrivacySettings Tests

This utility module powers all 9 test files in:
```
__tests__/components/ChatWidget/hooks/usePrivacySettings/
  ├── default-settings.test.ts
  ├── url-parsing.test.ts
  ├── retention-validation.test.ts
  ├── consent-handling.test.ts
  ├── error-handling.test.ts
  ├── edge-cases.test.ts
  ├── lifecycle-stability.test.ts
  ├── logging.test.ts
  └── demo-mode.test.ts
```

**Benefits of centralization:**
- ✅ ~100 LOC eliminated from test files
- ✅ Consistent setup across all privacy tests
- ✅ Easy to extend for new privacy features
- ✅ Single source of truth for mocks

## Adding New Privacy Tests

To create a new privacy-related test file:

1. Create file in `__tests__/components/ChatWidget/hooks/` or `__tests__/lib/privacy/`
2. Import utilities:
   ```typescript
   import {
     setupTestEnvironment,
     cleanupTestEnvironment,
   } from '__tests__/utils/privacy/test-setup';
   ```
3. Use in beforeEach/afterEach
4. Reference this README in your test file comments

## Running Tests Using This Utility

```bash
# Run all privacy tests
npm test -- __tests__/utils/privacy

# Run specific test suite using this utility
npm test -- __tests__/components/ChatWidget/hooks/usePrivacySettings

# Run with coverage
npm test -- __tests__ --coverage
```

## Future Expansion

This module can be extended with:
- Privacy-specific assertion helpers
- Common privacy test data generators
- Integration with GDPR/CCPA compliance tests
- Encryption/decryption test utilities

## Related Files

- **Using this utility:** `__tests__/components/ChatWidget/hooks/usePrivacySettings/`
- **Hook being tested:** `components/ChatWidget/hooks/usePrivacySettings.ts`
- **Test setup documentation:** See individual test file READMEs
