# Mock Isolation Fix - Complete

**Type:** Troubleshooting
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 10 minutes

## Purpose
Tests in `__tests__/api/chat/route.test.ts` were passing individually but failing when run in batch mode. This was due to mock state bleeding between tests.

## Quick Links
- [Problem Statement](#problem-statement)
- [Root Cause Analysis](#root-cause-analysis)
- [Solution](#solution)
- [Files Modified](#files-modified)
- [Verification](#verification)

## Keywords
analysis, cause, criteria, documentation, files, fix, future, insights, isolation, mock

---


**Date**: 2025-10-24
**Status**: ✅ FIXED
**Time Taken**: ~2.5 hours

## Problem Statement

Tests in `__tests__/api/chat/route.test.ts` were passing individually but failing when run in batch mode. This was due to mock state bleeding between tests.

**Symptoms:**
- ✅ Individual test run: `npm test -- --testNamePattern="should include WooCommerce"` → PASS
- ❌ Batch test run: `npm test -- __tests__/api/chat/route.test.ts` → FAIL

**Affected Tests:**
1. "should include WooCommerce products when provider is configured"
2. "should include Shopify products when provider is configured"
3. "should handle commerce provider errors gracefully"
4. "should handle Supabase errors gracefully"
5. "should handle OpenAI API errors"
6. "should include relevant content from embeddings"
7. "should recover gracefully when tool arguments missing"

## Root Cause Analysis

### Issue 1: OpenAI Client Singleton
The chat route has a module-level singleton for the OpenAI client:

```typescript
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openai) {
    openai = new OpenAI({ apiKey });
  }
  return openai;
}
```

**Problem:** Once created in the first test, this singleton persists across all subsequent tests. When tests created fresh mock instances in `beforeEach()`, the singleton still referenced the OLD mock from the first test.

### Issue 2: Mock Instance Recreation
Tests were creating new mock instances in `beforeEach()`:

```typescript
beforeEach(() => {
  mockOpenAIInstance = createFreshOpenAIMock() // NEW instance each time!
  MockedOpenAI.mockImplementation(() => mockOpenAIInstance)
})
```

**Problem:** The route's cached OpenAI instance didn't get updated to reference the new mock.

### Issue 3: Conflicting Mock Strategies
Some tests used `mockResolvedValueOnce()` while others used `mockImplementation()`, causing queue conflicts.

## Solution

### 1. Created Isolated Test Setup Utility
**File:** `__tests__/setup/isolated-test-setup.ts`

Provides factory functions for creating fresh mocks:
- `createFreshOpenAIMock()` - Returns mock without default behavior
- `configureDefaultOpenAIResponse()` - Configures default response
- `createFreshSupabaseMock()` - Creates Supabase client mock
- `createFreshCommerceProviderMock()` - Creates commerce provider mock
- `resetTestEnvironment()` - Complete environment reset

### 2. Singleton-Aware Mock Strategy
**Key Change:** Create mock instance ONCE in `beforeAll()`, reuse throughout tests.

```typescript
describe('/api/chat', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>

  // CRITICAL: Create mock instance ONCE at suite level
  beforeAll(() => {
    mockOpenAIInstance = createFreshOpenAIMock()
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance)
  })

  beforeEach(() => {
    // Clear call history but keep same instance
    mockOpenAIInstance.chat.completions.create.mockClear()
    configureDefaultOpenAIResponse(mockOpenAIInstance)
    // ... reset other mocks
  })
})
```

**Why This Works:**
- The singleton in the route always references our mock instance
- We just reconfigure behavior in each test, not the instance itself
- No more reference mismatches between tests

### 3. Consistent Mock Strategy
All tests now use `mockImplementation()` instead of mixing with `mockResolvedValueOnce()`:

```typescript
// ❌ BEFORE (caused conflicts):
mockOpenAI.chat.completions.create
  .mockResolvedValueOnce(response1)
  .mockResolvedValueOnce(response2)

// ✅ AFTER (consistent):
let callCount = 0
mockOpenAI.chat.completions.create.mockImplementation(async () => {
  callCount++
  if (callCount === 1) return response1
  else return response2
})
```

### 4. Fixed Route File Corruption
Removed duplicate imports and stray lines in `app/api/chat/route.ts` that were causing syntax errors.

## Files Modified

1. **`__tests__/setup/isolated-test-setup.ts`** (NEW)
   - Centralized test setup utilities
   - Factory functions for fresh mocks
   - Environment reset logic

2. **`__tests__/api/chat/route.test.ts`**
   - Changed to `beforeAll()` for mock instance creation
   - Updated all tests to use `mockImplementation()`
   - Added proper dependency injection

3. **`app/api/chat/route.ts`**
   - Fixed duplicate imports
   - Restored `RouteDependencies` interface

## Verification

**Before Fix:**
```bash
$ npm test -- __tests__/api/chat/route.test.ts
Tests: 6 failed, 6 passed, 12 total ❌
```

**After Fix:**
```bash
$ npm test -- __tests__/api/chat/route.test.ts
Tests: 12 passed, 12 total ✅
```

**Individual Tests Still Pass:**
```bash
$ npm test -- --testNamePattern="should include WooCommerce"
Tests: 1 passed ✅
```

## Key Insights

1. **Singleton Pattern Requires Careful Mocking**: Module-level singletons persist across tests. Mock instances must be created once and reused.

2. **Mock Reference Stability**: Creating new mock instances breaks the reference chain. Always reuse the same mock instance and just reconfigure its behavior.

3. **Consistent Mock Strategy**: Mixing `mockResolvedValueOnce()` and `mockImplementation()` causes queue conflicts. Use one strategy consistently.

4. **Dependency Injection is Critical**: The route's DI pattern (`deps` parameter) was essential for test isolation.

## Future Recommendations

1. **Avoid Module Singletons in Testable Code**: Consider accepting dependencies via DI instead of creating module-level singletons.

2. **Document Test Patterns**: Add JSDoc to test helpers explaining the singleton-aware mocking strategy.

3. **Pre-commit Hook**: Add test run to pre-commit hooks to catch batch test failures early.

4. **File Length Refactoring**: Both test file (612 LOC) and route file (1204 LOC) exceed the 300 LOC limit. See TECH_DEBT.md for refactoring plan.

## Related Documentation

- [TECH_DEBT.md](../10-ANALYSIS/ANALYSIS_TECHNICAL_DEBT_TRACKER.md) - Technical debt tracking
- [CLAUDE.md](../CLAUDE.md) - Project guidelines

## Success Criteria

- ✅ All 12 tests pass individually
- ✅ All 12 tests pass in batch mode
- ✅ Tests are deterministic and repeatable
- ✅ No mock state bleeding between tests
- ✅ Clear documentation for future developers

---

**Conclusion**: Mock isolation issue is completely resolved. The test suite now runs reliably in both individual and batch modes.
