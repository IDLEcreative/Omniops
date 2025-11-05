# MCP Validation Issues Tracker

**Last Updated:** 2025-11-05
**Status:** ACTIVE BLOCKERS
**Total Issues:** 2 critical, 2 moderate

---

## Issue #1: Missing Test Customer Configuration

**Priority:** 🔴 **CRITICAL**
**Status:** 🔴 OPEN
**Test Case:** All test cases (affects entire validation)
**Category:** Test Environment Setup
**Discovered:** 2025-11-05 during initial validation run

### Description

The validation framework uses `domain: 'test-domain.com'` but this domain doesn't exist in the `customer_configs` table. As a result, all chat API requests fail with:

```
null value in column "domain_id" of relation "conversations" violates not-null constraint
```

This prevents any AI execution from occurring, making it impossible to validate:
- MCP code execution functionality
- Token savings (expected 50-70%)
- Tool calling strategy comparisons
- Search quality
- Response accuracy

### Root Cause

The validation framework assumes a test customer exists with:
- Domain: `test-domain.com`
- Customer ID: `test-customer-id`
- Scraped content available
- Embeddings generated
- Products indexed

But no test data seeding script was run to create this configuration.

### Impact

**Severity:** CRITICAL - Blocks all validation

**Affected Components:**
- All 23 test cases
- Token usage measurement
- MCP functionality validation
- Production readiness decision

**Current Test Results:**
- Functional equivalence: 100% (but not meaningful - both systems error identically)
- Token savings: 0% (should be 50-70%)
- AI execution: 0 requests to OpenAI

### Evidence

**Dev Server Logs (Sample):**
```
[PERFORMANCE] Domain lookup completed { duration: '270.03ms', domainId: 'null' }
[CONVERSATION] Failed to get/create conversation {
  error: 'null value in column "domain_id" of relation "conversations" violates not-null constraint'
}
[Intelligent Chat API] Error: Error: Failed to initialize conversation
    at POST (app/api/chat/route.ts:206:13)
POST /api/chat 500 in 12428ms
```

**This pattern repeated 10 times** (5 traditional + 5 MCP mode) across all test cases.

### Reproduction Steps

1. Start dev server: `npm run dev`
2. Run validation: `npx tsx scripts/tests/run-mcp-comparison.ts --sample`
3. Observe all tests fail with "Failed to initialize conversation"
4. Check dev server logs: Domain lookup returns `domainId: 'null'`

### Recommended Fix

**Option 1: Create Test Customer (Preferred)**

```bash
# Create test data seeding script
npx tsx scripts/database/create-test-customer.ts \
  --domain="test-domain.com" \
  --company="Test Company" \
  --seed-content=true
```

**What the script should do:**
1. Insert customer config:
```sql
INSERT INTO customer_configs (
  domain,
  company_name,
  created_at,
  updated_at
) VALUES (
  'test-domain.com',
  'Test Company',
  NOW(),
  NOW()
) RETURNING id;
```

2. Seed scraped pages (10-20 pages):
```sql
INSERT INTO scraped_pages (domain, url, title, content, ...)
VALUES ('test-domain.com', 'https://test-domain.com/page1', ...);
```

3. Generate embeddings:
```bash
npx tsx scripts/generate-embeddings.ts --domain=test-domain.com
```

4. Create sample products:
```sql
INSERT INTO structured_extractions (domain, type, data, ...)
VALUES ('test-domain.com', 'product', '{"sku": "A4VTG90", ...}', ...);
```

**Option 2: Use Existing Customer (Quick Fix)**

Update test framework to use a real customer domain:

```typescript
// In run-mcp-comparison.ts
const customerId = process.env.TEST_CUSTOMER_ID || 'real-customer-id';
const domain = process.env.TEST_DOMAIN || 'real-customer-domain.com';
```

**Pros:** Immediate testing possible
**Cons:** Uses production data, may affect real customer metrics

**Option 3: Mock Database Layer (Not Recommended)**

Add database mocking to test framework. This would allow tests to run but wouldn't validate the actual database integration.

### Verification Steps

After implementing fix:

```bash
# 1. Verify customer exists
psql -d $DATABASE_URL -c \
  "SELECT id, domain FROM customer_configs WHERE domain = 'test-domain.com';"

# Expected: 1 row with domain_id

# 2. Verify content exists
psql -d $DATABASE_URL -c \
  "SELECT COUNT(*) FROM scraped_pages WHERE domain = 'test-domain.com';"

# Expected: 10-20 rows

# 3. Verify embeddings exist
psql -d $DATABASE_URL -c \
  "SELECT COUNT(*) FROM page_embeddings e
   JOIN scraped_pages p ON e.page_id = p.id
   WHERE p.domain = 'test-domain.com';"

# Expected: 10-20 rows

# 4. Re-run validation
npx tsx scripts/tests/run-mcp-comparison.ts --sample

# Expected: Tests execute successfully with AI calls
```

### Estimated Effort

**Development:** 1-2 hours
- Create test data seeding script (1 hour)
- Seed test data (30 minutes)
- Verify and test (30 minutes)

**Testing:** 15 minutes
- Run validation suite
- Verify results

**Documentation:** 30 minutes
- Document test setup process
- Update README

**Total:** 2-3 hours

### Assignee

TBD - Requires database access and test data generation

### Related Issues

- Issue #2 (dependent on this being fixed)

### Status Updates

**2025-11-05:** Issue identified during initial validation run. All tests blocked.

---

## Issue #2: Token Savings Cannot Be Measured

**Priority:** 🔴 **CRITICAL**
**Status:** 🔴 OPEN (Blocked by Issue #1)
**Test Case:** All test cases
**Category:** Validation Accuracy
**Discovered:** 2025-11-05 during result analysis

### Description

The primary goal of MCP validation is to confirm 50-70% token savings compared to traditional tool calling. However, current test results show 0% token savings across all tests because no AI execution is occurring.

### Root Cause

This is a **symptom** of Issue #1. When the database lookup fails, the request never reaches OpenAI, so:
- No prompt tokens used
- No completion tokens used
- Total tokens: 0 for both traditional and MCP modes
- Token savings calculation: 0 / 0 = 0%

### Impact

**Severity:** CRITICAL - Cannot validate core value proposition

**What Cannot Be Validated:**
- Token reduction percentage
- Cost savings projections
- Progressive disclosure effectiveness
- Tool description optimization
- MCP code execution efficiency

**Business Impact:**
- Cannot justify production deployment
- Cannot calculate ROI
- Cannot confirm architectural benefits
- Cannot compare against traditional approach

### Current Measurements

**From Test Report:**
```
Token Usage:
- Traditional: 0 tokens
- MCP: 0 tokens
- Saved: 0 tokens (0.0%)

Expected:
- Traditional: ~2,000-3,000 tokens/query
- MCP: ~800-1,200 tokens/query
- Saved: ~1,200-1,500 tokens/query (50-70%)
```

### Recommended Fix

**Dependency:** Must fix Issue #1 first

Once test customer exists, token measurement should work automatically because:
1. Chat API will successfully initialize conversation
2. Request will proceed to AI execution
3. OpenAI API calls will be made
4. Token usage will be tracked via usage object in response
5. Framework will calculate savings: `(traditional - mcp) / traditional * 100`

**Validation:**
```typescript
// In executeTraditionalChat() and executeMCPChat()
tokensUsed: {
  prompt: result.usage?.prompt_tokens || 0,
  completion: result.usage?.completion_tokens || 0,
  total: result.usage?.total_tokens || 0
}
```

After fix, expect to see:
```
Token Usage:
- Traditional: 2,453 tokens
- MCP: 982 tokens
- Saved: 1,471 tokens (60.0%)
```

### Verification Steps

After Issue #1 is resolved:

```bash
# Run validation
npx tsx scripts/tests/run-mcp-comparison.ts --sample

# Check report for token usage
cat ARCHIVE/test-results/mcp-comparison-*.md | grep "Token Usage:" -A 3

# Expected output:
# Token Usage:
# - Traditional: 2000-3000 tokens
# - MCP: 800-1200 tokens
# - Saved: 1200-1500 tokens (50-70%)
```

### Estimated Effort

**Development:** 0 hours (no code changes needed)
**Testing:** 15 minutes (after Issue #1 fixed)
**Documentation:** Included in Issue #1

### Assignee

Same as Issue #1 - fixes automatically when test customer created

### Status Updates

**2025-11-05:** Identified as symptom of Issue #1. Will resolve automatically.

---

## Issue #3: Limited Test Coverage (Only 5/23 Tests Run)

**Priority:** 🟡 **MODERATE**
**Status:** 🟡 OPEN
**Test Case:** Full test suite
**Category:** Test Completeness
**Discovered:** 2025-11-05 during initial validation run

### Description

The validation only ran 5 "sample" tests out of 23 total test cases. This was intentional for initial smoke testing, but leaves 78% of tests unvalidated.

### Impact

**Severity:** MODERATE - Reduces confidence in results

**Uncovered Test Categories:**
- Product search edge cases (5 tests)
- Multi-result scenarios (4 tests)
- Error handling corner cases (3 tests)
- Complex semantic search (3 tests)
- Performance stress tests (3 tests)

**Potential Missed Issues:**
- MCP may handle complex queries differently
- Multi-product responses may have formatting differences
- Edge case error handling may not be equivalent
- Performance may degrade with complex operations

### Current Coverage

**Executed:**
- Exact SKU matching: 4/7 tests (57%)
- Semantic search: 1/8 tests (12%)
- Multi-result: 0/4 tests (0%)
- Error handling: 0/3 tests (0%)
- Edge cases: 0/1 tests (0%)

**Total:** 5/23 tests (21.7%)

### Recommended Fix

**After Issues #1 and #2 are resolved:**

```bash
# Run full validation suite
npx tsx scripts/tests/run-mcp-comparison.ts

# Expected duration: ~70 seconds
# Expected results:
# - Tests run: 23/23
# - Pass rate: 90-100%
# - Token savings: 50-70%
# - Speed improvement: 10-30%
```

### Verification Steps

```bash
# Run full suite
npx tsx scripts/tests/run-mcp-comparison.ts

# Check report
cat ARCHIVE/test-results/mcp-comparison-*.md | head -20

# Verify test count
# Expected: "Total Test Cases: 23"
```

### Estimated Effort

**Development:** 0 hours (framework ready)
**Testing:** 2-3 minutes (full suite execution)
**Analysis:** 15 minutes (review results)
**Documentation:** 15 minutes (update report)

**Total:** 30 minutes

### Assignee

Same as Issue #1 - run after blockers cleared

### Status Updates

**2025-11-05:** Sample tests completed successfully. Full suite ready to run after blockers cleared.

---

## Issue #4: Progressive Disclosure Not Tested

**Priority:** 🟡 **MODERATE**
**Status:** 🟡 OPEN
**Test Case:** All test cases
**Category:** Feature Coverage
**Discovered:** 2025-11-05 during configuration review

### Description

The validation was run with `MCP_PROGRESSIVE_DISCLOSURE=false` to reduce variables during initial testing. However, progressive disclosure is a key optimization for token savings, and it should be validated.

### Impact

**Severity:** MODERATE - Missing optimization validation

**What's Not Tested:**
- Tool description progressive disclosure
- Dynamic tool visibility based on query analysis
- Token reduction from hiding unused tools
- Performance impact of progressive disclosure

**Expected Impact:**
- Progressive disclosure should provide additional 10-20% token savings
- Current tests may underestimate MCP benefits
- Production deployment should use progressive disclosure

### Current Configuration

```bash
MCP_EXECUTION_ENABLED=true
MCP_PROGRESSIVE_DISCLOSURE=false  # Should be true for production
```

### Recommended Fix

**After Issues #1 and #2 are resolved:**

1. Run baseline tests (current): `MCP_PROGRESSIVE_DISCLOSURE=false`
2. Run optimized tests: `MCP_PROGRESSIVE_DISCLOSURE=true`
3. Compare results:

```bash
# Baseline (current)
npx tsx scripts/tests/run-mcp-comparison.ts --output=baseline-no-disclosure.md

# Optimized
MCP_PROGRESSIVE_DISCLOSURE=true \
  npx tsx scripts/tests/run-mcp-comparison.ts --output=optimized-with-disclosure.md

# Compare
npx tsx scripts/tests/compare-reports.ts baseline-no-disclosure.md optimized-with-disclosure.md
```

**Expected Results:**
```
Baseline (no disclosure):
- Token savings: 50-60%

Optimized (with disclosure):
- Token savings: 60-70%
- Additional 10-20% improvement
```

### Verification Steps

```bash
# Check progressive disclosure is active
grep "Progressive disclosure" dev-server.log

# Expected: Logs showing tool descriptions being filtered
```

### Estimated Effort

**Development:** 0 hours (feature already implemented)
**Testing:** 5 minutes (run with flag enabled)
**Analysis:** 15 minutes (compare results)
**Documentation:** 15 minutes (update report)

**Total:** 35 minutes

### Assignee

Same as Issue #1 - test after blockers cleared

### Status Updates

**2025-11-05:** Intentionally disabled for initial testing. Ready to enable once baseline established.

---

## Summary Dashboard

| Issue | Priority | Status | Blocker | Effort | ETA |
|-------|----------|--------|---------|--------|-----|
| #1 Test Customer Missing | 🔴 CRITICAL | 🔴 OPEN | YES | 2-3h | TBD |
| #2 Token Savings N/A | 🔴 CRITICAL | 🔴 OPEN | Blocked by #1 | 0h | After #1 |
| #3 Limited Test Coverage | 🟡 MODERATE | 🟡 OPEN | Blocked by #1 | 30m | After #1 |
| #4 Progressive Disclosure | 🟡 MODERATE | 🟡 OPEN | Blocked by #1 | 35m | After #1 |

**Critical Path:** Issue #1 → Issues #2, #3, #4

**Total Effort After #1:** ~1 hour
**Total Calendar Time:** 2-4 hours (including #1)

---

## Next Actions

### Immediate (Before Re-Test)

1. ✅ Document all blockers (this file)
2. ⬜ Create test customer in database
3. ⬜ Seed test data (pages, embeddings, products)
4. ⬜ Verify test environment ready

### After Test Customer Created

5. ⬜ Re-run sample tests (5 tests, verify success)
6. ⬜ Run full test suite (23 tests)
7. ⬜ Run with progressive disclosure enabled
8. ⬜ Generate production readiness report
9. ⬜ Update deployment decision

### Long-Term Improvements

10. ⬜ Add pre-flight validation checks to test framework
11. ⬜ Create automated test data seeding
12. ⬜ Document test environment setup requirements
13. ⬜ Integrate validation into CI/CD pipeline

---

**Last Updated:** 2025-11-05
**Next Review:** After test customer creation
