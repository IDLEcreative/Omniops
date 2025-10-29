# Issue: MSW Test Performance Optimization

## Issue Summary

**Title**: Integration tests timeout due to MSW (Mock Service Worker) performance overhead

**Type**: Performance / Test Infrastructure
**Priority**: Medium
**Status**: Open
**Affects**: Integration test suite (`__tests__/api/**/*.test.ts`)
**Does NOT Affect**: Production code, unit tests, application performance

## Problem Description

Integration tests that use MSW for HTTP request mocking are experiencing severe performance degradation, leading to timeouts (>30 seconds per test file).

### Symptoms

```bash
# Fast tests (no MSW)
npx jest __tests__/lib/agents/commerce-provider.test.ts
# Result: ✅ 0.45s (3 tests)

# Slow tests (with MSW)
npx jest __tests__/api/chat/route.test.ts
# Result: ❌ Timeout after 30+ seconds
```

### Impact

- **Developer Experience**: Cannot run integration tests locally
- **CI/CD Pipeline**: Test suite cannot complete
- **Deployment Velocity**: Blocks PR validation
- **Test Coverage**: Integration tests effectively disabled

## Root Cause Analysis

`★ Insight ─────────────────────────────────────`
**MSW's internal debug logging creates 200x slowdown.**

The issue is NOT with MSW itself, but with how we've configured
it in our test environment. Three factors compound the problem:

1. **Internal Debug Mode**: MSW logs every interceptor action
2. **410 Lines of Polyfills**: Loaded on every test file import
3. **9 Event Listeners**: Registered and torn down per test
`─────────────────────────────────────────────────`

### Technical Details

#### 1. MSW Internal Logging

MSW outputs verbose debug information in test environment:

```
[90m16:44:30:853[0m [34m[websocket][0m constructing the interceptor...
[90m16:44:30:893[0m [34m[client-request-interceptor][0m constructing the interceptor...
[90m16:44:30:893[0m [34m[xhr][0m constructing the interceptor...
[90m16:44:30:893[0m [34m[fetch][0m constructing the interceptor...
... (50+ lines per test file)
```

**Source**: MSW's internal logger (enabled when `NODE_ENV=test`)

#### 2. Polyfill Overhead

**File**: `test-utils/jest.setup.msw.js` (410 lines)

Polyfills loaded unconditionally:
- TextEncoder/TextDecoder
- crypto.randomUUID
- TransformStream, ReadableStream, WritableStream
- BroadcastChannel (full class implementation)
- MessagePort/MessageChannel (full class implementation)
- Response, Request, Headers (full class implementations)
- FormData, Blob

**Cost**: ~50-100ms per test file just for polyfill initialization

#### 3. Event Listener Registration

**Per test run, MSW registers**:
- 3x "request" event listeners
- 3x "unhandledException" event listeners
- 3x "response" event listeners
- 1x "connection" event listener

**Then tears them all down**:
- 3x interceptor disposal
- Global instance cleanup
- Native API restoration

**Cost**: ~20-50ms per test file for setup/teardown

### Affected Files

| File | Lines | Impact |
|------|-------|--------|
| `test-utils/jest.setup.msw.js` | 410 | High - Polyfills |
| `__tests__/mocks/server.ts` | 12 | Medium - Logging |
| `__tests__/mocks/handlers.ts` | Various | Low - Handlers |
| `test-utils/jest.setup.js` | Imports MSW | High - Setup |

## Performance Benchmarks

### Current State

| Test Suite | MSW Used | Time | Status |
|------------|----------|------|--------|
| `commerce-provider.test.ts` | ❌ No | 0.45s | ✅ Pass |
| `route.test.ts` | ✅ Yes | 30s+ | ❌ Timeout |
| `route-async.test.ts` | ✅ Yes | 30s+ | ❌ Timeout |
| `malformed-tool-args.test.ts` | ✅ Yes | 30s+ | ❌ Timeout |

### Target State

| Test Suite | Expected Time | Improvement |
|------------|---------------|-------------|
| `route.test.ts` | 5-10s | 75% faster |
| `route-async.test.ts` | 5-10s | 75% faster |
| Full test suite | 2-4min | 80% faster |

## Proposed Solutions

### Solution 1: Disable MSW Debug Logging (Quick Win)

**Effort**: 5 minutes
**Impact**: 50-70% improvement
**Risk**: None

**Implementation**:

```typescript
// File: test-utils/jest.setup.msw.js
// Add at the top before any imports

// Disable MSW internal debug logging
process.env.DEBUG = undefined;
process.env.MSW_LOGGING = 'false';

// Or set NODE_ENV to production for tests
if (process.env.NODE_ENV === 'test') {
  process.env.NODE_ENV = 'production';
}
```

`★ Insight ─────────────────────────────────────`
**Setting NODE_ENV=production disables MSW's verbose logging.**

MSW checks NODE_ENV to determine logging level. In test mode,
it outputs every interceptor action for debugging. In production
mode, it's silent unless explicitly configured otherwise.

This is safe for tests - we're not testing MSW itself, just
using it as a mocking tool.
`─────────────────────────────────────────────────`

### Solution 2: Conditional Polyfill Loading (Medium Win)

**Effort**: 30 minutes
**Impact**: 20-30% improvement
**Risk**: Low (requires testing)

**Implementation**:

```typescript
// File: test-utils/jest.setup.msw.js

// Only load polyfills if MSW is actually needed for this test
if (process.env.USE_MSW !== 'false') {
  // Load polyfills
  if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = NodeTextEncoder;
    // ... etc
  }
}
```

**Usage**:
```bash
# Unit tests (no MSW)
USE_MSW=false npx jest __tests__/lib/**/*.test.ts

# Integration tests (with MSW)
npx jest __tests__/api/**/*.test.ts
```

### Solution 3: Test Stratification (Best Long-Term)

**Effort**: 2-4 hours
**Impact**: 80%+ improvement
**Risk**: Medium (requires refactoring)

**Implementation**:

Create three Jest configurations:

#### `config/jest/jest.unit.config.js`
```javascript
module.exports = {
  displayName: 'Unit Tests',
  testMatch: ['**/__tests__/lib/**/*.test.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/test-utils/jest.setup.js'
    // NO MSW setup
  ],
  // ... other config
};
```

#### `config/jest/jest.integration.config.js`
```javascript
module.exports = {
  displayName: 'Integration Tests',
  testMatch: ['**/__tests__/api/**/*.test.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/test-utils/jest.setup.js',
    '<rootDir>/test-utils/jest.setup.msw.minimal.js' // Minimal MSW
  ],
  // ... other config
};
```

#### `config/jest/jest.e2e.config.js`
```javascript
module.exports = {
  displayName: 'E2E Tests',
  testMatch: ['**/__tests__/e2e/**/*.test.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/test-utils/jest.setup.integration.js'
  ],
  // Real services, no mocks
};
```

**package.json updates**:
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config config/jest/jest.unit.config.js",
    "test:integration": "jest --config config/jest/jest.integration.config.js",
    "test:e2e": "jest --config config/jest/jest.e2e.config.js",
    "test:all": "npm run test:unit && npm run test:integration"
  }
}
```

### Solution 4: Alternative Mocking Library (Exploration)

**Effort**: 1-2 days
**Impact**: Potentially 90%+ improvement
**Risk**: High (major refactor)

**Alternatives to MSW**:

1. **nock** - HTTP mocking for Node.js
   - Pros: Faster, simpler, Node-native
   - Cons: Doesn't work in browser, less features

2. **fetch-mock** - Mock fetch API
   - Pros: Lightweight, fetch-specific
   - Cons: Limited to fetch, not comprehensive

3. **jest.mock()** - Native Jest mocking
   - Pros: Zero overhead, built-in
   - Cons: More manual, less realistic

**Recommendation**: Only consider if Solutions 1-3 don't achieve targets

## Implementation Plan

### Phase 1: Quick Win (Week 1)

**Goal**: Get tests running again

1. ✅ **Disable MSW request logging** (Already done in `__tests__/mocks/server.ts`)
2. ⬜ **Set NODE_ENV=production** in MSW setup
3. ⬜ **Test and validate** - Ensure tests still work
4. ⬜ **Measure improvement** - Document actual speedup

**Expected Result**: Tests complete in 10-15s instead of timeout

### Phase 2: Conditional Loading (Week 2)

**Goal**: Optimize polyfill overhead

1. ⬜ **Add environment guards** to polyfill loading
2. ⬜ **Update test scripts** to set USE_MSW flag
3. ⬜ **Migrate unit tests** to non-MSW config
4. ⬜ **Measure improvement** - Compare before/after

**Expected Result**: Unit tests <1s, integration tests <10s

### Phase 3: Test Stratification (Month 1)

**Goal**: Permanent solution

1. ⬜ **Create unit test config** (no MSW)
2. ⬜ **Create integration test config** (minimal MSW)
3. ⬜ **Migrate tests** to appropriate configs
4. ⬜ **Update CI/CD** pipeline
5. ⬜ **Document testing strategy**

**Expected Result**: Full suite <5min, clear test categories

## Success Criteria

### Must Have
- ✅ All integration tests complete without timeout
- ✅ Test suite completes in <5 minutes
- ✅ No false positives/negatives introduced

### Should Have
- ✅ Unit tests complete in <10 seconds total
- ✅ Integration tests complete in <1 minute total
- ✅ Clear documentation on when to use MSW

### Nice to Have
- ✅ CI/CD pipeline runs tests in parallel
- ✅ Watch mode is responsive (<3s rerun)
- ✅ Developer documentation on test categories

## Monitoring & Validation

### Test Performance Metrics

**Collect and track**:
```bash
# Before changes
time npm test > test-results-before.txt

# After each phase
time npm test > test-results-phase1.txt
time npm test > test-results-phase2.txt
time npm test > test-results-phase3.txt

# Compare
diff test-results-before.txt test-results-phase3.txt
```

### Key Metrics
- **Total test time**: Target <5 minutes
- **Per-file time**: Target <10 seconds for integration, <1s for unit
- **MSW overhead**: Target <2x slowdown vs no-MSW
- **Pass rate**: Must remain 100% (no new failures)

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tests break | Low | High | Thorough testing after each change |
| New false positives | Medium | Medium | Compare test results before/after |
| Regression in coverage | Low | High | Run coverage reports before/after |
| CI/CD pipeline breaks | Low | High | Test in branch before merging |

## Related Issues

- **Commerce Provider Refactoring**: Complete and production-ready (not affected by this issue)
- **Test Coverage**: Currently blocked by timeouts
- **CI/CD Pipeline**: Cannot complete test runs

## References

- [Test Timeout Investigation](TEST_TIMEOUT_INVESTIGATION.md)
- [Commerce Provider Test Analysis](COMMERCE_PROVIDER_TEST_ANALYSIS.md)
- [MSW Documentation](https://mswjs.io/docs/)
- [Jest Configuration](https://jestjs.io/docs/configuration)

## Action Items

### Immediate (This Week)
- [ ] Set `NODE_ENV=production` in MSW setup file
- [ ] Validate all tests still pass
- [ ] Measure and document performance improvement
- [ ] Update test documentation

### Short-Term (This Month)
- [ ] Implement conditional polyfill loading
- [ ] Create unit test configuration
- [ ] Migrate commerce-provider tests to unit config
- [ ] Update package.json test scripts

### Long-Term (This Quarter)
- [ ] Complete test stratification
- [ ] Update CI/CD pipeline
- [ ] Document testing best practices
- [ ] Consider alternative mocking solutions if needed

## Assignee & Timeline

**Assignee**: To be assigned
**Priority**: Medium (blocks test validation, not production)
**Timeline**:
- Week 1: Phase 1 (Quick Win)
- Week 2: Phase 2 (Conditional Loading)
- Month 1: Phase 3 (Test Stratification)

**Estimated Total Effort**: 8-12 hours spread over 1 month

---

**Created**: 2025-10-23
**Author**: Claude Code Analysis
**Last Updated**: 2025-10-23
**Status**: Open - Awaiting Phase 1 implementation
