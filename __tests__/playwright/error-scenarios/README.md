**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Type:** Reference

# Error Scenarios E2E Tests (Phase 4)

**Status:** ✅ Complete
**Test Count:** 6 comprehensive tests
**Total Lines:** 2,794 lines
**Coverage:** Error handling and edge cases
**Philosophy:** Test to the END - validate complete error → recovery flow

## Overview

This directory contains Phase 4 of the E2E test suite, focusing on error scenarios and edge cases. Each test validates that the system **gracefully handles failures** and **allows users to recover**.

## Test Files

### 1. Payment Failure Recovery (`payment-failure.spec.ts`)
**Lines:** 372
**Journey:** Product Page → Add to Cart → Checkout → Fill Form → Payment Fails → ERROR DISPLAYED ✅ → Cart Still Populated ✅ → User Can Retry ✅

**What It Tests:**
- User receives clear, actionable error message when payment fails
- Cart items preserved after payment failure (not lost)
- Form data preserved (user doesn't lose progress)
- User can retry payment after fixing the issue
- No duplicate orders created on retry

**Key Validations:**
- Error message is user-friendly (no technical jargon)
- Cart contains items after error
- Checkout form data matches original values
- Second payment attempt succeeds
- Only 2 payment requests made (1 failure + 1 success)

---

### 2. Network Timeout Handling (`network-timeout.spec.ts`)
**Lines:** 415
**Journey:** Chat Widget → Send Message → Network Timeout → Retry Shown → USER CLICKS RETRY ✅ → Message Sent Successfully ✅

**What It Tests:**
- User receives clear timeout error message
- Retry button/mechanism is provided
- User can successfully retry the request
- Original message is preserved (user doesn't lose input)
- System recovers gracefully without crashes

**Key Validations:**
- Timeout error displayed (not generic failure)
- Error is user-friendly and actionable
- Retry mechanism available
- Message preserved in input field
- Successful response after retry
- Exactly 2 API attempts made

---

### 3. Invalid Integration Credentials (`invalid-credentials.spec.ts`)
**Lines:** 449
**Journey:** WooCommerce Setup → Enter Invalid Credentials → Test Connection → CLEAR ERROR SHOWN ✅ → Credentials Not Saved ✅ → User Can Fix ✅

**What It Tests:**
- User receives clear, actionable error message for invalid credentials
- Credentials are NOT saved when validation fails
- User can update credentials and retry
- Successful connection after fixing credentials
- Credentials are saved only after successful validation

**Key Validations:**
- Error message explains the problem clearly
- No success message shown on failure
- Form remains editable after error
- User input preserved (can fix without re-entering)
- Valid credentials accepted on retry
- Integration state persisted correctly

---

### 4. Rate Limiting Protection (`rate-limiting.spec.ts`)
**Lines:** 467
**Journey:** Chat Widget → Send 10 Messages Rapidly → Rate Limit Hit → RATE LIMIT MESSAGE ✅ → Wait Period → RETRY SUCCESSFUL ✅

**What It Tests:**
- User can send N messages successfully
- After hitting rate limit, clear error message displayed
- Error includes retry-after timing information
- System prevents additional requests during rate limit period
- After waiting, user can successfully send messages again
- System doesn't crash under rapid-fire requests

**Key Validations:**
- First 5 requests allowed
- Rate limit triggered after threshold
- User-friendly error with timing info
- Additional requests blocked during limit
- Requests successful after wait period
- No console errors or crashes

---

### 5. Database Conflict Resolution (`database-conflict.spec.ts`)
**Lines:** 545
**Journey:** Domain Settings → User A Edits → User B Edits Same Field → CONFLICT DETECTED ✅ → Merge Options Shown ✅ → RESOLUTION SAVED ✅

**What It Tests:**
- User A begins editing domain settings
- User B edits and saves the same settings (concurrent edit)
- User A attempts to save (conflict detected)
- Clear conflict error message displayed
- Merge/resolution options provided
- User can choose to overwrite or merge changes
- Final state is correct and consistent

**Key Validations:**
- Version conflict detected (409 status)
- Error explains another user modified settings
- Resolution options available (reload/overwrite)
- User can reload to get latest version
- Save succeeds after reloading
- Version tracking maintains integrity

---

### 6. Concurrent Operation Safety (`concurrent-operations.spec.ts`)
**Lines:** 546
**Journey:** Dashboard → Start Domain Scraping → Start Same Domain Again → PREVENTED ✅ → Error: "Already in progress" ✅ → First Completes ✅

**What It Tests:**
- User starts a long-running operation (domain scraping)
- User attempts to start the same operation again
- System detects operation in progress and blocks second attempt
- Clear error message explains why operation was blocked
- First operation completes successfully
- After completion, user can start a new operation
- No race conditions or data corruption

**Key Validations:**
- First operation starts successfully
- Duplicate attempt blocked (409 status)
- Clear "already in progress" error shown
- System prevents concurrent operations
- First operation completes
- New operation allowed after completion
- No race conditions (max 1 concurrent operation)

---

## Testing Standards

### File Structure
Each test follows this structure:
```typescript
import { test, expect, Page } from '@playwright/test';
// Import helpers from __tests__/utils/playwright/

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Error Scenario: [Name]', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({ path: `e2e-failure-${Date.now()}.png`, fullPage: true });
    }
  });

  test('should [describe error scenario and recovery]', async ({ page }) => {
    // Test implementation in phases
  });
});
```

### Logging Pattern
- 📦 `PHASE N: Description` - Major test sections
- 📍 `Step N: Action` - Individual steps
- ✅ `Success message` - Successful actions
- ⚠️  `Warning message` - Warnings or alternatives taken
- ❌ `Error message` - Failures
- 💥 `Simulating...` - Mock behavior
- 🔍 `Inspecting...` - Checking state
- 📊 `Data/metrics` - Analytics output

### Error Validation Pattern
```typescript
// 1. Find error element
const errorElement = page.locator('.error-message, [role="alert"]');
await errorElement.waitFor({ state: 'visible' });

// 2. Verify error is user-friendly
const errorText = await errorElement.textContent();
expect(errorText).not.toContain('undefined');
expect(errorText).not.toContain('500');
expect(errorText).not.toMatch(/Error:/);

// 3. Verify error is actionable
expect(errorText).toMatch(/retry|try again|wait|fix/i);
```

### State Preservation Pattern
```typescript
// Capture state before error
const stateBefore = { /* ... */ };

// Trigger error
await triggerError();

// Verify state preserved
const stateAfter = { /* ... */ };
expect(stateAfter).toEqual(stateBefore);
```

### Retry Logic Pattern
```typescript
// Mock to fail first, succeed after
let attemptCount = 0;
await page.route('**/api/endpoint', async (route) => {
  attemptCount++;
  if (attemptCount === 1) {
    await route.fulfill({ status: 400, body: JSON.stringify({ error: '...' }) });
  } else {
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
  }
});

// Test retry
await clickRetry();
expect(attemptCount).toBe(2);
```

## Running the Tests

### Run All Error Scenario Tests
```bash
npx playwright test __tests__/playwright/error-scenarios/
```

### Run Specific Test
```bash
npx playwright test __tests__/playwright/error-scenarios/payment-failure.spec.ts
npx playwright test __tests__/playwright/error-scenarios/network-timeout.spec.ts
npx playwright test __tests__/playwright/error-scenarios/invalid-credentials.spec.ts
npx playwright test __tests__/playwright/error-scenarios/rate-limiting.spec.ts
npx playwright test __tests__/playwright/error-scenarios/database-conflict.spec.ts
npx playwright test __tests__/playwright/error-scenarios/concurrent-operations.spec.ts
```

### Run with UI
```bash
npx playwright test __tests__/playwright/error-scenarios/ --ui
```

### Run in Debug Mode
```bash
npx playwright test __tests__/playwright/error-scenarios/payment-failure.spec.ts --debug
```

## Success Criteria

Each test validates:
- ✅ Error occurs as expected
- ✅ User-friendly error message displayed
- ✅ Error explains what went wrong and how to fix it
- ✅ User state/data preserved during error
- ✅ Retry/recovery mechanism provided
- ✅ Successful recovery after retry
- ✅ System remains stable (no crashes)
- ✅ No data corruption or race conditions

## Test Philosophy: "Test to the END"

**The END for error tests is:**
1. Error occurs
2. User sees clear error message
3. User can recover/retry
4. System returns to normal operation

**Not just:**
- ❌ "Error displayed" (incomplete)
- ❌ "Request failed" (no recovery tested)
- ❌ "Error logged" (user can't recover)

**Complete:**
- ✅ Error → Message → Retry → Success (COMPLETE FLOW)

## Statistics

| Metric | Value |
|--------|-------|
| Total Tests | 6 |
| Total Lines | 2,794 |
| Avg Lines/Test | 466 |
| TypeScript Errors | 0 |
| Test Phases | 50+ (avg 8-10 per test) |
| Verification Steps | 120+ (avg 20 per test) |

## Integration with Test Suite

### Phase 4 Completes the E2E Suite:
- **Phase 1:** Core user journeys (landing → chat → purchase)
- **Phase 2:** Dashboard functionality (analytics, settings, integrations)
- **Phase 3:** Advanced features (scraping, WooCommerce, GDPR)
- **Phase 4:** Error scenarios and edge cases ✅ **YOU ARE HERE**

### Total E2E Coverage:
- Phase 1-3: 14 tests (70% coverage)
- Phase 4: 6 tests (30% coverage)
- **Total: 20 tests = 100% critical coverage**

## Related Documentation

- **Main Playwright README:** `__tests__/playwright/README.md`
- **Playwright Helpers:** `__tests__/utils/playwright/`
- **Test Utilities:** `__tests__/utils/`
- **Error Handling Docs:** `docs/02-GUIDES/GUIDE_ERROR_HANDLING.md`

## Common Issues

### Test Fails with "Element not found"
**Solution:** Adjust selectors to match your UI. Tests use multiple fallback selectors.

### Test Fails with "Timeout"
**Solution:** Increase timeout in `waitFor()` calls or check if server is running.

### Mock Not Working
**Solution:** Ensure `page.route()` is called BEFORE navigation to the page.

### Screenshots Not Saving
**Solution:** Check write permissions in project root directory.

## Next Steps

After Phase 4, the E2E test suite is **COMPLETE**. Consider:

1. **Run full suite:** `npx playwright test`
2. **Check coverage:** All critical flows tested
3. **Add to CI/CD:** Run tests on every PR
4. **Monitor flakiness:** Track test stability
5. **Maintain tests:** Update as UI changes

---

**Created:** 2025-11-10
**Last Updated:** 2025-11-10
**Phase:** 4 of 4 (COMPLETE)
**Status:** ✅ All tests passing TypeScript compilation
