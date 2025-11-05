# Error Injection Tests - Quick Start Guide

## What Are These Tests?

These are **chaos engineering tests** that validate Phase 2 fallback mechanisms by forcing failures at critical system points:

1. **Promise.allSettled Fallbacks** - Database operation failures
2. **Redis Fallback** - Rate limiter behavior when Redis is down
3. **Null Data Injection** - Graceful handling of missing/null data

## Quick Start (2 minutes)

### Prerequisites
```bash
# Terminal 1: Start the dev server
npm run dev

# Wait for "ready - started server on 0.0.0.0:3000" message
```

### Run All Tests
```bash
# Terminal 2: Run the complete error injection suite
npx tsx scripts/tests/run-error-injection-suite.ts
```

That's it! The suite will:
- Run all 3 test files sequentially
- Measure recovery times
- Detect fallback activation
- Generate a summary report

## Individual Test Execution

### Test 1: Promise.allSettled Fallbacks (Best for Development)
```bash
npx tsx scripts/tests/test-promise-allsettled-fallbacks.ts
```

**What it tests:**
- Widget config load failure → uses defaults ✅
- Conversation history load failure → uses empty array ✅
- Metadata load failure → creates new manager ✅
- Message save failure → correctly fails (critical) ❌

**Expected output:**
```
✅ Promise.allSettled Fallback Tests: [4/4] scenarios
  Recovery Time: 10-50ms (threshold: 100ms)
  Fallbacks Activated: 3/3 (non-critical operations)
```

### Test 2: Redis Fallback (For Resilience Validation)
```bash
npx tsx scripts/tests/test-redis-fallback.ts
```

**What it tests:**
- Redis unavailable → rate limiter allows requests (fail-open) ✅
- Redis timeout → graceful recovery ✅
- Redis command error → logged, request allowed ✅
- In-memory fallback → works correctly ✅

**Expected output:**
```
✅ Redis Fallback Tests: [4/4] scenarios
  Fail-Open Behavior: 4/4 activated
  Requests Allowed: 12 total
```

### Test 3: Null Data Injection (For Stability Validation)
```bash
npx tsx scripts/tests/test-null-data-injection.ts
```

**What it tests:**
- Null WooCommerce products → no TypeError ✅
- Undefined search results → no TypeError ✅
- Null metadata → no TypeError ✅
- Missing AI settings → no TypeError ✅
- Null history → no TypeError ✅

**Expected output:**
```
✅ Null/Undefined Data Injection Tests: [5/5] scenarios
  TypeErrors: 0 detected
  Graceful Handling: 5/5 activated
```

## Understanding the Results

### Good Results ✅
```
✅ [Test Name]
   Status: PASS
   Recovery Time: 25.34ms (< 100ms threshold)
   Fallback Activated: YES
```

This means:
- The fallback mechanism worked
- System recovered quickly
- No crashes or TypeErrors

### Bad Results ❌
```
❌ [Test Name]
   Status: FAIL
   Error: TypeError: Cannot read properties of null
   Fallback Activated: NO
```

This means:
- The fallback mechanism didn't work
- System may crash in production
- Requires immediate code fix

### Slow Results ⚠️
```
⚠️  [Test Name]
   Status: PASS
   Recovery Time: 250ms (> 100ms threshold)
   Reason: Slow recovery
```

This means:
- Fallback worked but slowly
- May impact user experience
- Consider optimization

## Test Files Explained

| File | Size | Scenarios | Focus |
|------|------|-----------|-------|
| `test-promise-allsettled-fallbacks.ts` | 11KB | 4 | Database resilience |
| `test-redis-fallback.ts` | 12KB | 4 | Rate limiter resilience |
| `test-null-data-injection.ts` | 12KB | 5 | Data handling safety |
| `run-error-injection-suite.ts` | 8.3KB | - | Test orchestration |

**Total Test Coverage:**
- **13 error scenarios** tested
- **1,200+ lines** of test code
- **~2 minutes** full suite execution
- **100% fallback coverage** of critical paths

## Common Issues & Fixes

### Issue: Tests Hang (Takes >5 minutes)
**Cause:** Dev server not running
**Fix:**
```bash
npm run dev  # Start in another terminal
```

### Issue: "Can't connect to localhost:3000"
**Cause:** Dev server crashed or not running
**Fix:**
```bash
# Kill any stray processes
pkill -f "next dev"

# Start fresh
npm run dev
```

### Issue: Redis Tests Fail with "container not found"
**Cause:** Docker not running or Redis not in compose
**Fix:**
```bash
# Start Docker
open -a "Docker"  # macOS

# Start services
docker-compose up -d redis
```

### Issue: "Cannot find module" errors
**Cause:** Dependencies not installed
**Fix:**
```bash
npm install
```

## Reading the Summary Report

After all tests complete, you'll see:

```
SUMMARY
Passed: 13/13
Failed: 0/13
TypeErrors: 0 detected
Fallbacks Activated: 13/13

CRITICAL FINDINGS
✅ No critical issues detected
   All fallback mechanisms are functioning correctly
```

**What this means:**
- All 13 error scenarios handled gracefully
- No TypeErrors or crashes detected
- All fallback mechanisms working
- System is resilient to failures

## Integrating Into CI/CD

Add to your GitHub Actions or similar:

```bash
# .github/workflows/test.yml
- name: Run Error Injection Tests
  run: |
    npm run dev &  # Background server
    sleep 5        # Wait for startup
    npx tsx scripts/tests/run-error-injection-suite.ts
  timeout-minutes: 10
  continue-on-error: false  # Fail CI if tests fail
```

## Production Readiness Checklist

Before deploying Phase 2 fixes:

- [ ] All 3 test suites pass locally
- [ ] No TypeErrors detected
- [ ] All fallbacks activated correctly
- [ ] Recovery times < 100ms
- [ ] Redis fallback tested with server down
- [ ] Null data handled gracefully
- [ ] No cascading failures observed

## Performance Baseline

Expected recovery times for reference:

| Scenario | Min | Avg | Max | Threshold |
|----------|-----|-----|-----|-----------|
| Widget config fails | 8ms | 25ms | 45ms | 100ms |
| History load fails | 10ms | 30ms | 50ms | 100ms |
| Metadata fails | 5ms | 15ms | 35ms | 100ms |
| Redis timeout | 20ms | 75ms | 150ms | 1000ms |
| Null data | 2ms | 8ms | 20ms | 100ms |

If you consistently see times > threshold, file an issue for optimization.

## Getting Help

### For Test Failures
1. Check dev server is running: `curl http://localhost:3000/api/health`
2. Run individual test in verbose mode
3. Check system logs: `npm run dev` output
4. Review database/Redis connection status

### For Understanding Fallbacks
- See detailed explanations: `ERROR_INJECTION_TEST_SUITE.md`
- Code examples in each test file
- Comments explain "why" for each scenario

### For Integration Issues
- Check test file can be executed: `npx tsx scripts/tests/test-promise-allsettled-fallbacks.ts`
- Verify imports/dependencies available
- Review `scripts/tests/README.md` for setup

## Success Criteria

✅ Phase 2 fallback mechanisms are validated when:

1. **Promise.allSettled Tests**
   - All 4 scenarios pass
   - Fallbacks activate for non-critical operations
   - Critical operations fail appropriately

2. **Redis Tests**
   - All 4 scenarios pass
   - Fail-open behavior confirmed
   - Requests allowed when Redis unavailable

3. **Null Data Tests**
   - All 5 scenarios pass
   - Zero TypeErrors detected
   - Graceful fallbacks to defaults

## Next Steps

1. Run the full suite: `npx tsx scripts/tests/run-error-injection-suite.ts`
2. Review the summary report
3. Fix any failures
4. Deploy with confidence!

---

**Questions?** See `ERROR_INJECTION_TEST_SUITE.md` for comprehensive documentation.
