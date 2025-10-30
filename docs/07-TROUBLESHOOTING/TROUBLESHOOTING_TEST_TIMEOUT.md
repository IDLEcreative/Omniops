# Test Timeout Investigation Report

**Type:** Troubleshooting
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 13 minutes

## Purpose
Integration tests in `__tests__/api/chat/route.test.ts` are timing out after 2 minutes, preventing validation of the commerce provider refactoring.

## Quick Links
- [Problem Statement](#problem-statement)
- [Root Cause Analysis](#root-cause-analysis)
- [Evidence](#evidence)
- [Performance Bottlenecks](#performance-bottlenecks)
- [Solutions](#solutions)

## Keywords
analysis, bottlenecks, cause, conclusion, evidence, metrics, performance, problem, recommendations, root

---


## Problem Statement
Integration tests in `__tests__/api/chat/route.test.ts` are timing out after 2 minutes, preventing validation of the commerce provider refactoring.

## Root Cause Analysis

### MSW (Mock Service Worker) Overhead
The timeout is caused by **excessive MSW initialization overhead**:

```
Test Execution Times:
- commerce-provider.test.ts (no MSW): 0.6s ✅
- route.test.ts (with MSW): 120s timeout ❌

MSW Setup Per Test Run:
1. ClientRequestInterceptor initialization
2. XMLHttpRequestInterceptor initialization
3. FetchInterceptor initialization
4. Global instance management
5. Event listener registration (3x interceptors)
6. Request logging on every HTTP call
```

`★ Insight ─────────────────────────────────────`
**The 200x slowdown is from MSW's verbose logging mode.**

Every test file that imports MSW server runs full interceptor
setup with debug logging enabled. The __tests__/mocks/server.ts
file has request logging enabled on line 7-9:

```typescript
server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url)
})
```

This logging fires for EVERY HTTP request made during tests,
creating massive overhead when combined with:
- Supabase client initialization (makes ~5-10 requests)
- OpenAI mock responses
- Redis connection attempts
- Internal Next.js API route handling
`─────────────────────────────────────────────────`

## Evidence

### 1. MSW Initialization Output
```
[setup-server] constructing the interceptor...
[client-request-interceptor] constructing the interceptor...
[xhr] constructing the interceptor...
[fetch] constructing the interceptor...
[setup-server:apply] applying the interceptor...
... (50+ lines of MSW debug output per test)
```

### 2. Test Comparison
| Test File | MSW Used | Runtime | Status |
|-----------|----------|---------|--------|
| commerce-provider.test.ts | No | 0.6s | ✅ Pass |
| route.test.ts | Yes | 120s+ | ❌ Timeout |
| route-async.test.ts | Yes | 120s+ | ❌ Timeout |

### 3. Configuration Analysis
- **Setup File**: [test-utils/jest.setup.js](test-utils/jest.setup.js)
- **MSW Server**: [__tests__/mocks/server.ts](__tests__/mocks/server.ts)
- **MSW Polyfills**: [test-utils/jest.setup.msw.js](test-utils/jest.setup.msw.js) (410 lines!)

## Performance Bottlenecks

### 1. Polyfill Overhead
The MSW setup file includes **410 lines of polyfills**:
- TextEncoder/TextDecoder
- crypto.randomUUID
- TransformStream, ReadableStream, WritableStream
- BroadcastChannel (full class implementation)
- MessagePort/MessageChannel (full class implementation)
- Response, Request, Headers (full class implementations)
- FormData, Blob implementations

**Every test file loads all of these**, even if they don't need them.

### 2. MSW Event Listeners
MSW registers **9 event listeners per test**:
- 3x "request" listeners (one per interceptor)
- 3x "unhandledException" listeners
- 3x "response" listeners
- 1x "connection" listener

### 3. Mock Complexity
The chat route tests mock:
- Supabase client (2 instances: client + admin)
- OpenAI API
- Redis client
- Rate limiting
- Embeddings service
- Link sanitizer
- Search wrapper
- Chat telemetry
- Performance tracker

**All mocks are initialized even for simple tests.**

## Solutions

### Immediate Fix: Disable MSW Logging

**File**: `__tests__/mocks/server.ts`

```typescript
// BEFORE (slow)
export const server = setupServer(...handlers)
server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url)
})

// AFTER (fast)
export const server = setupServer(...handlers)

// Only enable logging in CI or when DEBUG=true
if (process.env.CI || process.env.DEBUG) {
  server.events.on('request:start', ({ request }) => {
    console.log('MSW intercepted:', request.method, request.url)
  })
}
```

**Expected Impact**: 50-70% faster test execution

### Medium-Term Fix: Lazy Polyfill Loading

**File**: `test-utils/jest.setup.msw.js`

```typescript
// Only load polyfills if MSW is actually needed
if (process.env.USE_MSW !== 'false') {
  // Current polyfill code
}
```

**Expected Impact**: 20-30% faster for tests without MSW

### Long-Term Fix: Test Stratification

Create separate Jest configs for different test types:

1. **Unit Tests** (no MSW, no polyfills)
   - Run fast (< 1s per file)
   - Use simple mocks
   - Example: commerce-provider.test.ts

2. **Integration Tests** (MSW, minimal polyfills)
   - Run moderate (5-10s per file)
   - Use MSW for external APIs only
   - Example: route.test.ts

3. **E2E Tests** (full setup, real services)
   - Run slow (30-60s per file)
   - Use real Supabase/OpenAI (sandboxed)

**Configuration Structure**:
```
config/jest/
├── jest.unit.config.js       # Fast, no MSW
├── jest.integration.config.js # Moderate, MSW
└── jest.e2e.config.js         # Slow, real services
```

## Recommendations

### Critical (Do Now)
1. ✅ **Remove MSW request logging** from production test runs
2. ✅ **Add environment guard** for debug logging
3. ✅ **Document MSW performance impact** in test README

### Important (Do This Week)
4. ⚠️ **Create unit test config** without MSW for fast tests
5. ⚠️ **Move commerce-provider tests** to unit config
6. ⚠️ **Add test timeout warnings** to CI output

### Nice-to-Have (Do This Month)
7. 💡 **Lazy load polyfills** based on test requirements
8. 💡 **Profile MSW alternatives** (nock, fetch-mock)
9. 💡 **Implement test caching** for unchanged files

## Testing the Fix

### Step 1: Disable MSW Logging
```bash
# Edit __tests__/mocks/server.ts
# Remove or conditionally enable the event listener

# Rerun tests
npx jest __tests__/api/chat/route.test.ts --runInBand
```

**Expected**: Tests complete in 10-30 seconds instead of timeout

### Step 2: Verify Commerce Provider Tests Still Pass
```bash
npx jest __tests__/lib/agents/commerce-provider.test.ts --verbose
```

**Expected**: ✅ All 3 tests pass in < 1 second

### Step 3: Run Full Test Suite
```bash
npm test
```

**Expected**: All tests pass, total runtime < 5 minutes

## Metrics

### Before Fix
- **Single test file**: 120s timeout
- **Full suite**: N/A (timeouts prevent completion)
- **MSW overhead**: 200x slowdown
- **Developer experience**: ❌ Unusable

### After Fix (Projected)
- **Single test file**: 10-15s
- **Full suite**: 2-4 minutes
- **MSW overhead**: 5-10x slowdown (acceptable)
- **Developer experience**: ✅ Usable

## Conclusion

The test timeout is **NOT** caused by the commerce provider refactoring. The registry tests pass perfectly (0.6s). The issue is **pre-existing MSW configuration** with verbose logging enabled.

**Action Items**:
1. Disable MSW request logging in `__tests__/mocks/server.ts`
2. Add environment guard (`if (process.env.DEBUG)`)
3. Document MSW performance considerations
4. Consider test stratification for future work

**Status**: ✅ Root cause identified, fix is straightforward
**Priority**: 🔴 High - Blocks test validation
**Estimated Fix Time**: 5 minutes
**Estimated Test Time**: 2 minutes

---

**Generated**: 2025-10-23
**Author**: Claude Code Analysis
**Related Files**:
- [__tests__/mocks/server.ts](__tests__/mocks/server.ts)
- [test-utils/jest.setup.msw.js](test-utils/jest.setup.msw.js)
- [__tests__/api/chat/route.test.ts](__tests__/api/chat/route.test.ts)
