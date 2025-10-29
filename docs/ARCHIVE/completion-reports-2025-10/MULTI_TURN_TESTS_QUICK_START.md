# Multi-Turn Conversation Tests - Quick Start Guide

## Prerequisites

✅ Dev server running on port 3000: `npm run dev`
✅ Environment variables set:
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Run Tests

### Option 1: Standalone E2E Tests (Recommended)
**Makes REAL API calls to OpenAI - costs ~$0.30 per run**

```bash
npx tsx test-multi-turn-e2e.ts
```

**Output**: Detailed turn-by-turn analysis with conversation accuracy metrics

### Option 2: Jest Integration Tests
**Uses mocks - free but doesn't validate real system**

```bash
npm test -- __tests__/integration/multi-turn-conversation-e2e.test.ts
```

## Test Coverage

| Test | Purpose | Status |
|------|---------|--------|
| Test 8 | Out-of-bounds list references | ✅ PASSING |
| Test 9 | Context accumulation (86% accuracy) | ⚠️ 60% (needs work) |
| Test 10 | Context switching | ✅ PASSING |
| Test 11 | Intent change tracking | ✅ PASSING |
| Test 12 | Metadata persistence | ✅ PASSING |
| Test 13 | Metadata updates | ✅ PASSING |

**Overall**: 5/6 tests passing (83.3%)

## Expected Results

```
======================================================================
📊 FINAL RESULTS
======================================================================
✅ Test 8: Out-of-bounds references
❌ Test 9: Context accumulation (60% accuracy vs 86% target)
✅ Test 10: Context switching
✅ Test 11: Intent tracking
✅ Test 12: Metadata persistence
✅ Test 13: Metadata updates
======================================================================
🎯 Tests Passing: 5/6 (83.3%)
🔥 Conversation Accuracy: 60% (Target: >= 86%)
======================================================================
```

## What Gets Tested

### Test 8: Out-of-Bounds References
- Shows 3 items
- User asks about "item 5"
- **Validates**: AI doesn't hallucinate, explains limitation

### Test 9: 5-Turn Context Accumulation (CRITICAL)
1. "What types of products do you have?"
2. "Show me the first type you mentioned"
3. "What are the prices?"
4. "Are they in stock?"
5. "Can I get more details about the first one?"

**Validates**: 86% conversation accuracy claim

### Test 10: Context Switching
- Products → Orders → Back to Products
- **Validates**: Context preservation across topic switches

### Test 11: Intent Tracking
- Product search → Order lookup
- **Validates**: Metadata tracks both intents

### Test 12: Metadata Persistence
- Verifies metadata saved after EACH turn
- **Validates**: Cumulative storage (not replacement)

### Test 13: Metadata Updates
- User says "I meant ZF4 not ZF5"
- **Validates**: Correction detected and tracked

## Viewing Results

### Latest Test Run
```bash
cat test-multi-turn-results.log
```

### Check Metadata for Conversation
```bash
# Get conversation ID from test output, then:
npx tsx -e "
import { createServiceRoleClient } from './lib/supabase-server.ts';
(async () => {
  const client = await createServiceRoleClient();
  const { data } = await client
    .from('conversations')
    .select('metadata')
    .eq('id', 'CONVERSATION_ID_HERE')
    .single();
  console.log(JSON.stringify(data.metadata, null, 2));
})();
"
```

## Troubleshooting

### Tests Fail with "Domain not found"
```bash
# Check if domain exists:
npx tsx check-test-domain.ts

# Or use different domain:
TEST_DOMAIN=thompsonseparts.co.uk npx tsx test-multi-turn-e2e.ts
```

### Tests Fail with "session_id required"
Update test file to include `session_id` in request body (already fixed in current version)

### Dev Server Not Running
```bash
# Start dev server:
npm run dev

# Verify it's running:
curl http://localhost:3000/api/health
```

## Cost Control

**Each full test run costs ~$0.30** in OpenAI API calls:
- 6 tests
- ~25 total API calls
- ~2,800 tokens average per call

**Recommendations**:
- Run full suite before releases only
- Use Jest tests (with mocks) for rapid development
- Run E2E tests weekly for validation

## Files

| File | Purpose |
|------|---------|
| `test-multi-turn-e2e.ts` | Standalone E2E test runner |
| `__tests__/integration/multi-turn-conversation-e2e.test.ts` | Jest test suite |
| `test-multi-turn-results.log` | Latest test results |
| `AGENT5_MULTI_TURN_TESTS_REPORT.md` | Full analysis report |

## Next Steps

1. **Address Test 9 Failure**: Improve from 60% to 86% accuracy
2. **Run Weekly**: Track accuracy improvements
3. **Production Monitoring**: Track real conversation accuracy

---

**Quick Command**:
```bash
npx tsx test-multi-turn-e2e.ts && cat test-multi-turn-results.log
```
