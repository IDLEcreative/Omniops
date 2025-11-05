# Quick Start: API Testing

**Purpose:** Get the API tests running in under 2 minutes

## Step 1: Start Dev Server

```bash
npm run dev
```

**Wait for:** `✓ Ready in X seconds` message

## Step 2: Open New Terminal

**Do NOT close the first terminal** - keep dev server running

## Step 3: Run Tests

**Option A: TypeScript (Full Suite)**
```bash
npx tsx __tests__/api/admin/test-lookup-failures-endpoint.ts
```

**Option B: Bash (Quick Check)**
```bash
bash scripts/tests/test-lookup-failures-api.sh
```

**Option C: Manual Curl**
```bash
curl http://localhost:3000/api/admin/lookup-failures | jq .
```

## Expected Output

```
🚀 Starting Comprehensive API Testing

Target: /api/admin/lookup-failures
Port: 3000

================================================================================

✅ Server is responding on port 3000

📋 Running Basic Endpoint Tests...

✅ Default (7 days): 45ms
✅ 1 day filter: 38ms
✅ 30 day filter: 52ms
✅ 90 day filter: 89ms

🧪 Running Edge Case Tests...

✅ Invalid days parameter: 42ms
✅ Negative days: 40ms
✅ Very large days: 95ms
✅ Empty domainId: 43ms
✅ Non-existent domainId: 38ms

⚡ Running Performance Tests (100 sequential requests)...
[Progress indicators...]

📊 Performance Results:
   Min: 35ms
   Max: 120ms
   Avg: 48.34ms
   p50: 45ms
   p95: 87ms
   p99: 112ms
   Target (<200ms p95): ✅ MET

🔄 Running Concurrent Request Tests (20 concurrent)...

✅ All requests completed in 524ms
   Successful: 20/20
   Average response time: 26.20ms

🔍 Verifying Data Accuracy...

📊 Sample Data Analysis:
   Total Failures: 150
   Error Types: 3 types
   Platforms: 2 platforms
   Top Failed Queries: 10 entries
   Common Patterns: 2 patterns
   Period: Last 7 days
   Domain ID: all

================================================================================
📊 API TESTING REPORT
================================================================================

Status: ✅ ALL TESTS PASSED
Tests Passed: 11/11
Total Time: 2.45 seconds

Recommendations:

✅ All tests passed! No immediate actions required.

================================================================================
```

## Troubleshooting

### Problem: "Server not responding"

**Solution:**
```bash
# Check if server is running
lsof -i :3000

# If nothing, start server
npm run dev

# If something else, kill it
kill -9 $(lsof -ti:3000)
npm run dev
```

### Problem: "No data found"

**Solution:**
```bash
# Insert test data
npx tsx scripts/telemetry/insert-test-lookup-failures.ts

# Verify in Supabase dashboard
# Check agent_lookup_failures table
```

### Problem: "jq: command not found" (Bash script only)

**Solution:**
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

## What Gets Tested?

- ✅ Server health (auto-retry, 1 minute timeout)
- ✅ Basic queries (4 time windows)
- ✅ Edge cases (5 scenarios)
- ✅ Performance (100 requests, statistical analysis)
- ✅ Concurrency (20 parallel requests)
- ✅ Data validation (structure and accuracy)

## Performance Targets

- **p50** < 50ms - ✅ Median response
- **p95** < 200ms - ✅ 95th percentile (PRIMARY TARGET)
- **p99** < 500ms - ✅ 99th percentile
- **20 concurrent** < 1000ms - ✅ Burst handling

## Next Steps

1. **Review results** - Check for any failures
2. **Document baseline** - Record p95 value
3. **Run regularly** - Weekly checks recommended
4. **See full docs:**
   - `__tests__/api/admin/README.md` - Comprehensive guide
   - `scripts/tests/README-LOOKUP-FAILURES-TESTING.md` - Detailed reference

## Quick Manual Tests

```bash
# Default (7 days)
curl http://localhost:3000/api/admin/lookup-failures | jq .

# Last 24 hours
curl "http://localhost:3000/api/admin/lookup-failures?days=1" | jq .

# Last 30 days
curl "http://localhost:3000/api/admin/lookup-failures?days=30" | jq .

# Performance check
time curl -s http://localhost:3000/api/admin/lookup-failures > /dev/null

# Should be < 0.200s (200ms)
```

---

**That's it!** You should now have comprehensive test results in under 3 minutes.

For detailed documentation, see:
- `/Users/jamesguy/Omniops/__tests__/api/admin/README.md`
- `/Users/jamesguy/Omniops/scripts/tests/README-LOOKUP-FAILURES-TESTING.md`
- `/Users/jamesguy/Omniops/ARCHIVE/completion-reports-2025-11/API_TESTING_TOOLS_DELIVERY.md`
