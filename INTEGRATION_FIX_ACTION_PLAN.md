# Integration Test Fix - Action Plan

**Purpose:** Step-by-step plan to resolve all integration test failures
**Timeline:** 4-6 hours
**Priority:** Critical blockers first

---

## Phase 1: Build System Fix (30 minutes)

### Action 1.1: Increase Node Heap Size
**Time:** 5 minutes
**Priority:** 🔴 Critical

**Steps:**
1. Edit `package.json` scripts:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build",
    "typecheck": "NODE_OPTIONS='--max-old-space-size=4096' tsc --noEmit",
    "test": "NODE_OPTIONS='--max-old-space-size=4096' jest"
  }
}
```

2. Test build:
```bash
npm run build
```

3. Verify success:
```bash
echo $?  # Should be 0
```

**Expected Outcome:** Build succeeds without heap crash

**If Still Fails:** Investigate circular type dependencies in `lib/chat/woocommerce-types/`

---

### Action 1.2: Verify TypeScript Compilation
**Time:** 5 minutes
**Priority:** 🔴 Critical

**Steps:**
```bash
npm run typecheck
```

**Expected Outcome:** Zero TypeScript errors

**If Fails:** Review errors, likely type inference issues in newly added files

---

## Phase 2: Test Infrastructure Fix (2 hours)

### Action 2.1: Create Test Supabase Client Factory
**Time:** 30 minutes
**Priority:** 🔴 Critical

**File:** `lib/supabase/test-client.ts`

**Implementation:**
```typescript
/**
 * Test-friendly Supabase client creation
 * Uses service role key, bypasses request context
 */

import { createClient } from '@supabase/supabase-js';

export function createTestSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials for tests');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
```

**Verification:**
```typescript
const client = createTestSupabaseClient();
const { data } = await client.from('customer_configs').select('*').limit(1);
console.log('Test client works:', !!data);
```

---

### Action 2.2: Refactor Phase 4-5 Tests
**Time:** 60 minutes
**Priority:** 🔴 Critical

**File:** `test-phase4-5-tools.ts`

**Changes:**
1. Import test client:
```typescript
import { createTestSupabaseClient } from './lib/supabase/test-client';
```

2. Pass client to `executeWooCommerceOperation`:
```typescript
async function testTool(operation: string, params: any) {
  const client = createTestSupabaseClient();
  const result = await executeWooCommerceOperation(operation, params, client);
  // ... assertions
}
```

3. Update `executeWooCommerceOperation` signature:
```typescript
export async function executeWooCommerceOperation(
  operation: string,
  params: any,
  supabaseClient?: SupabaseClient  // Optional for tests
) {
  const client = supabaseClient || createClient(); // Use test client if provided
  // ... rest of implementation
}
```

**Verification:**
```bash
npx tsx test-phase4-5-tools.ts
# Expected: All 25 tests pass
```

---

### Action 2.3: Fix Store API Fallback Tests
**Time:** 30 minutes
**Priority:** 🟠 Medium

**File:** `lib/chat/cart-operations.ts`

**Issue:** Informational mode expects API client but gets `null`

**Fix:**
```typescript
async function addToCartInformational(
  wc: WooCommerceAPI | null,
  params: AddToCartParams
): Promise<WooCommerceOperationResult> {
  // ❌ OLD: Assumes wc exists
  // const product = await wc.getProduct(params.productId);

  // ✅ NEW: Skip validation if no client
  if (wc) {
    const product = await wc.getProduct(params.productId);
    // ... validation logic
  }

  // Always return success with URL
  return {
    success: true,
    data: { url: generateAddToCartUrl(params) },
    message: 'Ready to Add to Cart (Informational Mode)'
  };
}
```

**Apply same pattern to:**
- `applyCouponToCartInformational`
- `removeFromCartInformational`
- `updateCartInformational`

**Verification:**
```bash
npx tsx test-store-api-integration.ts
# Expected: 13/13 tests pass
```

---

## Phase 3: File Length Violations (3-4 hours)

### Action 3.1: Refactor cart-operations.ts (385 LOC → <300)
**Time:** 90 minutes
**Priority:** 🟡 High

**Strategy:** Split by operation type

**New Files:**
1. `lib/chat/cart-operations/add-to-cart.ts` (~100 LOC)
2. `lib/chat/cart-operations/remove-from-cart.ts` (~80 LOC)
3. `lib/chat/cart-operations/update-cart.ts` (~80 LOC)
4. `lib/chat/cart-operations/get-cart.ts` (~60 LOC)
5. `lib/chat/cart-operations/apply-coupon.ts` (~65 LOC)

**Main file:** `lib/chat/cart-operations/index.ts` (~20 LOC)
```typescript
export { addToCart } from './add-to-cart';
export { removeFromCart } from './remove-from-cart';
export { updateCart } from './update-cart';
export { getCart } from './get-cart';
export { applyCouponToCart } from './apply-coupon';
```

**Steps:**
1. Create directory: `lib/chat/cart-operations/`
2. Extract each operation to separate file
3. Update imports in `woocommerce-tool.ts`
4. Delete old `cart-operations.ts`
5. Verify all tests still pass

**Verification:**
```bash
npm test
npm run lint
npx tsc --noEmit
```

---

### Action 3.2: Refactor cart-operations-transactional.ts (377 LOC → <300)
**Time:** 60 minutes
**Priority:** 🟡 High

**Strategy:** Extract Store API client creation

**New Files:**
1. `lib/chat/cart-operations/transactional/client-factory.ts` (~80 LOC)
2. `lib/chat/cart-operations/transactional/operations.ts` (~220 LOC)
3. `lib/chat/cart-operations/transactional/index.ts` (~20 LOC)

**Extract to client-factory.ts:**
- `createStoreAPIClient()`
- `getOrCreateSession()`
- `validateStoreAPIAvailability()`

**Keep in operations.ts:**
- All cart operation implementations
- Error handling
- Response formatting

**Verification:**
```bash
npm test
wc -l lib/chat/cart-operations/transactional/*.ts
```

---

### Action 3.3: Refactor woocommerce-cart-tracker.ts (304 LOC → <300)
**Time:** 30 minutes
**Priority:** 🟢 Low (only 4 LOC over)

**Strategy:** Extract formatters

**New Files:**
1. `lib/chat/cart-tracker/tracker.ts` (~200 LOC)
2. `lib/chat/cart-tracker/formatters.ts` (~80 LOC)
3. `lib/chat/cart-tracker/index.ts` (~10 LOC)

**Extract to formatters.ts:**
- `formatCartItems()`
- `formatCartSummary()`
- `formatAbandonedCart()`

**Verification:**
```bash
wc -l lib/chat/cart-tracker/*.ts
npm test
```

---

## Phase 4: Integration Testing (1 hour)

### Action 4.1: Fix Cross-Feature Integration Tests
**Time:** 15 minutes
**Priority:** 🟢 Low

**File:** `test-woocommerce-integration-complete.ts`

**Fix:**
1. Update imports:
```typescript
// ❌ OLD
import { fetchCurrency } from './lib/woocommerce-currency';

// ✅ NEW
import { getCurrency } from './lib/woocommerce-currency';
```

2. Update all `fetchCurrency()` calls to `getCurrency(mockAPI, domain)`

3. Add mock WooCommerce API:
```typescript
const mockWooCommerceAPI = {
  getCurrentCurrency: async () => ({
    code: 'GBP',
    name: 'British Pound',
    symbol: '£'
  })
};
```

**Verification:**
```bash
npx tsx test-woocommerce-integration-complete.ts
# Expected: 7/7 tests pass
```

---

### Action 4.2: Add Integration Tests to CI
**Time:** 30 minutes
**Priority:** 🟢 Low

**File:** `.github/workflows/test.yml`

**Add:**
```yaml
- name: Run Integration Tests
  run: |
    npx tsx test-currency-fix.ts
    npx tsx test-pagination.ts
    npx tsx test-store-api-integration.ts
    npx tsx test-woocommerce-integration-complete.ts
```

---

### Action 4.3: Document Test Coverage
**Time:** 15 minutes
**Priority:** 🟢 Low

**File:** `docs/TESTING_GUIDE.md`

**Add section:**
```markdown
## Integration Tests

### Currency Fix Tests
- Tests: 8
- Coverage: Dynamic currency fetching, caching, formatting
- Runtime: ~100ms

### Pagination Tests
- Tests: 34
- Coverage: Page calculation, edge cases, user messages
- Runtime: ~50ms

### Store API Tests
- Tests: 13
- Coverage: Session management, cart operations, fallback mode
- Runtime: ~200ms

### Cross-Feature Integration
- Tests: 7
- Coverage: Currency + Pagination + Store API interactions
- Runtime: ~150ms

### Running Tests
npx tsx test-currency-fix.ts
npx tsx test-pagination.ts
npx tsx test-store-api-integration.ts
npx tsx test-woocommerce-integration-complete.ts
```

---

## Phase 5: Verification (30 minutes)

### Action 5.1: Run All Tests
**Time:** 10 minutes
**Priority:** 🔴 Critical

**Commands:**
```bash
# Unit tests
npm test

# Integration tests
npx tsx test-currency-fix.ts
npx tsx test-pagination.ts
npx tsx test-store-api-integration.ts
npx tsx test-woocommerce-integration-complete.ts

# Regression tests
npx tsx test-phase4-5-tools.ts
```

**Expected Results:**
- Currency: 8/8 ✅
- Pagination: 34/34 ✅
- Store API: 13/13 ✅
- Integration: 7/7 ✅
- Phase 4-5: 25/25 ✅

**Total:** 87/87 tests passing (100%)

---

### Action 5.2: Verify Build System
**Time:** 10 minutes
**Priority:** 🔴 Critical

**Commands:**
```bash
# TypeScript compilation
npm run typecheck

# Production build
npm run build

# Linting
npm run lint
```

**Expected Results:**
- TypeScript: 0 errors ✅
- Build: Success ✅
- Lint: <20 warnings ✅

---

### Action 5.3: Verify File Lengths
**Time:** 5 minutes
**Priority:** 🟡 High

**Command:**
```bash
find lib -name "*.ts" -exec wc -l {} + | awk '$1 > 300 {print}'
```

**Expected Result:** No output (all files <300 LOC)

---

### Action 5.4: Final Checklist
**Time:** 5 minutes
**Priority:** 🔴 Critical

**Pre-Deployment Checklist:**
- [ ] All 87 tests passing
- [ ] TypeScript compilation succeeds
- [ ] Next.js build succeeds
- [ ] No file length violations
- [ ] ESLint warnings <20
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Git status clean

**If all checked:** ✅ **READY FOR DEPLOYMENT**

---

## Rollback Plan

**If issues arise after deployment:**

1. **Revert commits:**
```bash
git revert HEAD~3..HEAD  # Revert last 3 commits
git push
```

2. **Restore previous version:**
```bash
git checkout <previous-commit-hash>
git push -f origin main
```

3. **Notify team:**
- Post in Slack #deployments
- Update GitHub issue
- Document failure cause

---

## Success Metrics

**Before:**
- Tests Passing: 53/87 (60.9%)
- Build Status: ❌ Crashed
- File Violations: 3
- Deployment Ready: ❌ No

**After:**
- Tests Passing: 87/87 (100%)
- Build Status: ✅ Success
- File Violations: 0
- Deployment Ready: ✅ Yes

---

## Timeline Summary

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Build system fix | 30m | 🔴 Critical |
| 2 | Test infrastructure | 2h | 🔴 Critical |
| 3 | File refactoring | 3-4h | 🟡 High |
| 4 | Integration tests | 1h | 🟢 Low |
| 5 | Verification | 30m | 🔴 Critical |
| **Total** | **All phases** | **4-6h** | - |

**Critical Path:** Phases 1, 2, 5 (3 hours)
**Optional:** Phase 4 (can be done later)
**Deferrable:** Phase 3 (creates tech debt if skipped)

---

## Appendix: Quick Commands Reference

```bash
# Fix build crashes
npm run build  # Should succeed after heap size increase

# Fix test infrastructure
npx tsx test-phase4-5-tools.ts  # Should pass after client refactor

# Verify file lengths
find lib -name "*.ts" -exec wc -l {} + | awk '$1 > 300 {print}'

# Run all integration tests
for test in test-currency-fix test-pagination test-store-api-integration test-woocommerce-integration-complete; do
  npx tsx $test.ts || exit 1
done

# Full verification
npm run typecheck && npm run build && npm test && npm run lint
```

---

**Action Plan Created:** 2025-10-29
**Estimated Completion:** 4-6 hours
**Status:** Ready to Execute
