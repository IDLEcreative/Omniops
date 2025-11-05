# Lookup Failures API Testing Guide

**Quick Reference:** How to test the `/api/admin/lookup-failures` endpoint

## Prerequisites

1. **Dev server must be running:**
   ```bash
   npm run dev
   ```

2. **Database must have telemetry data:**
   - At least 100+ lookup failure records
   - Run the data insertion script if needed:
     ```bash
     npx tsx scripts/telemetry/insert-test-lookup-failures.ts
     ```

## Running the Tests

### Option 1: TypeScript Test Suite (Recommended)

**Full comprehensive testing:**

```bash
npx tsx __tests__/api/admin/test-lookup-failures-endpoint.ts
```

**What it does:**
- ✅ Checks server health (waits up to 1 minute)
- ✅ Tests basic parameters (7, 1, 30, 90 days)
- ✅ Tests edge cases (invalid params, empty values)
- ✅ Performance testing (100 sequential requests)
- ✅ Concurrent testing (20 parallel requests)
- ✅ Data validation (structure and accuracy)

**Expected runtime:** ~2-3 minutes

### Option 2: Bash Script (Faster)

**For quick validation:**

```bash
bash scripts/tests/test-lookup-failures-api.sh
```

**Requirements:**
- `curl` - HTTP client
- `jq` - JSON processor (install: `brew install jq`)

**Expected runtime:** ~1-2 minutes

## Quick Manual Tests

### Test 1: Basic Query (Default 7 days)
```bash
curl http://localhost:3000/api/admin/lookup-failures | jq .
```

**Expected response:**
```json
{
  "stats": {
    "totalFailures": 150,
    "byErrorType": {
      "product_not_found": 80,
      "woocommerce_connection_failed": 40,
      "invalid_query": 30
    },
    "byPlatform": {
      "woocommerce": 120,
      "shopify": 30
    },
    "topFailedQueries": [
      { "query": "find product X", "count": 15 },
      { "query": "show item Y", "count": 12 }
    ],
    "commonPatterns": [
      "Product not found: 53.3%",
      "Connection issues: 26.7%"
    ]
  },
  "period": "Last 7 days",
  "domainId": "all"
}
```

### Test 2: Specific Time Window
```bash
# Last 24 hours
curl "http://localhost:3000/api/admin/lookup-failures?days=1" | jq .

# Last 30 days
curl "http://localhost:3000/api/admin/lookup-failures?days=30" | jq .
```

### Test 3: Specific Domain
```bash
curl "http://localhost:3000/api/admin/lookup-failures?domainId=YOUR_UUID_HERE" | jq .
```

### Test 4: Performance Check
```bash
# Measure response time
time curl -s http://localhost:3000/api/admin/lookup-failures > /dev/null

# Should be < 200ms for good performance
```

## Interpreting Results

### Success Indicators

✅ **HTTP 200** status code
✅ **Valid JSON** structure
✅ **All required fields** present:
   - `stats.totalFailures`
   - `stats.byErrorType`
   - `stats.byPlatform`
   - `stats.topFailedQueries`
   - `stats.commonPatterns`
   - `period`
   - `domainId`
✅ **Response time < 200ms** (p95)

### Warning Signs

⚠️ **Response time 200-500ms** - Acceptable but could be optimized
⚠️ **Empty results** - Check if test data exists
⚠️ **Missing fields** - API schema mismatch

### Failure Indicators

❌ **HTTP 500** - Server error, check logs
❌ **HTTP 404** - Endpoint not found, check routing
❌ **Response time > 500ms** - Performance issue
❌ **Invalid JSON** - Serialization problem
❌ **Missing required fields** - Implementation incomplete

## Performance Targets

| Metric | Target | Action if Missed |
|--------|--------|------------------|
| p50 (median) | < 50ms | Investigate slow queries |
| p95 | < 200ms | Add database indexes |
| p99 | < 500ms | Check for outliers |
| Concurrent (20 req) | < 1000ms | Review connection pooling |

## Troubleshooting

### Problem: "Server not responding"

**Cause:** Dev server not running or port 3000 blocked

**Solutions:**
1. Start server: `npm run dev`
2. Check port: `lsof -i :3000`
3. Kill conflicting process: `pkill -f "next dev"`

### Problem: "No data found"

**Cause:** Database doesn't have test data

**Solutions:**
1. Insert test data:
   ```bash
   npx tsx scripts/telemetry/insert-test-lookup-failures.ts
   ```
2. Verify data exists:
   ```bash
   # Query Supabase directly
   # Check agent_lookup_failures table has records
   ```

### Problem: "Tests timing out"

**Cause:** Database queries too slow or connection issues

**Solutions:**
1. Check Supabase connection: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Verify indexes exist on `agent_lookup_failures` table
3. Check network latency to Supabase
4. Review query execution plan

### Problem: "JSON parse error"

**Cause:** Invalid response format

**Solutions:**
1. Check raw response: `curl http://localhost:3000/api/admin/lookup-failures`
2. Look for HTML error pages instead of JSON
3. Check server logs for exceptions
4. Verify TypeScript compilation succeeded

## Common Issues

### Issue: Performance Degradation

**Symptoms:**
- Response times increasing over time
- p95 exceeds 200ms
- Database queries slow

**Investigation:**
```bash
# 1. Check database indexes
npx tsx scripts/database/check-indexes.ts

# 2. Review query plans
# Add EXPLAIN ANALYZE to queries

# 3. Monitor database size
# Check if agent_lookup_failures table is too large

# 4. Review connection pool
# Check lib/db-optimization/connection-pool.ts
```

**Solutions:**
- Add missing indexes
- Implement data archival for old records
- Optimize queries with proper JOINs
- Increase connection pool size if needed

### Issue: Inconsistent Results

**Symptoms:**
- Different counts on repeated requests
- Race conditions in concurrent tests

**Investigation:**
```bash
# Test consistency
for i in {1..10}; do
  curl -s http://localhost:3000/api/admin/lookup-failures | jq '.stats.totalFailures'
done

# Should return same count each time
```

**Solutions:**
- Check for transaction isolation issues
- Verify read replicas are in sync (if using)
- Review caching logic
- Check for concurrent writes during test

## Next Steps

After successful testing:

1. **Document baseline performance:**
   - Record current p50, p95, p99 values
   - Set alerts for regression

2. **Integrate into CI/CD:**
   - Add to GitHub Actions workflow
   - Run on every PR to main branch

3. **Monitor in production:**
   - Set up APM (Application Performance Monitoring)
   - Track response times over time
   - Alert on anomalies

4. **Regular maintenance:**
   - Run tests weekly
   - Review and archive old telemetry data
   - Update performance targets quarterly

## Related Files

- **Test Scripts:**
  - `__tests__/api/admin/test-lookup-failures-endpoint.ts` - TypeScript test suite
  - `scripts/tests/test-lookup-failures-api.sh` - Bash script version

- **API Implementation:**
  - `app/api/admin/lookup-failures/route.ts` - Endpoint handler

- **Test Data:**
  - `scripts/telemetry/insert-test-lookup-failures.ts` - Test data generator

- **Documentation:**
  - `__tests__/api/admin/README.md` - Detailed testing docs
  - `docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md` - Performance guide

## Questions?

If tests fail or you encounter issues:

1. Check server logs: Look at terminal running `npm run dev`
2. Review implementation: `app/api/admin/lookup-failures/route.ts`
3. Verify database: Check Supabase dashboard for data
4. Consult docs: See comprehensive README in `__tests__/api/admin/`
