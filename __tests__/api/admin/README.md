**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Admin API Testing Suite

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 5 minutes

**Purpose:** Comprehensive testing tools for admin API endpoints, including telemetry and lookup failure analytics.

**Related:**
- [API Routes](../../../app/api/admin/README.md)
- [Testing Documentation](../../README.md)
- [Telemetry System](../../../lib/telemetry/README.md)

## Overview

This directory contains specialized testing scripts for admin API endpoints that require thorough validation beyond standard unit tests.

## Available Tests

### 1. Lookup Failures Endpoint Test

**File:** `test-lookup-failures-endpoint.ts`

**Purpose:** Comprehensive testing of the `/api/admin/lookup-failures` endpoint with various parameters, edge cases, performance benchmarks, and concurrent request handling.

**Usage:**

```bash
# Start dev server first
npm run dev

# In another terminal, run the test
npx tsx __tests__/api/admin/test-lookup-failures-endpoint.ts
```

**What It Tests:**

1. **Server Health** (6 attempts, 10s intervals)
   - Verifies server is running on port 3000
   - Waits up to 1 minute for server to be ready

2. **Basic Endpoint Tests** (4 tests)
   - Default query (7 days)
   - 1 day time window
   - 30 day time window
   - 90 day time window
   - Validates: HTTP 200, valid JSON, correct structure

3. **Edge Case Tests** (5 tests)
   - Invalid days parameter (`days=abc`)
   - Negative days (`days=-1`)
   - Very large days (`days=99999`)
   - Empty domainId (`domainId=`)
   - Non-existent domainId (all zeros UUID)
   - Validates: Graceful error handling

4. **Performance Tests** (100 sequential requests)
   - Measures: min, max, avg, p50, p95, p99 response times
   - Target: p95 < 200ms
   - Detects: Performance degradation, memory leaks

5. **Concurrent Tests** (20 parallel requests)
   - Tests: Race conditions, concurrent request handling
   - Validates: All requests succeed, reasonable response times

6. **Data Accuracy Validation**
   - Verifies: Response structure matches specification
   - Checks: All required fields present and valid types
   - Samples: Actual data for sanity checks

**Expected Output:**

```
📊 API TESTING REPORT - /api/admin/lookup-failures
================================================================================

Status: ✅ ALL TESTS PASSED / ⚠️ SOME ISSUES / ❌ CRITICAL FAILURES
Tests Passed: X/Y
Total Time: Z seconds

Test Results:

1. ✅ Default (7 days)
   Response Time: 45ms
   Details: Valid response structure

2. ✅ 1 day filter
   Response Time: 38ms
   Details: Valid response structure

[...]

📊 Performance Results:
   Min: 35ms
   Max: 120ms
   Avg: 52.34ms
   p50: 48ms
   p95: 89ms
   p99: 105ms
   Target (<200ms p95): ✅ MET

Recommendations:

✅ All tests passed! No immediate actions required.
```

### 2. Bash Script Alternative

**File:** `../../scripts/tests/test-lookup-failures-api.sh`

**Purpose:** Shell script version for environments where TypeScript execution isn't available.

**Usage:**

```bash
# Start dev server first
npm run dev

# In another terminal, run the script
bash scripts/tests/test-lookup-failures-api.sh
```

**Requirements:**
- `curl` (for HTTP requests)
- `jq` (for JSON parsing)

**Install jq if needed:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (WSL)
sudo apt-get install jq
```

## Response Schema Validation

All tests validate against this expected response structure:

```typescript
interface LookupFailureStats {
  stats: {
    totalFailures: number;
    byErrorType: Record<string, number>;
    byPlatform: Record<string, number>;
    topFailedQueries: Array<{
      query: string;
      count: number;
    }>;
    commonPatterns: string[];
  };
  period: string;        // e.g., "Last 7 days"
  domainId: string;      // "all" or UUID
}
```

## Performance Benchmarks

**Target Metrics:**

| Metric | Target | Critical Threshold |
|--------|--------|--------------------|
| p50 (median) | < 50ms | < 100ms |
| p95 | < 200ms | < 500ms |
| p99 | < 500ms | < 1000ms |
| Concurrent (20 req) | < 1000ms total | < 2000ms total |

**Interpretation:**

- **p50 < 50ms**: Good - typical user experience is fast
- **p95 < 200ms**: Good - 95% of users get fast responses
- **p99 < 500ms**: Acceptable - even slowest requests are reasonable
- **Concurrent < 1s**: Good - can handle burst traffic

## Troubleshooting

### Server Not Starting

**Problem:** Server fails to respond after 60 seconds

**Solutions:**
1. Check if port 3000 is already in use: `lsof -i :3000`
2. Kill existing processes: `pkill -f "next dev"`
3. Check for errors in terminal running `npm run dev`
4. Verify environment variables in `.env.local`

### Tests Failing

**Problem:** All tests return HTTP errors

**Solutions:**
1. Verify server is actually running: `curl http://localhost:3000`
2. Check database connection (Supabase)
3. Review server logs for errors
4. Ensure test data exists in database

### Performance Tests Slow

**Problem:** p95 > 200ms consistently

**Possible causes:**
1. Database queries need optimization
2. Missing database indexes
3. Network latency to Supabase
4. Server under heavy load
5. Cold start / cache warming needed

**Investigation:**
```bash
# Check database query performance
# Run EXPLAIN ANALYZE on queries

# Check server resource usage
top -pid $(pgrep -f "next dev")

# Profile the endpoint
# Add timing logs in route handler
```

### JSON Parsing Errors (Bash Script)

**Problem:** `jq` command not found or JSON parse errors

**Solutions:**
1. Install jq: `brew install jq` (macOS) or `apt-get install jq` (Linux)
2. Check response is valid JSON: `curl http://localhost:3000/api/admin/lookup-failures | jq .`
3. Verify endpoint returns 200 status

## Adding New Tests

When adding new admin endpoints, create similar test files:

1. **Create test script:** `__tests__/api/admin/test-{endpoint-name}.ts`
2. **Follow the pattern:**
   - Server health check
   - Basic functionality tests
   - Edge case tests
   - Performance tests
   - Concurrent request tests
   - Data validation

3. **Document in this README:**
   - Add section describing the test
   - Include usage instructions
   - Document expected output
   - Add troubleshooting tips

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Start dev server
  run: npm run dev &

- name: Wait for server
  run: |
    for i in {1..30}; do
      if curl -s http://localhost:3000 > /dev/null; then
        exit 0
      fi
      sleep 2
    done
    exit 1

- name: Run API tests
  run: npx tsx __tests__/api/admin/test-lookup-failures-endpoint.ts
```

## Related Documentation

- [Admin API Routes](../../../app/api/admin/README.md) - Endpoint implementations
- [Telemetry System](../../../lib/telemetry/README.md) - Telemetry data model
- [Testing Guide](../../README.md) - Overall testing strategy
- [Performance Optimization](../../../docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md) - Performance best practices

## Maintenance

**Regular checks:**
- [ ] Run tests weekly to catch performance regressions
- [ ] Update expected schema when API changes
- [ ] Review and adjust performance targets quarterly
- [ ] Add new edge cases as bugs are discovered

**After endpoint changes:**
- [ ] Update test scripts with new parameters
- [ ] Verify all tests still pass
- [ ] Update performance benchmarks if needed
- [ ] Document any breaking changes
