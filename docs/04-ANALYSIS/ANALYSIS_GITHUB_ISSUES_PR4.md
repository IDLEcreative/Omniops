# GitHub Issues for PR #4 Critical Findings

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 132 minutes

## Purpose
Multi-tenant RLS tests currently use `SUPABASE_SERVICE_ROLE_KEY` which bypasses Row Level Security policies. This means our tests don't actually validate that Organization A can't access Organization B's data in production.

## Quick Links
- [Issue 1: 🔴 CRITICAL - Fix RLS Testing to Use User Sessions](#issue-1--critical---fix-rls-testing-to-use-user-sessions)
- [Issue 2: 🔴 CRITICAL - Complete customer_id → organization_id Migration](#issue-2--critical---complete-customerid--organizationid-migration)
- [Issue 3: 🟠 HIGH - Standardize Supabase Client Imports](#issue-3--high---standardize-supabase-client-imports)
- [Issue 4: 🟡 MEDIUM - Fix Non-Deterministic Rate Limit Cleanup](#issue-4--medium---fix-non-deterministic-rate-limit-cleanup)
- [Issue 5: 🟡 MEDIUM - Fix WooCommerce Provider Test Mocking](#issue-5--medium---fix-woocommerce-provider-test-mocking)

## Keywords
analysis, authentication, bypass, clean, cleanup, client, code, complete, config, create

---


**Purpose**: These 12 issues track the critical findings from the 8-agent codebase analysis (PR #4).

**Generated**: 2025-10-28
**Source**: PR #4 Multi-Agent Codebase Analysis
**Total Issues**: 12
**Priority Breakdown**:
- 🔴 **CRITICAL** (5 issues): Immediate security/data risks
- 🟠 **HIGH** (4 issues): Architecture and infrastructure issues
- 🟡 **MEDIUM** (2 issues): Testing and code quality
- 🟢 **LOW** (1 issue): Documentation/compliance

---

## Issue 1: 🔴 CRITICAL - Fix RLS Testing to Use User Sessions

**Labels**: `critical`, `security`, `testing`, `RLS`, `multi-tenant`

**Title**: 🔴 CRITICAL: Fix RLS testing to use user sessions instead of service role key

**Body**:
### Problem
Multi-tenant RLS tests currently use `SUPABASE_SERVICE_ROLE_KEY` which bypasses Row Level Security policies. This means our tests don't actually validate that Organization A can't access Organization B's data in production.

**File**: `__tests__/integration/multi-tenant-isolation.test.ts:21`

**Evidence**:
```typescript
// Lines 15-16: Using service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Line 21: Tests are skipped
describe.skip('Multi-Tenant Data Isolation', () => {
  // Service role key bypasses RLS - tests are meaningless!

  it('should prevent access to other organization\'s customer configs', async () => {
    // Lines 113-115: Comment acknowledges the bypass
    // With service role key, this will return data ⚠️
    // In production, RLS would prevent this with user context
  });
});
```

### Impact
**CRITICAL**: Organization A could potentially access Organization B's:
- Customer configurations
- Conversations and messages
- Scraped website data
- Embeddings and search results
- Member lists and permissions

### Root Cause
1. Tests use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS
2. No tests validate RLS policies with actual user sessions
3. Tests are skipped (`.skip`) so they don't run in CI/CD
4. TODO comments acknowledge the problem but it's not fixed

### Solution
1. Create `test-utils/rls-test-helpers.ts` with user session utilities
2. Implement `createUserClient(userId, orgId)` with real auth tokens
3. Update tests to use user contexts instead of service key
4. Remove `.skip` from tests
5. Verify unauthorized access actually FAILS
6. Enable tests in CI/CD pipeline

**Example Implementation**:
```typescript
// test-utils/rls-test-helpers.ts
export async function createUserClient(userId: string, orgId: string) {
  // Create client with user auth token, not service key
  return createClient({
    auth: {
      session: await generateUserSession(userId, orgId)
    }
  });
}
```

### Acceptance Criteria
- [ ] Tests use user sessions with proper auth tokens
- [ ] Tests verify Organization A CANNOT access Organization B's data
- [ ] All RLS tests passing (no `.skip`)
- [ ] Tests run in CI/CD pipeline
- [ ] Service role key only used for admin operations, not security tests
- [ ] Documentation updated with RLS testing patterns

### Time Estimate
2 days (12-16 hours)

### Priority
🔴 **IMMEDIATE** - Start this first

### References
- Analysis: [CRITICAL_ISSUES_ANALYSIS.md](docs/CRITICAL_ISSUES_ANALYSIS.md#issue-1)
- Related PR: #4

---

## Issue 2: 🔴 CRITICAL - Complete customer_id → organization_id Migration

**Labels**: `critical`, `architecture`, `database`, `refactoring`, `technical-debt`

**Title**: 🔴 CRITICAL: Complete customer_id → organization_id migration (550+ references)

**Body**:
### Problem
Incomplete migration from customer-centric to organization-centric architecture. 550+ references to `customer_id` remain in codebase across 111 files.

**Evidence**:
```bash
$ grep -r "customer_id\|customerId" . | wc -l
550

# Distribution across 111 files:
# - Migrations: Legacy schema
# - lib/: Business logic
# - app/api/: API routes
# - __tests__/: Tests
# - docs/: Documentation
# - scripts/: Utilities
```

### Impact
**CRITICAL**:
- Architectural confusion (which field to use?)
- Blocks multi-seat functionality
- Potential data corruption when fields mismatch
- Developer confusion and inconsistent patterns
- Test failures when using wrong field

**Example of Current Confusion**:
```typescript
// Test uses NEW architecture
await supabase.from('customer_configs').insert({
  organization_id: org1Id,  // ✅ New field
});

// But embeddings use OLD architecture
await supabase.from('page_embeddings').insert({
  customer_id: domain1Id,   // ❌ Legacy field
});

// API routes pass undefined
mockCrawlWebsiteWithCleanup('https://example.com', {
  customerId: undefined,  // ⚠️ What does this mean?
});
```

### Files Affected
**Database Tables** (both fields exist):
- `page_embeddings`
- `scraped_pages`
- `conversations`
- `messages`
- `query_cache`

**Code Files** (111 files total):
- `lib/` - Core services
- `app/api/` - API endpoints
- `__tests__/` - Test files
- `scripts/` - Utility scripts

### Solution (4 Phases)

#### Phase 1: Analysis (2 hours)
```bash
# 1. Create analysis script
npx tsx scripts/analyze-customer-id-migration.ts

# 2. Identify tables with both fields
SELECT
  table_name,
  COUNT(*) as records,
  COUNT(customer_id) as has_customer_id,
  COUNT(organization_id) as has_organization_id
FROM information_schema.columns
WHERE column_name IN ('customer_id', 'organization_id')
GROUP BY table_name;

# 3. Find orphaned data
SELECT * FROM page_embeddings
WHERE customer_id IS NOT NULL
  AND organization_id IS NULL;
```

#### Phase 2: Database Migration (4 hours)
```sql
-- Step 1: Add organization_id where missing
ALTER TABLE page_embeddings
ADD COLUMN IF NOT EXISTS organization_id UUID
REFERENCES organizations(id);

-- Step 2: Backfill from customer_configs
UPDATE page_embeddings pe
SET organization_id = cc.organization_id
FROM customer_configs cc
WHERE pe.customer_id = cc.id;

-- Step 3: Verify no nulls
SELECT COUNT(*) FROM page_embeddings
WHERE organization_id IS NULL;
-- Should be 0

-- Step 4: Add NOT NULL constraint
ALTER TABLE page_embeddings
ALTER COLUMN organization_id SET NOT NULL;

-- Step 5: Drop legacy column (AFTER code is deployed!)
-- Uncomment after verification:
-- ALTER TABLE page_embeddings DROP COLUMN customer_id;
```

#### Phase 3: Code Migration (6 hours)
1. Update all `lib/` files to use `organization_id`
2. Update all `app/api/` routes
3. Update all test files
4. Update documentation

**Search and Replace Strategy**:
```bash
# Find all files with customer_id references
grep -r "customer_id" lib/ app/ --files-with-matches

# Update systematically by module
# - embeddings.ts
# - crawler-config.ts
# - All API routes
# - All tests
```

#### Phase 4: Cleanup & Verification (2 hours)
```bash
# 1. Ensure zero references in new code
grep -r "customer_id" lib/ app/ --exclude-dir=node_modules

# 2. Run full test suite
npm test

# 3. Run multi-tenant isolation tests
npm run test:integration

# 4. Verify in production (staging first)
# - Check all queries use organization_id
# - Verify data integrity
# - Monitor error logs
```

### High-Risk Data Tables
**Prioritize these for safe migration**:
1. `page_embeddings` - 13,054 rows (vector embeddings)
2. `scraped_pages` - 4,459 rows (website content)
3. `conversations` - 871 rows (chat history)
4. `messages` - 2,441 rows (individual messages)
5. `query_cache` - Unknown count (search cache)

### Acceptance Criteria
- [ ] Zero references to `customer_id` in new code (excluding migrations)
- [ ] All tables use `organization_id` as primary tenant identifier
- [ ] All tests passing with updated schema
- [ ] Multi-tenant isolation verified with new field
- [ ] Data integrity confirmed (no lost records)
- [ ] Documentation updated with new architecture
- [ ] Migration rollback plan documented

### Time Estimate
14 hours (2 developer-days)

### Priority
🔴 **HIGH** - Start after RLS fix

### References
- Analysis: [CRITICAL_ISSUES_ANALYSIS.md](docs/CRITICAL_ISSUES_ANALYSIS.md#issue-2)
- Database Report: [DATABASE_ANALYSIS_REPORT.md](docs/reports/DATABASE_ANALYSIS_REPORT.md)
- Related Issues: Will unblock multi-seat functionality

---

## Issue 3: 🟠 HIGH - Standardize Supabase Client Imports

**Labels**: `high`, `architecture`, `testing`, `refactoring`, `code-quality`

**Title**: 🟠 HIGH: Standardize Supabase client imports (4 different patterns)

**Body**:
### Problem
Four different Supabase client import patterns exist across the codebase, causing test mocking nightmares and async/sync confusion.

**Evidence**:
```typescript
// Pattern 1 - lib/supabase-server.ts
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

// Pattern 2 - lib/supabase/server.ts (RECOMMENDED)
import { createClient } from '@/lib/supabase/server'

// Pattern 3 - Direct import
import { createClient } from '@supabase/supabase-js'

// Pattern 4 - Test-specific
import { createServerClient } from '@/lib/supabase/server'
```

### Impact
**Test Mocking Failures**:
```typescript
// Different tests mock different paths
jest.mock('@/lib/supabase-server');        // ❌ Some tests
jest.mock('@/lib/supabase/server');        // ❌ Other tests
jest.mock('@supabase/supabase-js');        // ❌ Integration tests

// Result: Mocks don't work, tests fail intermittently
```

**Async/Sync Confusion**:
```typescript
// Some files treat as sync
const client = createClient();

// Others treat as async
const client = await createClient();

// Actual implementation varies by import path!
```

### Files Affected
- **~111 files** with various import patterns
- **~23 test files** with broken mocks

### Solution

#### Decision: Standardize on `@/lib/supabase/server`

**Rationale:**
- ✅ Matches Next.js App Router conventions
- ✅ Clear separation from client-side code
- ✅ TypeScript path alias for easy updates
- ✅ Already used in newer code
- ✅ Consistent async patterns

#### Migration Steps

**Step 1: Update Core Files (1 hour)**
```typescript
// lib/supabase/server.ts (CANONICAL FILE)
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for server-side operations with user context.
 * Uses cookies for auth. DOES NOT BYPASS RLS.
 */
export async function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

/**
 * Creates a Supabase client with service role key.
 * ⚠️ BYPASSES RLS - Use only for admin operations!
 */
export async function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
    }
  );
}
```

**Step 2: Create Test Helpers (1 hour)**
```typescript
// test-utils/supabase-test-helpers.ts
import { jest } from '@jest/globals';

export function mockSupabaseClient(overrides = {}) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      })
    },
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides[table]
    })),
    ...overrides
  };
}

/**
 * Standard mock setup for all tests.
 * Call this at the top of test files.
 */
export function setupSupabaseMocks() {
  const mockClient = mockSupabaseClient();

  jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn().mockResolvedValue(mockClient),
    createServiceRoleClient: jest.fn().mockResolvedValue(mockClient)
  }));

  return mockClient;
}
```

**Step 3: Update All Imports (3 hours)**
```bash
# Find all files with old imports
grep -r "from '@/lib/supabase-server'" . --files-with-matches

# Automated replacement (careful!)
find . -name "*.ts" -o -name "*.tsx" | \
  xargs sed -i '' "s|@/lib/supabase-server|@/lib/supabase/server|g"

# Manual verification required for edge cases
```

**Step 4: Update All Tests (4 hours)**
```typescript
// BEFORE (in each test file)
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(() => ({
    // ... 20 lines of mock setup
  }))
}));

// AFTER (in each test file)
import { setupSupabaseMocks } from '@/test-utils/supabase-test-helpers';

const mockClient = setupSupabaseMocks();
// Tests now use consistent mocks
```

**Step 5: Delete Legacy Files (30 minutes)**
```bash
# After migration complete and tests passing
rm lib/supabase-server.ts
# Update any remaining references
```

### Acceptance Criteria
- [ ] Single import pattern: `@/lib/supabase/server`
- [ ] All files updated (111 files)
- [ ] All tests updated (23 test files)
- [ ] Test helpers created and documented
- [ ] Legacy files removed
- [ ] All tests passing
- [ ] Documentation updated with standard pattern

### Time Estimate
8-10 hours (1-1.5 developer-days)

### Priority
🟠 **HIGH** - Blocks test development and causes confusion

### References
- Analysis: [CRITICAL_ISSUES_ANALYSIS.md](docs/CRITICAL_ISSUES_ANALYSIS.md#issue-3)
- Next.js Docs: [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

## Issue 4: 🟡 MEDIUM - Fix Non-Deterministic Rate Limit Cleanup

**Labels**: `medium`, `performance`, `memory-leak`, `refactoring`

**Title**: 🟡 MEDIUM: Replace non-deterministic rate limit cleanup with deterministic approach

**Body**:
### Problem
Rate limiting cleanup uses `Math.random()` (1% chance) which is non-deterministic and could lead to memory leaks in long-running servers.

**File**: `lib/rate-limit.ts`

**Evidence**:
```typescript
// Current implementation
function checkRateLimit(identifier: string, maxRequests: number, windowMs: number) {
  // Probabilistic cleanup (1% chance)
  if (Math.random() < 0.01) {
    cleanupOldEntries();
  }

  // ... rate limit logic
}
```

### Impact
**Long-Running Server Risk**:
```typescript
// Server runs for 30 days
// Average 100 requests/sec = 8.6M requests/day
// Expected cleanups: 8.6M * 0.01 = 86,000/day

// BUT: Math.random() could theoretically:
// - Never trigger (probability ~0 but possible)
// - Accumulate 1000s of stale entries
// - Leak memory over time
// - Degrade performance as Map grows
```

**Test Evidence**:
```typescript
// __tests__/lib/rate-limit.test.ts:121
it('should clean up old entries periodically', () => {
  // Test MOCKS Math.random to force cleanup
  jest.spyOn(Math, 'random').mockReturnValue(0.005);

  // Without mock, cleanup is unreliable ⚠️
  // Tests pass but production behavior is non-deterministic
});
```

### Solution

**Replace with Deterministic Cleanup:**

```typescript
// lib/rate-limit.ts (FIXED)
const CLEANUP_THRESHOLD = 1000; // Clean up every 1000 checks
let checkCount = 0;

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 50,
  windowMs: number = 60000
): RateLimitResult {
  checkCount++;

  // Deterministic cleanup every N requests
  if (checkCount >= CLEANUP_THRESHOLD) {
    cleanupOldEntries();
    checkCount = 0;
  }

  // ... existing rate limit logic

  const now = Date.now();
  const key = `${identifier}:${windowMs}`;

  let rateLimitData = rateLimitMap.get(key);

  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + windowMs
    };
    rateLimitMap.set(key, rateLimitData);
  }

  rateLimitData.count++;

  const isRateLimited = rateLimitData.count > maxRequests;
  const remaining = Math.max(0, maxRequests - rateLimitData.count);
  const resetTime = rateLimitData.resetTime;

  return {
    success: !isRateLimited,
    limit: maxRequests,
    remaining,
    reset: new Date(resetTime)
  };
}

function cleanupOldEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => rateLimitMap.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`[Rate Limit] Cleaned up ${keysToDelete.length} expired entries`);
  }
}

// Optional: Export for testing
export function resetCleanupCounter(): void {
  checkCount = 0;
}
```

**Updated Tests:**
```typescript
// __tests__/lib/rate-limit.test.ts
describe('Rate Limit Cleanup', () => {
  beforeEach(() => {
    resetCleanupCounter();
  });

  it('should clean up old entries after threshold', () => {
    // Deterministic - no Math.random() mocking needed!

    // Make 999 calls - no cleanup yet
    for (let i = 0; i < 999; i++) {
      checkRateLimit(`user${i}`, 10, 60000);
    }

    // 1000th call triggers cleanup
    const consoleSpy = jest.spyOn(console, 'log');
    checkRateLimit('user1000', 10, 60000);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Rate Limit] Cleaned up')
    );
  });
});
```

### Benefits
- ✅ Deterministic behavior (always runs every 1000 checks)
- ✅ Testable without mocking Math.random
- ✅ No memory leak risk
- ✅ Predictable performance impact
- ✅ Configurable threshold for different workloads
- ✅ Logging for monitoring

### Alternative Approaches Considered
1. **Time-based cleanup** - Rejected (requires setInterval, harder to test)
2. **Redis-backed rate limiting** - Future enhancement (requires infrastructure)
3. **LRU cache** - Overkill for current needs

### Acceptance Criteria
- [ ] Replace Math.random() with counter-based cleanup
- [ ] Update tests to verify deterministic behavior
- [ ] Remove Math.random() mocking from tests
- [ ] Verify no memory leaks under sustained load
- [ ] Add monitoring/logging for cleanup events
- [ ] Document cleanup threshold in config

### Time Estimate
2-3 hours

### Priority
🟡 **MEDIUM** - Fix after critical items (Issues #1, #2)

### References
- Analysis: [CRITICAL_ISSUES_ANALYSIS.md](docs/CRITICAL_ISSUES_ANALYSIS.md#issue-4)
- Test File: `__tests__/lib/rate-limit.test.ts:121`

---

## Issue 5: 🟡 MEDIUM - Fix WooCommerce Provider Test Mocking

**Labels**: `medium`, `testing`, `woocommerce`, `mocking`

**Title**: 🟡 MEDIUM: Fix WooCommerce provider tests failing due to mocking issues

**Body**:
### Problem
WooCommerce provider tests are written but failing due to inconsistent mocking patterns. Same root cause as Issue #3 (Supabase client imports).

**File**: `__tests__/lib/agents/providers/woocommerce-provider.test.ts`

**Evidence** (from TEST_COMPLETION_REPORT.md:122-139):
> **Status:** Written but encountering mocking issues ⚠️
> **Tests Created:** 16 tests for order lookup and product search
> **Problem:** Can't properly mock `getDynamicWooCommerceClient`

### Impact
- 16 WooCommerce provider tests failing
- Can't verify WooCommerce integration works correctly
- Blocks WooCommerce feature development
- No confidence in order lookup or product search functionality

### Root Cause
Same inconsistent import/mocking pattern as Supabase clients:
```typescript
// Multiple import patterns exist
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-full';

// Tests try to mock but fail
jest.mock('@/lib/woocommerce-dynamic'); // Sometimes this
jest.mock('@/lib/woocommerce-full');    // Sometimes this
```

### Solution

**This issue is BLOCKED by Issue #3** - Must standardize client patterns first.

#### Step 1: Fix Issue #3 (Supabase Client Standardization)
Complete Issue #3 first to establish the pattern for client mocking.

#### Step 2: Apply Same Pattern to WooCommerce (2 hours)
```typescript
// lib/woocommerce/client.ts (NEW CANONICAL FILE)
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { getDecryptedCredentials } from '@/lib/encryption';

/**
 * Creates a WooCommerce API client for a given domain.
 * Dynamically loads credentials from database.
 */
export async function getDynamicWooCommerceClient(domain: string) {
  const credentials = await getDecryptedCredentials(domain);

  if (!credentials?.woocommerce_url || !credentials?.woocommerce_consumer_key) {
    throw new Error(`WooCommerce credentials not found for domain: ${domain}`);
  }

  return new WooCommerceRestApi({
    url: credentials.woocommerce_url,
    consumerKey: credentials.woocommerce_consumer_key,
    consumerSecret: credentials.woocommerce_consumer_secret,
    version: "wc/v3",
    timeout: 10000
  });
}
```

#### Step 3: Create WooCommerce Test Helpers (1 hour)
```typescript
// test-utils/woocommerce-test-helpers.ts
import { jest } from '@jest/globals';

export function mockWooCommerceClient(overrides = {}) {
  return {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    ...overrides
  };
}

/**
 * Standard mock setup for WooCommerce tests.
 */
export function setupWooCommerceMocks() {
  const mockClient = mockWooCommerceClient();

  jest.mock('@/lib/woocommerce/client', () => ({
    getDynamicWooCommerceClient: jest.fn().mockResolvedValue(mockClient)
  }));

  return mockClient;
}
```

#### Step 4: Update Provider Tests (2 hours)
```typescript
// __tests__/lib/agents/providers/woocommerce-provider.test.ts
import { setupWooCommerceMocks } from '@/test-utils/woocommerce-test-helpers';

describe('WooCommerceProvider', () => {
  let mockClient: ReturnType<typeof setupWooCommerceMocks>;

  beforeEach(() => {
    mockClient = setupWooCommerceMocks();
  });

  it('should lookup order by ID', async () => {
    // Mock specific for this test
    mockClient.get.mockResolvedValueOnce({
      data: {
        id: 123,
        status: 'completed',
        total: '99.99'
      }
    });

    const provider = new WooCommerceProvider('example.com');
    const result = await provider.lookupOrder('123');

    expect(result).toMatchObject({
      orderId: '123',
      status: 'completed'
    });
  });

  // ... 15 more tests
});
```

#### Step 5: Consolidate WooCommerce Files (1 hour)
```bash
# Current state: Multiple files
lib/woocommerce-dynamic.ts
lib/woocommerce-full.ts

# After consolidation:
lib/woocommerce/client.ts (canonical)
lib/woocommerce/types.ts
lib/woocommerce/utils.ts

# Remove old files after migration
```

### Acceptance Criteria
- [ ] Issue #3 (Supabase standardization) completed first
- [ ] WooCommerce client imports standardized
- [ ] Test helpers created in `test-utils/woocommerce-test-helpers.ts`
- [ ] All 16 WooCommerce provider tests passing
- [ ] Mocking pattern documented
- [ ] Legacy WooCommerce files removed

### Time Estimate
6 hours (blocked by Issue #3)

### Priority
🟡 **MEDIUM** - Start after Issue #3 completion

### Dependencies
- **BLOCKED BY**: Issue #3 (Supabase Client Standardization)

### References
- Analysis: [CRITICAL_ISSUES_ANALYSIS.md](docs/CRITICAL_ISSUES_ANALYSIS.md#issue-5)
- Test Report: [TEST_COMPLETION_REPORT.md](docs/TEST_COMPLETION_REPORT.md)

---

## Issue 6: 🟢 LOW - Add Shopify Provider Tests

**Labels**: `low`, `testing`, `shopify`, `coverage`

**Title**: 🟢 LOW: Create tests for Shopify provider (currently 0% coverage)

**Body**:
### Problem
No tests exist for Shopify provider despite having a full implementation.

**File**: `lib/agents/providers/shopify-provider.ts` (0 tests)

**Evidence** (from TEST_GAP_ANALYSIS.md:54):
> - [ ] `lib/agents/providers/shopify-provider.ts` - **MEDIUM** Priority
> Status: Not tested

### Impact
- Zero test coverage for Shopify integration
- Can't verify Shopify product search works
- Can't verify Shopify order lookup works
- Risk of breaking Shopify customers with changes
- No confidence in multi-store scenarios

### Current Shopify Implementation
```typescript
// lib/agents/providers/shopify-provider.ts
export class ShopifyProvider {
  async searchProducts(query: string) { ... }
  async lookupOrder(orderId: string) { ... }
  async getProductDetails(productId: string) { ... }
}
```

### Solution

**This issue is BLOCKED by Issue #5** - Must fix WooCommerce provider tests first to establish pattern.

#### Step 1: Wait for WooCommerce Pattern (Issue #5)
Once Issue #5 is complete, we'll have:
- Standard test helper pattern
- Working mock examples
- Documented testing approach

#### Step 2: Create Shopify Test Helpers (1 hour)
```typescript
// test-utils/shopify-test-helpers.ts
import { jest } from '@jest/globals';

export function mockShopifyClient(overrides = {}) {
  return {
    product: {
      list: jest.fn().mockResolvedValue([]),
      get: jest.fn().mockResolvedValue({})
    },
    order: {
      get: jest.fn().mockResolvedValue({})
    },
    ...overrides
  };
}

export function setupShopifyMocks() {
  const mockClient = mockShopifyClient();

  jest.mock('@/lib/shopify/client', () => ({
    getDynamicShopifyClient: jest.fn().mockResolvedValue(mockClient)
  }));

  return mockClient;
}
```

#### Step 3: Write Shopify Provider Tests (3 hours)
```typescript
// __tests__/lib/agents/providers/shopify-provider.test.ts
import { setupShopifyMocks } from '@/test-utils/shopify-test-helpers';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

describe('ShopifyProvider', () => {
  let mockClient: ReturnType<typeof setupShopifyMocks>;

  beforeEach(() => {
    mockClient = setupShopifyMocks();
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      mockClient.product.list.mockResolvedValueOnce([
        { id: 1, title: 'Test Product', price: '29.99' }
      ]);

      const provider = new ShopifyProvider('example.myshopify.com');
      const results = await provider.searchProducts('test');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        title: 'Test Product',
        price: '29.99'
      });
    });

    it('should handle empty search results', async () => {
      mockClient.product.list.mockResolvedValueOnce([]);

      const provider = new ShopifyProvider('example.myshopify.com');
      const results = await provider.searchProducts('nonexistent');

      expect(results).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      mockClient.product.list.mockRejectedValueOnce(
        new Error('Shopify API error')
      );

      const provider = new ShopifyProvider('example.myshopify.com');

      await expect(
        provider.searchProducts('test')
      ).rejects.toThrow('Shopify API error');
    });
  });

  describe('lookupOrder', () => {
    it('should lookup order by ID', async () => {
      mockClient.order.get.mockResolvedValueOnce({
        id: 123,
        name: '#1001',
        total_price: '99.99',
        financial_status: 'paid'
      });

      const provider = new ShopifyProvider('example.myshopify.com');
      const order = await provider.lookupOrder('123');

      expect(order).toMatchObject({
        orderId: '123',
        orderNumber: '#1001',
        total: '99.99',
        status: 'paid'
      });
    });

    it('should return null for non-existent order', async () => {
      mockClient.order.get.mockResolvedValueOnce(null);

      const provider = new ShopifyProvider('example.myshopify.com');
      const order = await provider.lookupOrder('999999');

      expect(order).toBeNull();
    });
  });

  describe('Multi-store support', () => {
    it('should handle multiple Shopify stores', async () => {
      const provider1 = new ShopifyProvider('store1.myshopify.com');
      const provider2 = new ShopifyProvider('store2.myshopify.com');

      // Verify both can be instantiated
      expect(provider1).toBeInstanceOf(ShopifyProvider);
      expect(provider2).toBeInstanceOf(ShopifyProvider);
    });
  });
});
```

#### Test Coverage Goals
- **Product search**: 5 tests (query, empty, pagination, filters, errors)
- **Order lookup**: 4 tests (by ID, by number, not found, errors)
- **Product details**: 3 tests (by ID, variants, errors)
- **Multi-store**: 2 tests (multiple stores, credential switching)
- **Error handling**: 2 tests (network errors, auth errors)

**Total**: ~16 tests (matching WooCommerce provider coverage)

### Acceptance Criteria
- [ ] Issue #5 (WooCommerce tests) completed first
- [ ] Test helpers created in `test-utils/shopify-test-helpers.ts`
- [ ] 16+ Shopify provider tests written
- [ ] All tests passing
- [ ] Coverage for product search, order lookup, error handling
- [ ] Multi-store scenarios tested
- [ ] Documentation updated

### Time Estimate
4 hours (blocked by Issue #5)

### Priority
🟢 **LOW** - Nice to have, not blocking any features

### Dependencies
- **BLOCKED BY**: Issue #5 (WooCommerce Provider Tests)

### References
- Analysis: [CRITICAL_ISSUES_ANALYSIS.md](docs/CRITICAL_ISSUES_ANALYSIS.md#issue-6)
- Test Gap Analysis: [TEST_GAP_ANALYSIS.md](docs/TEST_GAP_ANALYSIS.md)

---

## Issue 7: 🟢 LOW - Remove Brand-Specific Terms from Tests

**Labels**: `low`, `documentation`, `compliance`, `brand-agnostic`

**Title**: 🟢 LOW: Remove industry-specific terms from tests (brand-agnostic violation)

**Body**:
### Problem
CLAUDE.md explicitly prohibits industry-specific terminology like "pumps", but tests contain these terms, violating the brand-agnostic principle.

**File**: `__tests__/lib/agents/domain-agnostic-agent.test.ts:286`

**Evidence**:
```typescript
// Line 286
it('should detect availability query intent', () => {
  const queries = [
    'Do you have any pumps?' // ⚠️ Industry-specific!
  ];
});
```

**CLAUDE.md Violation**:
> ### ABSOLUTELY NO HARDCODING OF:
> - ❌ Industry-specific terminology (e.g., "pumps", "parts", "Cifa products")

### Impact
- Violates brand-agnostic architecture principle
- Sets bad example for developers
- Could leak into production code through copy-paste
- Undermines multi-tenant flexibility

**Why This Matters:**
The system must work equally for:
- E-commerce stores (any product type)
- Restaurants and food services
- Real estate and housing
- Healthcare providers
- Educational institutions
- Service businesses
- ANY other business type

### Solution

**Replace Industry-Specific Terms with Generic Placeholders:**

```typescript
// BEFORE ❌
it('should detect availability query intent', () => {
  const queries = [
    'Do you have any pumps?'  // Industry-specific
  ];
});

// AFTER ✅
it('should detect availability query intent', () => {
  const queries = [
    'Do you have any products?',      // Generic
    'What items are available?',       // Generic
    'Do you have X in stock?',         // Generic with placeholder
    'Are there any [items] left?'      // Generic with placeholder
  ];
});
```

### Files to Update

**Scan entire test suite:**
```bash
# Find all industry-specific terms
grep -r "pumps\|parts\|machinery\|industrial" __tests__/ --line-number

# Expected violations:
# - __tests__/lib/agents/domain-agnostic-agent.test.ts
# - Possibly others
```

### Preventive Measures

**Add ESLint Rule (Optional):**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/pumps|machinery|industrial/i]',
        message: 'Avoid industry-specific terms. Use generic placeholders instead.'
      }
    ]
  }
};
```

**Update CLAUDE.md with Test Examples:**
```markdown
### Brand-Agnostic Testing Examples

✅ **Good Test Data:**
- "products", "items", "services"
- "order #123", "customer account"
- Generic placeholders: [PRODUCT], [CATEGORY]

❌ **Bad Test Data:**
- "pumps", "concrete mixers", "industrial parts"
- "Cifa products", "Acme widgets"
- Any business-specific terminology
```

### Acceptance Criteria
- [ ] All industry-specific terms removed from tests
- [ ] Generic placeholders used instead
- [ ] Documentation updated with testing guidelines
- [ ] Optional: ESLint rule added to prevent future violations
- [ ] Test suite still passes with generic terms

### Time Estimate
1 hour

### Priority
🟢 **LOW** - Cosmetic, doesn't affect functionality

### References
- Analysis: [CRITICAL_ISSUES_ANALYSIS.md](docs/CRITICAL_ISSUES_ANALYSIS.md#issue-7)
- Project Guidelines: [CLAUDE.md](CLAUDE.md) (Brand-Agnostic section)

---

## Issue 8: 🔴 CRITICAL - Fix N+1 Query Problem in Dashboard

**Labels**: `critical`, `performance`, `database`, `optimization`, `n+1`

**Title**: 🔴 CRITICAL: Eliminate N+1 query problem in dashboard (20 sequential queries)

**Body**:
### Problem
Dashboard page executes 20+ sequential database queries on load, causing severe performance degradation and poor user experience.

**Source**: PR #4 description - Database Agent findings

**Evidence**:
```typescript
// Suspected file: app/dashboard/page.tsx or related components
// Pattern likely looks like:

async function DashboardPage() {
  const organizations = await getOrganizations(); // Query 1

  for (const org of organizations) {
    const configs = await getConfigs(org.id);     // Query 2-N
    const stats = await getStats(org.id);         // Query N+1-2N
  }

  // Result: 1 + (N * 2) queries instead of 3 queries total
}
```

### Impact
**Performance:**
- 20 sequential queries = ~20 * 50ms = 1000ms (1 second) minimum
- Blocks rendering until all queries complete
- Scales linearly with number of organizations
- Poor user experience (slow page load)

**Database Load:**
- 20x more database connections
- Increased latency for all users
- Potential connection pool exhaustion

**Cost:**
- Higher Supabase costs (queries billed)
- More CPU usage on database

### Root Cause
Classic N+1 query antipattern:
1. Fetch parent records (1 query)
2. For each parent, fetch related records (N queries)

### Solution

#### Option 1: Use SQL JOINs (Recommended)
```typescript
// BEFORE ❌ - N+1 queries
async function getDashboardData(userId: string) {
  const orgs = await supabase
    .from('organizations')
    .select('*')
    .eq('user_id', userId);  // Query 1

  for (const org of orgs.data) {
    const configs = await supabase
      .from('customer_configs')
      .select('*')
      .eq('organization_id', org.id);  // Query 2, 3, 4...

    const stats = await supabase
      .from('organization_stats')
      .select('*')
      .eq('organization_id', org.id);  // Query 11, 12, 13...
  }
}

// AFTER ✅ - Single query with JOINs
async function getDashboardData(userId: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      customer_configs (*),
      organization_stats (*)
    `)
    .eq('user_id', userId);

  // 1 query returns everything!
  return data;
}
```

#### Option 2: Parallel Fetching
```typescript
// If JOINs aren't possible, at least parallelize
async function getDashboardData(userId: string) {
  const orgs = await getOrganizations(userId);

  // Parallel instead of sequential
  const [configs, stats] = await Promise.all([
    Promise.all(orgs.map(org => getConfigs(org.id))),
    Promise.all(orgs.map(org => getStats(org.id)))
  ]);

  // Reduced from 1000ms to ~100ms (parallelized)
}
```

#### Option 3: Batch Query with IN clause
```typescript
// Fetch all related records in one query
async function getDashboardData(userId: string) {
  const orgs = await getOrganizations(userId);
  const orgIds = orgs.map(o => o.id);

  // 2 queries instead of 20
  const [configs, stats] = await Promise.all([
    supabase
      .from('customer_configs')
      .select('*')
      .in('organization_id', orgIds),
    supabase
      .from('organization_stats')
      .select('*')
      .in('organization_id', orgIds)
  ]);

  // Merge results client-side
}
```

### Implementation Steps

**Step 1: Identify Exact Location (1 hour)**
```bash
# Find dashboard data fetching code
grep -r "getOrganizations\|from('organizations')" app/dashboard/ -A 10

# Look for loops with await inside
grep -r "for.*await\|map.*await" app/dashboard/ -B 5 -A 10

# Check API routes
grep -r "from('customer_configs')" app/api/ -A 5
```

**Step 2: Add Query Logging (30 minutes)**
```typescript
// lib/supabase/monitoring.ts
export function logQuery(table: string, operation: string) {
  console.log(`[Query] ${operation} on ${table}`);
  performance.mark(`query-${table}-${operation}-start`);
}

// Use in dashboard to verify count
```

**Step 3: Refactor to Use JOINs (2 hours)**
```typescript
// lib/dashboard-data.ts (NEW FILE)
export async function getDashboardData(userId: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      created_at,
      customer_configs (
        id,
        domain,
        config,
        is_active
      ),
      conversations:conversations(count),
      messages:messages(count)
    `)
    .eq('user_id', userId);

  if (error) throw error;

  // Transform to expected shape
  return data.map(org => ({
    ...org,
    totalConversations: org.conversations[0].count,
    totalMessages: org.messages[0].count
  }));
}
```

**Step 4: Update Dashboard Page (1 hour)**
```typescript
// app/dashboard/page.tsx
import { getDashboardData } from '@/lib/dashboard-data';

export default async function DashboardPage() {
  const user = await getUser();

  // Single optimized query
  const data = await getDashboardData(user.id);

  return <DashboardView data={data} />;
}
```

**Step 5: Verify Performance (30 minutes)**
```bash
# Check query count in logs
# Before: Should see 20+ query logs
# After: Should see 1 query log

# Measure load time
# Before: ~1000ms
# After: ~50-100ms (10x improvement)
```

### Acceptance Criteria
- [ ] Dashboard loads with ≤3 database queries (down from 20+)
- [ ] Query logging shows reduction verified
- [ ] Page load time improved by 80%+
- [ ] All dashboard data still displays correctly
- [ ] Tests updated and passing
- [ ] Performance metrics documented

### Performance Goals
- **Query Count**: 20+ → 1-3 queries
- **Load Time**: ~1000ms → ~100ms
- **Database Load**: 95% reduction
- **User Experience**: "Feels instant"

### Time Estimate
5 hours

### Priority
🔴 **CRITICAL** - Severe performance issue affecting all users

### References
- Source: PR #4 Database Agent findings
- Pattern: [N+1 Query Problem](https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem)
- Supabase Docs: [Nested Queries](https://supabase.com/docs/guides/database/joins-and-nested-tables)

---

## Issue 9: 🔴 CRITICAL - Secure Debug Endpoints

**Labels**: `critical`, `security`, `authentication`, `endpoints`

**Title**: 🔴 CRITICAL: Add authentication to exposed debug endpoints

**Body**:
### Problem
Debug endpoints are exposed in production without any authentication, allowing anyone to access sensitive system information.

**Source**: PR #4 description - Security Agent findings

**Evidence**:
```typescript
// Suspected pattern in app/api/debug/ or similar
export async function GET(request: Request) {
  // ❌ NO AUTHENTICATION CHECK!

  const debugInfo = {
    database: await getDbStats(),
    cache: await getCacheStats(),
    errors: await getRecentErrors(),
    config: process.env // ⚠️ Leaking env vars?
  };

  return Response.json(debugInfo);
}
```

### Security Impact
**CRITICAL** - Attackers could access:
- Database statistics and table names
- Cache contents (potentially PII)
- Recent error messages (stack traces, file paths)
- Environment configuration
- System performance metrics
- Customer data patterns

**Real-World Risk:**
```bash
# Anyone can access these endpoints:
curl https://your-app.com/api/debug
curl https://your-app.com/api/debug/errors
curl https://your-app.com/api/debug/cache

# Could expose:
# - User counts per organization
# - Error messages with sensitive data
# - Internal system architecture
# - API keys if logged in errors
```

### Solution

#### Option 1: Remove from Production (Recommended)
```typescript
// app/api/debug/route.ts
export async function GET(request: Request) {
  // Only available in development
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }

  // Debug logic here (dev only)
}
```

#### Option 2: Require Admin Authentication
```typescript
// app/api/debug/route.ts
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth/permissions';

export async function GET(request: Request) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check admin permission
  if (!await isAdmin(user.id)) {
    return Response.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  // Debug logic here (authenticated admins only)
}
```

#### Option 3: Use API Key
```typescript
// app/api/debug/route.ts
export async function GET(request: Request) {
  const apiKey = request.headers.get('x-debug-key');

  if (apiKey !== process.env.DEBUG_API_KEY) {
    return Response.json(
      { error: 'Invalid or missing API key' },
      { status: 401 }
    );
  }

  // Debug logic here (with valid key)
}
```

### Implementation Steps

**Step 1: Find All Debug Endpoints (1 hour)**
```bash
# Search for debug endpoints
find app/api -name "*debug*" -o -name "*test*" -o -name "*dev*"

# Look for endpoints with sensitive data
grep -r "process.env\|getDbStats\|getErrors" app/api/ -l

# Expected findings:
# - app/api/debug/
# - app/api/test/
# - Any /dev/ routes
```

**Step 2: Audit Each Endpoint (1 hour)**
Create spreadsheet:
| Endpoint | Authentication | Data Exposed | Risk Level | Action |
|----------|---------------|--------------|------------|--------|
| /api/debug | ❌ None | DB stats | 🔴 High | Add auth or remove |
| /api/debug/errors | ❌ None | Stack traces | 🔴 High | Add auth or remove |
| /api/test | ❌ None | Test data | 🟡 Medium | Remove from prod |

**Step 3: Implement Fix (2 hours)**

**For Production:** Remove or restrict
```typescript
// app/api/debug/route.ts
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 });
  }

  // Development-only debug info
  return Response.json({ ... });
}
```

**For Admin Tools:** Add authentication
```typescript
// lib/auth/admin-middleware.ts
export async function requireAdmin(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (adminRole?.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

// Usage in debug endpoints
export async function GET(request: Request) {
  await requireAdmin(request);
  // ... debug logic
}
```

**Step 4: Add Rate Limiting (30 minutes)**
```typescript
// Even with auth, rate limit debug endpoints
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  // Rate limit: 10 requests per minute
  const rateLimit = checkRateLimit('debug-api', 10, 60000);

  if (!rateLimit.success) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  await requireAdmin(request);
  // ... debug logic
}
```

**Step 5: Add Logging (30 minutes)**
```typescript
// Log all debug endpoint access
export async function GET(request: Request) {
  const user = await requireAdmin(request);

  // Log admin access
  await supabase
    .from('admin_audit_log')
    .insert({
      user_id: user.id,
      action: 'debug_api_access',
      endpoint: '/api/debug',
      ip_address: request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString()
    });

  // ... debug logic
}
```

### Security Checklist
- [ ] All debug endpoints identified
- [ ] Authentication added or endpoints removed from production
- [ ] Admin role checking implemented
- [ ] Rate limiting applied
- [ ] Access logging implemented
- [ ] No sensitive data in responses (env vars, keys, passwords)
- [ ] Security review completed
- [ ] Penetration test performed

### Acceptance Criteria
- [ ] No unauthenticated debug endpoints in production
- [ ] All debug endpoints require admin role or are disabled
- [ ] Rate limiting applied (10 req/min per user)
- [ ] All access logged to audit trail
- [ ] Environment variables not exposed in responses
- [ ] Security documentation updated

### Time Estimate
5-6 hours

### Priority
🔴 **IMMEDIATE** - Active security vulnerability

### References
- Source: PR #4 Security Agent findings
- OWASP: [Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

---

## Issue 10: 🔴 CRITICAL - Fix Customer Config API Authentication Bypass

**Labels**: `critical`, `security`, `authentication`, `RLS`, `bypass`

**Title**: 🔴 CRITICAL: Fix customer config API authentication bypass vulnerability

**Body**:
### Problem
Customer configuration API endpoint has an authentication bypass allowing unauthorized access to sensitive customer data including API keys and credentials.

**Source**: PR #4 description - Security Agent findings

**Evidence**:
```typescript
// Suspected file: app/api/customer-config/route.ts or similar
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  // ❌ NO AUTHENTICATION CHECK!
  // ❌ Uses service role client (bypasses RLS)

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('customer_configs')
    .select('*')  // ⚠️ Returns ALL fields including credentials
    .eq('domain', domain)
    .single();

  return Response.json(data);
}
```

### Security Impact
**CRITICAL** - Attackers could:
1. Access ANY customer's configuration by domain name
2. Steal encrypted WooCommerce/Shopify credentials
3. Access API keys and secrets
4. View business information and settings
5. Enumerate all customer domains
6. Bypass organization isolation

**Attack Scenario:**
```bash
# Attacker can access any customer's config
curl "https://your-app.com/api/customer-config?domain=victim.com"

# Response includes:
{
  "id": "...",
  "organization_id": "...",
  "domain": "victim.com",
  "woocommerce_credentials": "encrypted_but_still_leaked",
  "shopify_credentials": "encrypted_but_still_leaked",
  "api_keys": { ... },
  "business_info": { ... }
}
```

### Root Cause
1. **No authentication check** - Anyone can call the endpoint
2. **Service role client** - Bypasses Row Level Security
3. **Over-permissive SELECT** - Returns sensitive fields
4. **No organization validation** - Doesn't verify user owns the config

### Solution

#### Step 1: Add Authentication (Required)
```typescript
// app/api/customer-config/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Use client with RLS, not service role
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // ... continue with authenticated logic
}
```

#### Step 2: Verify Organization Ownership
```typescript
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  // Verify user owns this customer config through organization
  const { data: config, error } = await supabase
    .from('customer_configs')
    .select(`
      *,
      organization:organizations!inner(
        id,
        members:organization_members!inner(user_id)
      )
    `)
    .eq('domain', domain)
    .eq('organization.members.user_id', user.id)
    .single();

  if (error || !config) {
    return Response.json(
      { error: 'Not found or access denied' },
      { status: 403 }
    );
  }

  // User owns this config via organization membership
  return Response.json(config);
}
```

#### Step 3: Limit Exposed Fields
```typescript
// Don't return sensitive fields in GET requests
const { data: config } = await supabase
  .from('customer_configs')
  .select(`
    id,
    domain,
    config,
    is_active,
    created_at,
    updated_at
    // ❌ DO NOT include:
    // woocommerce_credentials
    // shopify_credentials
    // api_keys
  `)
  .eq('domain', domain)
  .single();

// Sensitive fields only returned via separate authenticated endpoint
```

#### Step 4: Add RLS Policies
```sql
-- Ensure RLS is enabled
ALTER TABLE customer_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access configs for their organizations
CREATE POLICY "Users can access own organization configs"
  ON customer_configs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Only organization admins can update
CREATE POLICY "Admins can update organization configs"
  ON customer_configs
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );
```

### Implementation Steps

**Step 1: Find All Customer Config Endpoints (1 hour)**
```bash
# Find customer config endpoints
grep -r "customer-config\|customer_configs" app/api/ -l

# Expected files:
# - app/api/customer-config/route.ts
# - app/api/config/route.ts
# - Any other config access points
```

**Step 2: Audit Authentication (1 hour)**
For each endpoint, check:
- [ ] Uses `createClient()` (with RLS), not service role
- [ ] Verifies `auth.getUser()` returns valid user
- [ ] Validates organization ownership
- [ ] Limits exposed fields
- [ ] Has proper error handling

**Step 3: Implement RLS Policies (1 hour)**
```sql
-- Migration: 20251028_fix_customer_config_rls.sql

-- Enable RLS
ALTER TABLE customer_configs ENABLE ROW LEVEL SECURITY;

-- Drop any permissive policies
DROP POLICY IF EXISTS "Public read access" ON customer_configs;

-- Create secure policies
CREATE POLICY "Members can view own org configs"
  ON customer_configs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can modify own org configs"
  ON customer_configs
  FOR ALL
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
    )
  );

-- Verify policies work
-- This should fail for users not in org:
SELECT * FROM customer_configs WHERE organization_id = 'other-org';
```

**Step 4: Update API Endpoints (2 hours)**
```typescript
// app/api/customer-config/route.ts (FIXED)
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const GetConfigSchema = z.object({
  domain: z.string().min(1)
});

export async function GET(request: Request) {
  try {
    // Use RLS-enabled client
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const { searchParams } = new URL(request.url);
    const params = GetConfigSchema.parse({
      domain: searchParams.get('domain')
    });

    // Query with RLS (automatically filters by user's orgs)
    const { data: config, error } = await supabase
      .from('customer_configs')
      .select('id, domain, config, is_active, created_at, updated_at')
      .eq('domain', params.domain)
      .single();

    if (error) {
      // RLS will cause error if user doesn't have access
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json(config);

  } catch (error) {
    console.error('[API] Customer config error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 5: Add Tests (2 hours)**
```typescript
// __tests__/api/customer-config/route.test.ts
describe('Customer Config API', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await GET(new Request('http://test.com/api/customer-config?domain=test.com'));
    expect(response.status).toBe(401);
  });

  it('should reject access to other org configs', async () => {
    // User from org A tries to access org B's config
    // Should fail due to RLS
  });

  it('should allow access to own org configs', async () => {
    // User from org A accesses org A's config
    // Should succeed
  });

  it('should not expose sensitive fields', async () => {
    const response = await GET(authenticatedRequest);
    const data = await response.json();

    expect(data).not.toHaveProperty('woocommerce_credentials');
    expect(data).not.toHaveProperty('shopify_credentials');
  });
});
```

### Security Checklist
- [ ] All customer config endpoints use `createClient()` (RLS-enabled)
- [ ] Authentication verified on all routes
- [ ] Organization ownership validated
- [ ] RLS policies created and tested
- [ ] Sensitive fields not exposed in GET responses
- [ ] Separate endpoint for credential access (with extra auth)
- [ ] Tests verify unauthorized access fails
- [ ] Audit log for config access

### Acceptance Criteria
- [ ] No endpoints use service role client for customer configs
- [ ] All endpoints verify user authentication
- [ ] RLS policies enforce organization isolation
- [ ] Sensitive fields only accessible via authenticated endpoints
- [ ] Tests verify cross-org access is blocked
- [ ] Security review passed
- [ ] Penetration test performed

### Time Estimate
7-8 hours

### Priority
🔴 **IMMEDIATE** - Active authentication bypass vulnerability

### References
- Source: PR #4 Security Agent findings
- Related: Issue #1 (RLS Testing)
- OWASP: [Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

---

## Issue 11: 🟠 HIGH - Clean Up Unused Database Tables

**Labels**: `high`, `database`, `cleanup`, `technical-debt`, `maintenance`

**Title**: 🟠 HIGH: Remove 16 unused database tables (67% of schema)

**Body**:
### Problem
Database contains 24 tables but only 8 (33%) are actively used. 16 unused tables represent over-engineered infrastructure for unimplemented features.

**Source**: [DATABASE_ANALYSIS_REPORT.md](docs/reports/DATABASE_ANALYSIS_REPORT.md)

**Evidence**:
```
Total Tables: 24
Active Tables: 8 (33%)
Unused Tables: 16 (67%)
Total Rows: 20,867 (all in 8 active tables)
```

### Impact
**Technical Debt:**
- Confusing schema for developers
- Maintenance burden (migrations, backups, monitoring)
- Deployment complexity
- Misleading documentation

**Developer Confusion:**
- "Should I use `businesses` or `customer_configs`?"
- "Is `chat_sessions` the same as `conversations`?"
- Wasted time understanding unused tables

### Unused Tables (16 Total)

#### Duplicate Tables (Should Be Removed)
1. **chat_sessions** - Duplicate of `conversations`
2. **chat_messages** - Duplicate of `messages`

#### Planned Features Not Implemented
**Multi-tenancy (Alternative design):**
3. **customers** - Alternative to `customer_configs`
4. **businesses** - Alternative organization structure
5. **business_configs** - Duplicate of `customer_configs`
6. **business_usage** - Usage tracking (not implemented)

**Privacy/GDPR (Not implemented):**
7. **privacy_requests** - GDPR request tracking
8. **customer_verifications** - Identity verification
9. **customer_access_logs** - Access audit trail

**Content Management (Not implemented):**
10. **content_refresh_jobs** - Content update scheduling
11. **content_hashes** - Deduplication
12. **page_content_references** - Cross-references

**AI Enhancement (Not implemented):**
13. **training_data** - Custom AI training
14. **ai_optimized_content** - Preprocessed content
15. **domain_patterns** - Pattern recognition

**Performance (Not implemented):**
16. **customer_data_cache** - Application-level cache

### Active Tables (Keep These)
✅ **Core System (8 tables):**
1. **customer_configs** - Customer settings (2 rows)
2. **domains** - Website tracking (3 rows)
3. **scraped_pages** - Raw content (4,459 rows)
4. **page_embeddings** - Vector search (13,054 rows)
5. **structured_extractions** - AI extractions (34 rows)
6. **conversations** - Chat sessions (871 rows)
7. **messages** - Chat messages (2,441 rows)
8. **website_content** - Processed content (3 rows)

### Solution

#### Phase 1: Analysis (1 hour)
```bash
# Verify zero rows in all unused tables
npx tsx scripts/verify-unused-tables.ts

# Check for code references
grep -r "chat_sessions\|businesses\|privacy_requests" . --exclude-dir=node_modules

# Expected: Only documentation and migration files
```

#### Phase 2: Remove Duplicate Tables (1 hour)
```sql
-- Migration: 20251028_remove_duplicate_tables.sql

-- Verify tables are empty
SELECT COUNT(*) FROM chat_sessions; -- Should be 0
SELECT COUNT(*) FROM chat_messages; -- Should be 0

-- Drop duplicate tables
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Update code references (if any)
-- Replace with: conversations, messages
```

#### Phase 3: Document Architectural Decision (1 hour)
```markdown
# docs/ARCHITECTURE_DECISIONS.md

## AD-003: Remove Unused Table Infrastructure

**Date**: 2025-10-28
**Status**: Approved

### Context
Database contained 16 unused tables (67% of schema) for unimplemented features.

### Decision
Remove all unused tables. Implement features when needed, not speculatively.

### Consequences
**Positive:**
- Simpler schema (8 tables vs 24)
- Clearer documentation
- Faster migrations
- Less maintenance

**Negative:**
- Need to recreate if features implemented
- Migration history shows dropped tables

### Implementation Status
✅ Duplicate tables removed (chat_sessions, chat_messages)
⏸️ Feature tables documented for future reference
```

#### Phase 4: Optional - Remove Planned Feature Tables (2 hours)
```sql
-- Migration: 20251028_remove_unimplemented_feature_tables.sql
-- ⚠️ OPTIONAL - Only if team agrees these features won't be built

-- Multi-tenancy alternative design (using organizations instead)
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS business_configs CASCADE;
DROP TABLE IF EXISTS business_usage CASCADE;

-- Privacy/GDPR (implement when needed)
DROP TABLE IF EXISTS privacy_requests CASCADE;
DROP TABLE IF EXISTS customer_verifications CASCADE;
DROP TABLE IF EXISTS customer_access_logs CASCADE;

-- Content management (not needed currently)
DROP TABLE IF EXISTS content_refresh_jobs CASCADE;
DROP TABLE IF EXISTS content_hashes CASCADE;
DROP TABLE IF EXISTS page_content_references CASCADE;

-- AI enhancement (using embeddings table instead)
DROP TABLE IF EXISTS training_data CASCADE;
DROP TABLE IF EXISTS ai_optimized_content CASCADE;
DROP TABLE IF EXISTS domain_patterns CASCADE;

-- Performance (using Redis instead)
DROP TABLE IF EXISTS customer_data_cache CASCADE;
```

#### Phase 5: Update Documentation (1 hour)
```bash
# Update schema documentation
npx tsx scripts/generate-schema-docs.ts

# Update CLAUDE.md with simplified schema
# Remove references to unused tables

# Create reference doc for future features
docs/FUTURE_FEATURES.md
```

### Decision Criteria

**Remove immediately (Phase 2):**
- ✅ Duplicate tables with different names
- ✅ Zero rows
- ✅ No code references

**Remove optionally (Phase 4):**
- ⚠️ Planned features with no timeline
- ⚠️ Alternative designs exist
- ⚠️ Team consensus required

**Keep for now:**
- ❌ Tables with data
- ❌ Tables with code references
- ❌ Features in active development

### Acceptance Criteria
- [ ] All duplicate tables removed (chat_sessions, chat_messages)
- [ ] Code references updated (if any)
- [ ] Documentation reflects actual schema (8 tables)
- [ ] Architecture decision documented
- [ ] Team consensus on Phase 4 (optional removal)
- [ ] Migration tested on staging
- [ ] Backup created before production deployment

### Time Estimate
**Phase 1-3 (Required)**: 3 hours
**Phase 4 (Optional)**: 2 hours
**Total**: 3-5 hours

### Priority
🟠 **HIGH** - Reduces complexity and confusion

### References
- Analysis: [DATABASE_ANALYSIS_REPORT.md](docs/reports/DATABASE_ANALYSIS_REPORT.md)
- Current Schema: [SUPABASE_SCHEMA.md](docs/SUPABASE_SCHEMA.md)

---

## Issue 12: 🟠 HIGH - Create Missing Tables Referenced in Code

**Labels**: `high`, `database`, `bug`, `schema`, `missing-tables`

**Title**: 🟠 HIGH: Create 5 missing tables referenced in code (scrape_jobs, query_cache, etc.)

**Body**:
### Problem
Code references 5 tables that don't exist in the database, causing runtime errors when those code paths are executed.

**Source**: [DATABASE_ANALYSIS_REPORT.md](docs/reports/DATABASE_ANALYSIS_REPORT.md)

**Evidence**:
```
Non-Existent Tables Referenced in Code:
- scrape_jobs: 16 references
- query_cache: 7 references
- error_logs: 3 references
- scraper_configs: 2 references
- scraped_content: 2 references
```

### Impact
**Runtime Errors:**
```typescript
// Code tries to query non-existent table
const { data, error } = await supabase
  .from('scrape_jobs')  // ❌ Table doesn't exist!
  .select('*');

// Result: Database error thrown
// Error: relation "public.scrape_jobs" does not exist
```

**Features Broken:**
- Background scraping jobs fail
- Query result caching doesn't work
- Error logging fails
- Scraper configuration ignored

### Missing Tables

#### 1. scrape_jobs (16 references) - HIGH PRIORITY
**Purpose**: Background job queue for web scraping

**Code References**:
- `lib/crawler-config.ts` - Job creation
- `lib/scraping-queue.ts` - Job processing
- `app/api/scrape/route.ts` - Job status
- Tests: `__tests__/lib/crawler-config.test.ts`

**Proposed Schema**:
```sql
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  priority INTEGER DEFAULT 0,
  max_pages INTEGER DEFAULT 50,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  pages_scraped INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scrape_jobs_org ON scrape_jobs(organization_id);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_domain ON scrape_jobs(domain);
```

#### 2. query_cache (7 references) - MEDIUM PRIORITY
**Purpose**: Cache query results for performance

**Code References**:
- `lib/embeddings.ts` - Cache lookups
- `app/api/chat/route.ts` - Result caching
- Tests: `__tests__/lib/embeddings.test.ts`

**Proposed Schema**:
```sql
CREATE TABLE query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_hash TEXT NOT NULL, -- MD5 hash for quick lookup
  results JSONB NOT NULL,
  hit_count INTEGER DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_query_cache_hash ON query_cache(query_hash);
CREATE INDEX idx_query_cache_org ON query_cache(organization_id);
CREATE INDEX idx_query_cache_expires ON query_cache(expires_at);
```

#### 3. error_logs (3 references) - LOW PRIORITY
**Purpose**: Error tracking and debugging

**Code References**:
- `lib/error-handler.ts` - Error logging
- `app/api/debug/errors/route.ts` - Error retrieval

**Proposed Schema**:
```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB, -- Additional error context
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT,
  request_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_error_logs_org ON error_logs(organization_id);
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
```

#### 4. scraper_configs (2 references) - LOW PRIORITY
**Purpose**: Per-domain scraper configuration

**Code References**:
- `lib/crawler-config.ts` - Config loading

**Alternative**: Use `customer_configs.config` JSONB field instead

**Decision Needed**: Create table or refactor code to use existing `customer_configs`?

#### 5. scraped_content (2 references) - LOW PRIORITY
**Purpose**: Alternative to `scraped_pages` table

**Code References**:
- Legacy code in `lib/content-extractor.ts`

**Decision Needed**: This appears to be a duplicate of `scraped_pages`. Refactor code to use `scraped_pages` instead.

### Solution

#### Phase 1: Analysis (1 hour)
```bash
# Find exact code locations
grep -r "from('scrape_jobs')" . -n
grep -r "from('query_cache')" . -n
grep -r "from('error_logs')" . -n
grep -r "from('scraper_configs')" . -n
grep -r "from('scraped_content')" . -n

# Analyze each reference
npx tsx scripts/analyze-missing-tables.ts
```

#### Phase 2: Create High-Priority Tables (2 hours)
```sql
-- Migration: 20251028_create_scrape_jobs.sql
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  max_pages INTEGER DEFAULT 50,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  pages_scraped INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scrape_jobs_org ON scrape_jobs(organization_id);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_domain ON scrape_jobs(domain);
CREATE INDEX idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own org jobs"
  ON scrape_jobs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own org jobs"
  ON scrape_jobs
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

```sql
-- Migration: 20251028_create_query_cache.sql
CREATE TABLE query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  results JSONB NOT NULL,
  hit_count INTEGER DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_query_cache_hash_org ON query_cache(query_hash, organization_id);
CREATE INDEX idx_query_cache_org ON query_cache(organization_id);
CREATE INDEX idx_query_cache_expires ON query_cache(expires_at);

-- Enable RLS
ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can access own org cache"
  ON query_cache
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

#### Phase 3: Refactor or Create Low-Priority Tables (2 hours)

**Option A: Create error_logs table**
```sql
-- Migration: 20251028_create_error_logs.sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT,
  request_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_error_logs_org ON error_logs(organization_id);
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
```

**Option B: Refactor scraper_configs** (RECOMMENDED)
```typescript
// Instead of separate table, use customer_configs
const { data: config } = await supabase
  .from('customer_configs')
  .select('config')
  .eq('domain', domain)
  .single();

// config.scraper_settings = { maxPages, timeout, ... }
```

**Option C: Refactor scraped_content** (RECOMMENDED)
```typescript
// Replace scraped_content references with scraped_pages
// Old code:
.from('scraped_content')

// New code:
.from('scraped_pages')
```

#### Phase 4: Update Code (2 hours)
```typescript
// Verify all code works with new tables
npm test

// Check for runtime errors
npm run dev
// Test scraping, caching, error logging
```

#### Phase 5: Documentation (1 hour)
```bash
# Update schema docs
npx tsx scripts/generate-schema-docs.ts

# Update CLAUDE.md with new tables
# Document table purposes and usage
```

### Acceptance Criteria
- [ ] `scrape_jobs` table created with RLS
- [ ] `query_cache` table created with RLS
- [ ] Decision made on `error_logs` (create or use external service)
- [ ] `scraper_configs` refactored to use `customer_configs`
- [ ] `scraped_content` refactored to use `scraped_pages`
- [ ] All code references updated
- [ ] Tests passing
- [ ] No runtime errors from missing tables
- [ ] Documentation updated

### Time Estimate
7-8 hours

### Priority
🟠 **HIGH** - Blocking features and causing runtime errors

### References
- Analysis: [DATABASE_ANALYSIS_REPORT.md](docs/reports/DATABASE_ANALYSIS_REPORT.md)
- Schema Docs: [SUPABASE_SCHEMA.md](docs/SUPABASE_SCHEMA.md)

---

## Summary

### Issue Breakdown
**By Priority:**
- 🔴 **CRITICAL** (5): Issues #1, #2, #8, #9, #10
- 🟠 **HIGH** (4): Issues #3, #11, #12
- 🟡 **MEDIUM** (2): Issues #4, #5
- 🟢 **LOW** (2): Issues #6, #7

**By Category:**
- **Security** (4): Issues #1, #9, #10, #2
- **Database** (4): Issues #2, #8, #11, #12
- **Testing** (3): Issues #1, #5, #6
- **Architecture** (3): Issues #2, #3, #11
- **Performance** (2): Issues #4, #8
- **Refactoring** (2): Issues #3, #5
- **Documentation** (1): Issue #7

### Recommended Execution Order
1. **Week 1 - Critical Security**
   - Issue #1: RLS Testing (2 days)
   - Issue #10: Customer Config Auth Bypass (1.5 days)
   - Issue #9: Debug Endpoints (1 day)
   - Issue #2: customer_id Migration (1.5 days)

2. **Week 2 - Architecture & Performance**
   - Issue #8: N+1 Query Fix (1 day)
   - Issue #3: Supabase Client Standardization (1.5 days)
   - Issue #12: Missing Tables (1.5 days)
   - Issue #11: Unused Tables Cleanup (0.5 days)

3. **Week 3 - Testing & Polish**
   - Issue #4: Rate Limit Cleanup (0.5 days)
   - Issue #5: WooCommerce Tests (1 day)
   - Issue #6: Shopify Tests (0.5 days)
   - Issue #7: Brand-Agnostic Cleanup (0.5 days)

**Total Estimated Time**: ~14-16 developer-days (3 weeks for 1 developer)

### Dependencies
- Issue #5 blocked by Issue #3
- Issue #6 blocked by Issue #5

---

**Document Status**: Ready for GitHub issue creation
**Next Step**: Create 12 individual GitHub issues from these templates
