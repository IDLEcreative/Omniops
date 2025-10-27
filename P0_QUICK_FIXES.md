# P0 Quick Fixes - Integration Test Blockers

**Date**: 2025-10-27
**Purpose**: Document immediate fixes needed to unblock 21/32 tests

---

## Fix 1: Supabase Client Configuration (Blocks 5 tests)

**File**: `__tests__/integration/agent-flow-e2e.test.ts`

**Issue**: Using raw `createClient` instead of `createServiceRoleClient()` helper

**Current Code** (lines 30-43):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
```

**Fixed Code**:
```typescript
import { createClient } from '@supabase/supabase-js';

// Helper to get service role client
async function getSupabaseClient() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      },
    }
  );
  return supabase;
}
```

Then update `createTestConfig`:
```typescript
async function createTestConfig(testName: string, extraFields: Record<string, any> = {}) {
  const testDomain = `test-${testName}-${Date.now()}.example.com`;
  const supabase = await getSupabaseClient(); // Get client here

  const { data: customerConfig, error: configError} = await supabase
    .from('customer_configs')
    .insert({
      domain: testDomain,
      display_name: `${testName} Test`,
      ...extraFields
    })
    .select()
    .single();

  return { customerConfig, configError, testDomain, supabase };
}
```

**Why This Works**:
- Service role key needs to be in both `apikey` and `Authorization` headers
- This bypasses RLS completely
- Compatible with existing test structure

---

## Fix 2: Missing Helper Function (Blocks 5 tests)

**File**: `__tests__/integration/agent-flow-e2e.test.ts`

**Issue**: Tests call `createTestOrganizationAndConfig()` which doesn't exist (lines 386, 490, 592, 639)

**Add This Helper** (after `createTestConfig` function):
```typescript
async function createTestOrganizationAndConfig(
  testName: string,
  extraFields: Record<string, any> = {}
) {
  const supabase = await getSupabaseClient();
  const testDomain = `test-${testName}-${Date.now()}.example.com`;

  // Create test organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: `Test Org - ${testName}`,
      slug: `test-org-${testName}-${Date.now()}`
    })
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(`Failed to create test organization: ${JSON.stringify(orgError)}`);
  }

  // Create customer config
  const { data: customerConfig, error: configError } = await supabase
    .from('customer_configs')
    .insert({
      domain: testDomain,
      display_name: `${testName} Test`,
      organization_id: org.id,
      ...extraFields
    })
    .select()
    .single();

  return { org, customerConfig, configError, testDomain, supabase };
}
```

---

## Fix 3: API 500 Errors (Blocks 11 tests)

**Investigation Steps**:

1. **Check server logs**:
```bash
# If using Docker
docker-compose logs -f app --tail=100 | grep -i "error\|500"

# If running locally
npm run dev 2>&1 | grep -i "error"
```

2. **Test minimal request**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test",
    "domain": "thompsonseparts.co.uk"
  }' | jq
```

3. **Check environment variables**:
```bash
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:20}..."
echo "NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
```

4. **Common Causes**:
- OpenAI API key invalid or rate limited
- Supabase URL misconfigured
- Missing environment variables in test environment
- Port 3000 not running (`lsof -i :3000`)

---

## Implementation Order

1. **Fix 1 + Fix 2** (30 minutes)
   - Apply Supabase client fix
   - Add missing helper function
   - Test: Run Agent 1 & 2 tests
   - Expected: 10/32 tests now passing

2. **Fix 3** (1-2 hours)
   - Investigate API 500 errors
   - Fix root cause
   - Test: Run Agent 4 & 6 tests
   - Expected: 21/32 tests now passing

3. **Agent 3 Fixes** (2-4 hours)
   - Fix 4 failing tests with 400 errors
   - Expected: 25/32 tests passing

4. **Accuracy Fix** (2-3 days)
   - Enhance system prompt for metadata usage
   - Test: Re-run Test 9
   - Expected: 86%+ accuracy, 26/32 tests passing

---

## Quick Test Command

After applying fixes:
```bash
# Test Agent 1 tests (should now work)
npm test -- __tests__/integration/agent-flow-e2e.test.ts -t "Product Search Flow"

# Test Agent 2 tests (should now work)
npm test -- __tests__/integration/agent-flow-e2e.test.ts -t "Metadata Tracking|Commerce Provider"

# Full suite
npm test -- __tests__/integration/agent-flow-e2e.test.ts --verbose
```

---

## Success Criteria

**After Fix 1 + Fix 2**:
- ✅ `createTestConfig()` returns valid config
- ✅ Tests 1-5 pass (Agent 1)
- ✅ Tests 6-10 pass (Agent 2)
- ✅ No more "Failed to create test config" errors

**After Fix 3**:
- ✅ API returns 200 OK for chat requests
- ✅ Tests 1-7 pass (Agent 4)
- ✅ Tests 14-17 pass (Agent 6)
- ✅ No more 500 errors

**Total Expected**: 21/32 tests passing (66%) after all P0 fixes
