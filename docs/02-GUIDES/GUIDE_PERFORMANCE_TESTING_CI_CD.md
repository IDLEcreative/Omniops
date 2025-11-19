# Performance Testing CI/CD Setup

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-19
**Verified For:** v0.1.0

## Purpose

This guide explains the automated performance testing infrastructure that runs nightly and validates performance budgets against production baselines.

## Quick Links
- [Performance Budgets Configuration](../../.github/performance-budgets.json)
- [Nightly Workflow](../../.github/workflows/performance-nightly.yml)
- [Performance Tests](__tests__/performance/)

## Table of Contents
- [Overview](#overview)
- [Workflows](#workflows)
- [Performance Budgets](#performance-budgets)
- [Running Locally](#running-locally)
- [Viewing Results](#viewing-results)
- [Troubleshooting](#troubleshooting)

---

## Overview

The performance testing CI/CD infrastructure provides:

1. **Nightly automated testing** - Runs all performance tests every night at 2 AM UTC
2. **Performance budgets** - Defined thresholds for p50/p95/p99 response times, throughput, error rates
3. **Budget validation** - Automatic detection of performance regressions
4. **GitHub Actions integration** - Results posted to workflow summaries and PR comments
5. **Historical tracking** - Metrics stored as artifacts for trend analysis

## Workflows

### Nightly Performance Testing

**File:** `.github/workflows/performance-nightly.yml`

**Schedule:** Every night at 2 AM UTC (cron: `0 2 * * *`)

**Triggers:**
- Scheduled: Every night at 2 AM UTC
- Push to main: When performance tests or core code changes
- Manual: Via `workflow_dispatch`

**Duration:** ~15-20 minutes

**What it does:**

1. **Setup Environment**
   - Starts Redis service (required for queue tests)
   - Builds the application
   - Starts dev server on port 3000

2. **Run Performance Tests**
   - Executes all tests in `__tests__/performance/`
   - Generates JSON output with test results
   - Continues even if some tests fail

3. **Extract Metrics**
   - Parses test output for performance metrics
   - Calculates p50/p90/p95/p99 percentiles
   - Generates `PERFORMANCE_BASELINE.md` report
   - Creates timestamped JSON files for trending

4. **Validate Budgets**
   - Compares metrics against defined budgets
   - Identifies critical violations and warnings
   - Generates `budget-violations.json` if issues found

5. **Report Results**
   - Uploads artifacts (results, baseline, violations)
   - Posts summary to GitHub Actions workflow
   - Comments on PRs with performance impact
   - Fails workflow if critical violations detected

**Environment Variables:**
```bash
RUN_PERFORMANCE_TESTS=true   # Enable performance tests
TEST_API_URL=http://localhost:3000
NODE_OPTIONS=--max-old-space-size=4096
```

## Performance Budgets

**File:** `.github/performance-budgets.json`

Performance budgets define acceptable thresholds for each test. Budgets are organized by category:

### Budget Structure

```json
{
  "budgets": {
    "api": {
      "chat-endpoint-load": {
        "p50": 1500,        // 50th percentile < 1500ms
        "p95": 2000,        // 95th percentile < 2000ms
        "p99": 3000,        // 99th percentile < 3000ms
        "errorRate": 5,     // Error rate < 5%
        "throughput": 10    // Throughput > 10 req/s
      }
    }
  }
}
```

### Budget Categories

**API Tests** (`budgets.api`)
- `chat-endpoint-load` - Chat API performance
- `search-endpoint-load` - Search API performance
- `scrape-endpoint-load` - Scraping API performance

**Queue Tests** (`budgets.queue`)
- `job-processing-throughput` - Job queue throughput
- `concurrent-workers` - Worker scaling efficiency

**Integration Tests** (`budgets.integration`)
- `end-to-end-purchase` - Complete purchase flow
- `woocommerce-sync` - WooCommerce synchronization
- `concurrent-customers` - Multi-tenant isolation

**Dashboard Tests** (`budgets.dashboard`)
- `dashboard-queries` - Analytics query performance

### Violation Severity

**Warning Violations** (90% of budget)
- Triggers when metric exceeds 90% of budget
- Does not fail the workflow
- Indicates performance degradation trend

**Critical Violations** (100% of budget)
- Triggers when metric exceeds budget threshold
- Fails the workflow
- Requires immediate investigation

### Updating Budgets

1. Edit `.github/performance-budgets.json`
2. Commit and push changes
3. Next nightly run will use new budgets

**Example: Increase chat API p95 budget**
```json
{
  "budgets": {
    "api": {
      "chat-endpoint-load": {
        "p95": 2500  // Increased from 2000ms
      }
    }
  }
}
```

## Running Locally

### Prerequisites

1. Redis running: `docker-compose up -d redis`
2. Dev server not already running on port 3000
3. Environment variables configured (`.env.local`)

### Run All Performance Tests

```bash
# Enable performance tests
export RUN_PERFORMANCE_TESTS=true

# Start dev server in background
npm run dev &
DEV_PID=$!

# Wait for server to be ready
sleep 10

# Run performance tests
npm test -- __tests__/performance/ \
  --verbose \
  --testTimeout=120000 \
  --json \
  --outputFile=performance-results.json

# Extract metrics
npx tsx scripts/extract-performance-metrics.ts

# Validate budgets
npx tsx scripts/validate-performance-budgets.ts

# Cleanup
kill $DEV_PID
```

### Run Specific Test Category

```bash
# Run only API tests
npm test -- __tests__/performance/api/

# Run only queue tests
npm test -- __tests__/performance/queue/

# Run only integration tests
npm test -- __tests__/performance/integration/
```

### Run Single Test File

```bash
# Run chat endpoint tests
npm test -- __tests__/performance/api/chat-endpoint-load.test.ts
```

## Viewing Results

### GitHub Actions

**Workflow Summary:**
1. Go to: [Actions → Nightly Performance Testing](../../actions/workflows/performance-nightly.yml)
2. Click on latest run
3. View summary with performance baseline table

**Artifacts:**
1. Download `performance-results-{run_number}` artifact
2. Contains:
   - `performance-results.json` - Raw test output
   - `PERFORMANCE_BASELINE.md` - Human-readable baseline
   - `performance-metrics-{date}.json` - Structured metrics
   - `budget-violations.json` - Violations (if any)

**PR Comments:**
- Workflow automatically posts performance results to PRs
- Shows baseline metrics table
- Highlights budget violations

### Local Results

**After running tests locally:**

```bash
# View baseline report
cat PERFORMANCE_BASELINE.md

# View violations (if any)
cat budget-violations.json

# View raw metrics
cat performance-metrics-$(date +%Y-%m-%d).json
```

### Trend Analysis

**Compare performance over time:**

```bash
# Download historical artifacts from GitHub Actions
# Compare metrics files from different dates

# Example: Compare with last week
diff performance-metrics-2025-11-12.json \
     performance-metrics-2025-11-19.json
```

## Troubleshooting

### Budget Violations

**Critical violations detected:**

1. **Check the violation report:**
   ```bash
   cat budget-violations.json
   ```

2. **Identify the affected test:**
   - Look for test name and metric (p95, throughput, etc.)
   - Check expected vs actual values

3. **Investigate the cause:**
   - Review recent code changes
   - Check for database query changes
   - Look for new dependencies or API calls
   - Profile the affected endpoint

4. **Fix or update budget:**
   - **Fix**: Optimize the code to meet budget
   - **Update**: If budget is unrealistic, update `.github/performance-budgets.json`

### Test Failures

**Performance tests failing:**

1. **Check server is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Check Redis is running:**
   ```bash
   redis-cli ping  # Should return "PONG"
   ```

3. **Check environment variables:**
   ```bash
   echo $RUN_PERFORMANCE_TESTS  # Should be "true"
   echo $TEST_API_URL           # Should be "http://localhost:3000"
   ```

4. **Review test logs:**
   ```bash
   # Run tests with verbose output
   npm test -- __tests__/performance/ --verbose
   ```

### Metrics Not Extracted

**`performance-results.json` empty or malformed:**

1. **Ensure tests output metrics:**
   - Tests should call `printMetrics()` from `utils/metrics-collector.ts`
   - Verify console output contains "Performance Metrics:" labels

2. **Check JSON output format:**
   ```bash
   # Verify JSON is valid
   cat performance-results.json | jq .
   ```

3. **Re-run with correct flags:**
   ```bash
   npm test -- __tests__/performance/ \
     --json \
     --outputFile=performance-results.json
   ```

### Workflow Fails to Start

**Nightly workflow doesn't run:**

1. **Check workflow is enabled:**
   - Go to: Actions → Nightly Performance Testing
   - Ensure workflow is not disabled

2. **Check cron schedule:**
   - Verify schedule: `0 2 * * *` (2 AM UTC)
   - Manually trigger: Click "Run workflow"

3. **Check branch protection:**
   - Workflow must be on default branch (main)

### High Memory Usage

**Tests fail with out-of-memory errors:**

1. **Increase Node memory:**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=8192"
   ```

2. **Reduce test concurrency:**
   ```bash
   npm test -- __tests__/performance/ --maxWorkers=1
   ```

3. **Run tests in batches:**
   ```bash
   # Run one category at a time
   npm test -- __tests__/performance/api/
   npm test -- __tests__/performance/queue/
   npm test -- __tests__/performance/integration/
   ```

## Best Practices

### Adding New Performance Tests

1. **Create test file** in appropriate category:
   ```
   __tests__/performance/[category]/[test-name].test.ts
   ```

2. **Use standard structure:**
   ```typescript
   import { generateLoad } from '../utils/load-generator';
   import { collectMetrics, printMetrics } from '../utils/metrics-collector';

   const runTests = process.env.RUN_PERFORMANCE_TESTS === 'true';
   const describeIf = runTests ? describe : describe.skip;

   describeIf('My Performance Test', () => {
     it('should meet performance budget', async () => {
       const results = await generateLoad(config, concurrency, total);
       const metrics = collectMetrics(results);
       printMetrics(metrics, 'Test Name');  // REQUIRED

       assertResponseTime(metrics, { p95: 1000 });
     });
   });
   ```

3. **Add budget** to `.github/performance-budgets.json`:
   ```json
   {
     "budgets": {
       "category": {
         "test-name": {
           "p50": 500,
           "p95": 1000,
           "errorRate": 5
         }
       }
     }
   }
   ```

4. **Test locally** before committing:
   ```bash
   export RUN_PERFORMANCE_TESTS=true
   npm test -- __tests__/performance/[category]/[test-name].test.ts
   ```

### Performance Regression Prevention

1. **Run performance tests locally** before pushing:
   - Large refactorings
   - Database query changes
   - New API endpoints
   - Dependency updates

2. **Monitor trends** over time:
   - Download weekly metrics
   - Compare with baseline
   - Identify gradual degradation

3. **Set realistic budgets:**
   - Based on actual measured performance
   - Account for variance (±10%)
   - Use warning thresholds (90%) for early detection

4. **Document performance goals:**
   - Add comments to test files
   - Explain why budget thresholds are set
   - Link to architecture decisions

---

## Additional Resources

- [Performance Optimization Guide](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Performance Test Architecture](__tests__/performance/README.md)
- [Load Generator Utilities](__tests__/performance/utils/load-generator.ts)
- [Metrics Collector Utilities](__tests__/performance/utils/metrics-collector.ts)
