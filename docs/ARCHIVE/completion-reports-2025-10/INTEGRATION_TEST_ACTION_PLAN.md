# 🎯 Integration Test Implementation - Action Plan

**Date**: 2025-10-27
**Status**: Implementation Complete, Execution Partially Blocked
**Priority Focus**: Unblock tests → Fix accuracy gap → Integrate to CI/CD

---

## 📊 Current State Summary

- **Tests Implemented**: 32/32 (100%) ✅
- **Tests Passing**: 18/32 (56.3%)
- **Tests Blocked**: 14/32 (43.7%)
- **Critical Issue**: 60% conversation accuracy vs 86% target (26% gap)

---

## 🚨 PRIORITY 0: Critical Blockers (THIS WEEK)

### P0.1: Fix API 500 Errors (Blocking 11 Tests)
**Impact**: Agent 4 (7 tests) + Agent 6 (4 tests) = 11 tests blocked
**Estimated Time**: 4-6 hours
**Owner**: Backend Team

**Error**:
```
API error: 500 {"error":"Failed to process chat message","message":"An unexpected error occurred. Please try again."}
```

**Investigation Steps**:
1. Check server logs for detailed error stack trace
   ```bash
   # If using Docker
   docker-compose logs -f app --tail=100

   # If running locally
   npm run dev > server.log 2>&1
   ```

2. Verify environment variables
   ```bash
   # Check these exist and are valid
   echo $OPENAI_API_KEY
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

3. Test minimal chat request
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Hello",
       "domain": "thompsonseparts.co.uk",
       "conversationId": null
     }'
   ```

4. Check OpenAI API status
   - Visit https://status.openai.com/
   - Verify API key is active in OpenAI dashboard

**Success Criteria**:
- ✅ Minimal chat request returns 200 OK
- ✅ Response includes valid message text
- ✅ No 500 errors in logs

**Files to Check**:
- `app/api/chat/route.ts` (main endpoint)
- `lib/agents/domain-agnostic-agent.ts` (agent logic)
- `.env.local` (environment variables)

---

### P0.2: Fix Supabase Client Configuration (Blocking 5 Tests)
**Impact**: Agent 1 (5 tests) blocked
**Estimated Time**: 2-4 hours
**Owner**: Database Team

**Error**: `createTestConfig()` returns `null` for `customerConfig`

**Investigation Steps**:
1. Compare test client with working implementation
   ```typescript
   // Check if using correct client factory
   import { createServiceRoleClient } from '@/lib/supabase/server';

   // Instead of raw createClient
   const supabase = createServiceRoleClient();
   ```

2. Verify RLS policies allow service role
   ```sql
   -- Check customer_configs policies
   SELECT * FROM pg_policies
   WHERE tablename = 'customer_configs';

   -- Service role should bypass RLS, but verify
   ```

3. Test direct insert via MCP
   ```typescript
   // Use MCP execute_sql to test insert
   INSERT INTO customer_configs (domain, settings)
   VALUES ('test.example.com', '{}')
   RETURNING *;
   ```

4. Add debug logging to `createTestConfig()`
   ```typescript
   const { data, error } = await supabase
     .from('customer_configs')
     .insert(config)
     .select()
     .single();

   console.log('Insert result:', { data, error });
   ```

**Success Criteria**:
- ✅ `createTestConfig()` returns valid customerConfig object
- ✅ Test can insert and retrieve config from database
- ✅ No null returns

**Files to Check**:
- `__tests__/integration/agent-flow-e2e.test.ts` (test file)
- `lib/supabase/server.ts` (client factory)
- Database RLS policies

---

### P0.3: Fix Organization FK Constraint (Blocking 5 Tests)
**Impact**: Agent 2 (5 tests) blocked
**Estimated Time**: 1-2 hours
**Owner**: Database Team

**Error**: `customer_configs` requires `organization_id` foreign key

**Solution Options**:

**Option A: Make organization_id Nullable (RECOMMENDED)**
```sql
-- Quick fix for test environment
ALTER TABLE customer_configs
ALTER COLUMN organization_id DROP NOT NULL;

-- Add check constraint if needed
ALTER TABLE customer_configs
ADD CONSTRAINT org_id_or_test CHECK (
  organization_id IS NOT NULL OR domain LIKE 'test-%'
);
```

**Option B: Create Shared Test Organization**
```typescript
// In beforeAll hook
let testOrgId: string;

beforeAll(async () => {
  const { data: org } = await supabase
    .from('organizations')
    .insert({ name: 'Test Organization', slug: 'test-org' })
    .select()
    .single();

  testOrgId = org.id;
});

// Use in createTestConfig
const config = {
  domain: `test-${Date.now()}.example.com`,
  organization_id: testOrgId, // Add this
  settings: {},
};
```

**Success Criteria**:
- ✅ `createTestConfig()` succeeds without FK constraint error
- ✅ Tests can create customer configs
- ✅ Cleanup works correctly

**Files to Modify**:
- Database schema (migration file)
- `__tests__/integration/agent-flow-e2e.test.ts` (if using Option B)

---

### P0.4: Address 60% Conversation Accuracy Gap (CRITICAL)
**Impact**: Core feature claim not validated
**Estimated Time**: 3-5 days
**Owner**: AI/ML Team

**Finding**: Test 9 shows 60% accuracy vs documented 86% target

**Root Cause Analysis**:
1. ✅ Metadata tracking system works correctly
2. ❌ AI not consistently using metadata for context resolution
3. ❌ List context lost after 2-3 turns
4. ❌ Category mentions in prose not treated as structured lists

**Action Items**:

**Step 1: Create GitHub Issue** (15 mins)
```markdown
Title: Improve multi-turn conversation accuracy from 60% to 86%

Description:
Test 9 (5-turn context accumulation) shows only 60% accuracy vs documented 86%.

Turn-by-turn breakdown:
- Turn 1: ✅ Provided categories
- Turn 2: ❌ Failed "first type you mentioned"
- Turn 3: ✅ Resolved price query
- Turn 4: ✅ Resolved pronoun "they"
- Turn 5: ❌ Failed "the first one"

Root Cause: AI prompt engineering needs improvement for metadata usage.

Acceptance Criteria:
- [ ] Test 9 passes with >= 86% accuracy
- [ ] All 5 turns resolve context correctly
- [ ] Metadata consistently used by AI
```

**Step 2: Enhance System Prompt** (2-3 days)

Add explicit metadata usage rules:
```typescript
// In system prompt
`
CRITICAL: Context Resolution Rules

You MUST use the conversation metadata to resolve references:

1. PRONOUNS (it, they, them, this, that):
   - Check metadata.entities_mentioned for last mentioned entity
   - Example: User asks "Is it in stock?" → Look up last product in entities

2. LIST REFERENCES (first one, second one, item 2):
   - Check metadata.list_items for indexed items
   - Example: "Tell me about the second one" → metadata.list_items[1]

3. CATEGORY REFERENCES (first type you mentioned):
   - Check metadata.categories_discussed
   - Example: "Show me the first type" → metadata.categories_discussed[0]

If metadata missing or unclear:
- Ask for clarification: "Which [item/product/category] are you referring to?"
- DO NOT guess or hallucinate
- Offer specific options based on conversation history
`
```

**Step 3: Increase Metadata Context Window** (1 day)
```typescript
// In lib/chat/competency-metrics.ts or response-parser.ts

// Change from 3 to 5 turns
const CONTEXT_WINDOW_SIZE = 5; // Previously 3

// Keep last 5 turns of metadata available to AI
const recentContext = conversationMetadata.slice(-CONTEXT_WINDOW_SIZE);
```

**Step 4: Add Few-Shot Examples** (1 day)
```typescript
// Add to system prompt
`
Example Conversation with Metadata:

Turn 1:
User: "What types of pumps do you have?"
Assistant: "We have hydraulic, pneumatic, and electric pumps."
Metadata: { categories_discussed: ["hydraulic", "pneumatic", "electric"], list_items: [...] }

Turn 2:
User: "Tell me about the first type"
Assistant: [Checks metadata.categories_discussed[0]] "Hydraulic pumps are..."
Metadata: { context_resolution: "first type → hydraulic", ... }

Turn 3:
User: "Are they in stock?"
Assistant: [Checks metadata - "they" refers to hydraulic pumps from Turn 2]
`
```

**Step 5: Test and Validate** (1 day)
```bash
# Re-run Test 9 after changes
npx tsx test-multi-turn-e2e.ts

# Target: 86%+ accuracy
# Expected: All 5 turns should pass
```

**Success Criteria**:
- ✅ Test 9 achieves >= 86% accuracy (5/5 or 4.3/5 turns)
- ✅ Turn 2 resolves "first type you mentioned"
- ✅ Turn 5 resolves "the first one"
- ✅ Metadata consistently used across all turns
- ✅ Documentation accuracy claim validated

---

## 🔧 PRIORITY 1: Test Execution & Validation (NEXT WEEK)

### P1.1: Execute All Blocked Tests
**Time**: 1 day after P0 fixes
**Cost**: ~$0.40 in OpenAI tokens

**Execution Plan**:
```bash
# Agent 1 tests (Tests 1-5)
npm test -- __tests__/integration/agent-flow-e2e.test.ts -t "product search|no results|order lookup|security|parallel"

# Agent 2 tests (Tests 6-10)
npm test -- __tests__/integration/agent-flow-e2e.test.ts -t "max iteration|product mention|correction|WooCommerce|Shopify"

# Agent 3 tests (Tests 13, 15a-c) - 4 failing
npm test -- __tests__/integration/agent-flow-e2e-tests-11-15.test.ts -t "tool execution|markdown|hallucination|link filtering"

# Agent 4 tests (Tests 1-7)
npm test -- __tests__/integration/agent4-pronoun-correction-tests.test.ts

# Agent 5 Test 9 (after accuracy fix)
npx tsx test-multi-turn-e2e.ts

# Agent 6 tests (Tests 14-17) - INCLUDING CRITICAL TEST 15
npm test -- __tests__/integration/multi-turn-conversation-e2e.test.ts -t "state|concurrent|recovery|long"
```

**CRITICAL**: Test 15 (Concurrent Isolation)
```bash
# Run this test 3 times to verify no flakiness
for i in {1..3}; do
  echo "Run $i/3"
  npm test -- -t "should handle concurrent conversations"
done

# MUST PASS - Production blocker if fails
# Validates: No state leakage between sessions
```

**Success Criteria**:
- ✅ 32/32 tests passing (100%)
- ✅ Test 15 passes all 3 runs (no flakiness)
- ✅ No security issues detected
- ✅ Token usage within budget (~$0.83 total)

---

### P1.2: Fix Agent 3 Failing Tests (4 Tests)
**Impact**: Tests 13, 15a, 15b, 15c returning 400 errors
**Time**: 4-6 hours

**Investigation Steps**:
1. Analyze 400 error responses
   ```bash
   # Run with verbose logging
   npm test -- __tests__/integration/agent-flow-e2e-tests-11-15.test.ts -t "tool execution" --verbose
   ```

2. Check request payload validation
   - Verify all required fields present
   - Check data types match API expectations
   - Validate domain format

3. Review API route validation logic
   ```typescript
   // In app/api/chat/route.ts
   // Check Zod schema or validation logic
   ```

4. Test with minimal payload
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "test",
       "domain": "test.localhost"
     }'
   ```

**Success Criteria**:
- ✅ All 7 Agent 3 tests passing
- ✅ No 400 errors
- ✅ Error handling validated

---

### P1.3: Performance Benchmarking
**Time**: 2-4 hours

**Metrics to Collect**:
```bash
# Run full test suite with timing
time npm test -- __tests__/integration/ --verbose

# Collect metrics:
# - Total execution time
# - Average time per test
# - OpenAI token usage per test
# - Memory usage
```

**Performance Targets**:
- Total suite: < 15 minutes
- Avg per test: < 30 seconds
- Token cost: < $1.00 per run
- Memory: < 2GB peak

**Document Results**:
```markdown
# Create: INTEGRATION_TEST_PERFORMANCE_METRICS.md

## Baseline Performance (2025-10-27)
- Total Time: X minutes
- Tests: 32
- Token Cost: $X.XX
- Memory Peak: X GB

## Per-Test Breakdown
| Test | Time | Cost | Status |
|------|------|------|--------|
| ...  | ...  | ...  | ...    |
```

---

## 🚀 PRIORITY 2: CI/CD Integration (WEEK 2)

### P2.1: GitHub Actions Workflow
**Time**: 4-6 hours

**Create**: `.github/workflows/integration-tests.yml`
```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start services
        run: docker-compose up -d

      - name: Run integration tests
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          # Run fast tests on every PR
          npm test -- __tests__/integration/ --testPathIgnorePatterns="Test 17"

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/

  expensive-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      # Only run Test 17 (22 turns, $0.66) on main branch
      - name: Run long conversation test
        run: npm test -- -t "should handle extremely long"
```

**Token Budget Management**:
```yaml
# Add cost tracking
- name: Check token budget
  run: |
    COST=$(cat test-results/token-cost.txt)
    if (( $(echo "$COST > 1.00" | bc -l) )); then
      echo "Token cost $COST exceeds budget $1.00"
      exit 1
    fi
```

---

### P2.2: Test Environment Setup
**Time**: 2-3 hours

**Create**: `scripts/setup-test-environment.sh`
```bash
#!/bin/bash
set -e

echo "Setting up integration test environment..."

# 1. Create test organization
TEST_ORG_ID=$(psql $DATABASE_URL -c \
  "INSERT INTO organizations (name, slug)
   VALUES ('Test Org', 'test-org')
   ON CONFLICT (slug) DO UPDATE SET name='Test Org'
   RETURNING id;" | tail -n 2 | head -n 1 | xargs)

# 2. Create test domain
psql $DATABASE_URL -c \
  "INSERT INTO customer_configs (domain, organization_id, settings)
   VALUES ('test.localhost', '$TEST_ORG_ID', '{}')
   ON CONFLICT (domain) DO NOTHING;"

# 3. Insert test products
psql $DATABASE_URL -c \
  "INSERT INTO scraped_pages (domain, url, title, content)
   VALUES
     ('test.localhost', '/pump-a', 'Pump A', 'Price: $299.99, In stock'),
     ('test.localhost', '/pump-b', 'Pump B', 'Price: $399.99, In stock'),
     ('test.localhost', '/pump-c', 'Pump C', 'Price: $499.99, Out of stock')
   ON CONFLICT (domain, url) DO NOTHING;"

echo "Test environment ready!"
```

---

### P2.3: Monitoring & Alerting
**Time**: 2-4 hours

**Metrics to Track**:
1. **Conversation Accuracy** (weekly)
   ```bash
   # Run Test 9 weekly, track trend
   npx tsx test-multi-turn-e2e.ts > accuracy-$(date +%Y-%m-%d).log
   ```

2. **Token Usage** (per CI run)
   ```typescript
   // Track in test runner
   const totalTokens = testResults.reduce((sum, t) => sum + t.tokens, 0);
   const totalCost = totalTokens * 0.00002; // GPT-4 pricing

   console.log(`Token usage: ${totalTokens} ($${totalCost.toFixed(2)})`);
   ```

3. **Test Flakiness** (daily)
   ```bash
   # Run each test 10 times, track failures
   for test in $(get_all_tests); do
     pass_rate=$(run_test_n_times $test 10)
     if [ $pass_rate -lt 90 ]; then
       alert "Flaky test: $test (${pass_rate}% pass rate)"
     fi
   done
   ```

**Create Dashboard** (optional):
- Grafana dashboard for test metrics
- Slack alerts for failures
- Weekly accuracy reports

---

## 📈 PRIORITY 3: Expansion & Optimization (MONTH 1)

### P3.1: Expand Test Coverage

**50-Turn Conversation Test**:
```typescript
it('should handle 50-turn conversation', async () => {
  // Validate extreme context management
  // Expected cost: ~$1.50
  // Run: Monthly only
});
```

**100+ Concurrent Conversations**:
```typescript
it('should handle 100 parallel conversations', async () => {
  // Stress test for state isolation
  // Validates: No memory leaks, no state mixing
  // Run: Before major releases
});
```

---

### P3.2: Production Data Validation

**Real Conversation Replay**:
1. Export sample production conversations (anonymized)
2. Replay through test system
3. Compare AI responses
4. Calculate real-world accuracy

**Create**: `scripts/replay-production-conversations.ts`
```typescript
// Load production conversations
const conversations = await loadProductionSample(100);

// Replay and measure
for (const conv of conversations) {
  const result = await replayConversation(conv);
  metrics.push({
    accuracy: result.accuracy,
    turns: result.turnCount,
    resolutionRate: result.contextResolutionRate,
  });
}

// Calculate real accuracy
const avgAccuracy = metrics.reduce((sum, m) => sum + m.accuracy, 0) / metrics.length;
console.log(`Production accuracy: ${avgAccuracy}%`);
```

---

### P3.3: Optimization Opportunities

**Reduce Token Usage**:
- Implement conversation summarization after 10 turns
- Cache common queries and responses
- Use GPT-3.5 for simple questions, GPT-4 for complex

**Improve Test Speed**:
- Parallelize independent tests
- Mock expensive operations in unit tests
- Use test database with pre-loaded data

**Cost Optimization**:
```typescript
// Target: Reduce from $0.83 to $0.50 per run

1. Use GPT-3.5 for simple tests (60% cost reduction)
2. Implement response caching (30% fewer API calls)
3. Batch similar queries (20% efficiency gain)

Expected savings: 40-50% (~$0.40 per run)
```

---

## 📋 Action Item Checklist

### This Week (P0)
- [ ] P0.1: Fix API 500 errors (4-6 hours)
- [ ] P0.2: Fix Supabase client config (2-4 hours)
- [ ] P0.3: Fix organization FK constraint (1-2 hours)
- [ ] P0.4: Address 60% → 86% accuracy gap (3-5 days)
  - [ ] Create GitHub issue
  - [ ] Enhance system prompt
  - [ ] Increase context window
  - [ ] Add few-shot examples
  - [ ] Test and validate

### Next Week (P1)
- [ ] P1.1: Execute all blocked tests (1 day)
- [ ] P1.2: Fix Agent 3 failing tests (4-6 hours)
- [ ] P1.3: Performance benchmarking (2-4 hours)

### Week 2 (P2)
- [ ] P2.1: GitHub Actions workflow (4-6 hours)
- [ ] P2.2: Test environment setup (2-3 hours)
- [ ] P2.3: Monitoring & alerting (2-4 hours)

### Month 1 (P3)
- [ ] P3.1: Expand test coverage
- [ ] P3.2: Production data validation
- [ ] P3.3: Optimization opportunities

---

## 🎯 Success Metrics

### Week 1 Goals
- ✅ All 32 tests passing (currently 18/32)
- ✅ 86%+ conversation accuracy validated
- ✅ No infrastructure blockers
- ✅ Test 15 (security) passing

### Week 2 Goals
- ✅ CI/CD integrated
- ✅ Automated test runs on PR
- ✅ Token budget monitoring active
- ✅ Performance benchmarks documented

### Month 1 Goals
- ✅ Production accuracy validated
- ✅ Cost optimized to $0.50/run
- ✅ Test coverage expanded
- ✅ Monitoring dashboard live

---

## 💡 Lessons for Future Agent Orchestration

**What Worked**:
1. ✅ Parallel execution saved 75-83% time
2. ✅ Specialized agents produced higher quality
3. ✅ Independent validation caught critical issues
4. ✅ Comprehensive reporting enabled handoff

**What to Improve**:
1. ⚠️ Pre-flight infrastructure checks needed
2. ⚠️ Cost budgets should be set upfront
3. ⚠️ Real-time monitoring during execution
4. ⚠️ Progressive rollout (start small, scale up)

**Template for Future Use**:
```markdown
1. Identify parallelizable categories
2. Create specialized agent missions
3. Set clear success criteria
4. Launch all agents in parallel
5. Monitor progress in real-time
6. Consolidate findings
7. Verify integration points
8. Document thoroughly
```

---

## 📞 Escalation Path

**If Blocked > 2 Days**:
- Escalate to tech lead
- Consider temporary workarounds
- Prioritize unblocking over perfect solutions

**If Accuracy Can't Reach 86%**:
- Document actual achievable accuracy
- Update documentation to match reality
- Consider hybrid approach (AI + rules)

**If Costs Exceed Budget**:
- Implement aggressive caching
- Use GPT-3.5 for more tests
- Reduce test frequency

---

## 📊 Tracking

**Create Weekly Status Updates**:
```markdown
# Week of 2025-10-27

## Completed
- [x] Item 1
- [x] Item 2

## In Progress
- [ ] Item 3 (50% complete)

## Blocked
- [ ] Item 4 (waiting on X)

## Metrics
- Tests Passing: 18/32 → 25/32
- Accuracy: 60% → 72%
- Token Cost: $0.83 → $0.65
```

---

**Total Estimated Time**:
- Week 1 (P0): 15-22 hours
- Week 2 (P1): 10-14 hours
- Week 3 (P2): 8-13 hours
- Month 1 (P3): 15-20 hours

**Total**: ~50-70 hours over 4 weeks to complete all priorities
