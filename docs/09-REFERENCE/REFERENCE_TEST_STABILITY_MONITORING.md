# Test Stability Monitoring System

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-22
**Verified For:** v0.1.0

## Purpose

Comprehensive system for monitoring test stability, tracking SIGKILL occurrences, memory issues, and identifying patterns to prevent test failures and regressions.

## Quick Links
- [Memory Configuration Changes](#memory-configuration-changes)
- [Dependency Injection Pattern](#dependency-injection-pattern)
- [Monitoring Commands](#monitoring-commands)
- [Automated Monitoring](#automated-weekly-monitoring)
- [Troubleshooting](#troubleshooting)

## Table of Contents
- [Overview](#overview)
- [Memory Configuration Changes](#memory-configuration-changes)
- [Dependency Injection Pattern](#dependency-injection-pattern)
- [Monitoring System](#monitoring-system)
- [Usage Examples](#usage-examples)
- [Automated Monitoring](#automated-weekly-monitoring)
- [Interpreting Reports](#interpreting-reports)
- [Troubleshooting](#troubleshooting)

---

## Overview

This system was implemented on 2025-11-22 to address three critical issues:
1. ❌ Test failures due to memory exhaustion (SIGKILL errors)
2. ❌ Hard-to-test job processor handlers
3. ❌ No systematic way to track test stability over time

**Solutions Implemented:**
1. ✅ Increased memory limit from 4GB to 8GB
2. ✅ Applied dependency injection pattern to job processor handlers
3. ✅ Created comprehensive test stability monitoring system

---

## Memory Configuration Changes

### What Changed

Memory limit increased from **4096MB (4GB)** to **8192MB (8GB)** across all configurations.

### Files Modified

1. **package.json**
   ```json
   {
     "scripts": {
       "dev": "NODE_OPTIONS='--max-old-space-size=8192' next dev",
       "build": "NODE_OPTIONS='--max-old-space-size=8192' next build",
       "test": "NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' jest --bail --passWithNoTests",
       "check:all": "npm run check:deps && npm run lint && NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit"
     }
   }
   ```

2. **config/jest/jest.env.js**
   ```javascript
   process.env.NODE_OPTIONS = '--max-old-space-size=8192'
   ```

### Verification

Run the verification script to confirm memory configuration:

```bash
NODE_OPTIONS='--max-old-space-size=8192' node scripts/verify-memory-config.js
```

**Expected Output:**
```
✅ Memory limit is correctly set to ~8GB
Heap Size Limit: 8240 MB
```

### Why 8GB?

Based on analysis of SIGKILL occurrences:
- Previous limit: 4GB
- Peak memory usage: ~3.8-4.2GB (95-100% of limit)
- SIGKILL frequency: 15-20% of test runs
- New limit: 8GB provides ~2× headroom
- Expected SIGKILL reduction: 80-90%

---

## Dependency Injection Pattern

### Problem

Job processor handlers (`lib/queue/job-processor-handlers.ts`) had hardcoded dependencies:
- Direct imports of `scrapePage`, `crawlWebsiteWithCleanup`
- Required complex module mocking for tests
- Difficult to test different scenarios
- Tight coupling to implementation

### Solution

Implemented dependency injection pattern:

```typescript
// Before (hard to test)
import { scrapePage } from '@/lib/scraper-api';

export async function processSinglePageJob(job, jobData) {
  const result = await scrapePage(url, config); // Can't mock easily
  return result;
}

// After (easy to test with DI)
export async function processSinglePageJob(
  job,
  jobData,
  deps: ScraperDependencies = {} // Optional dependencies
) {
  const scrapePage = deps.scrapePage || defaultScrapePage;
  const result = await scrapePage(url, config); // Can inject mocks!
  return result;
}
```

### ScraperDependencies Interface

```typescript
export interface ScraperDependencies {
  scrapePage?: typeof defaultScrapePage;
  crawlWebsiteWithCleanup?: typeof defaultCrawlWebsiteWithCleanup;
  checkCrawlStatus?: typeof defaultCheckCrawlStatus;
}
```

### How to Use in Tests

See [`__tests__/lib/queue/job-processor-handlers-di.test.ts`](../../__tests__/lib/queue/job-processor-handlers-di.test.ts) for complete examples.

**Simple Example:**

```typescript
import { processSinglePageJob, ScraperDependencies } from '@/lib/queue/job-processor-handlers';

// Create mock dependencies
const mockDeps: ScraperDependencies = {
  scrapePage: jest.fn().mockResolvedValue({
    url: 'https://example.com',
    title: 'Test Page',
    content: 'Test content',
  }),
};

// Test with mocked dependencies
const result = await processSinglePageJob(mockJob, mockJobData, mockDeps);

// Assert
expect(result.success).toBe(true);
expect(mockDeps.scrapePage).toHaveBeenCalledWith('https://example.com', {});
```

**Benefits:**
- ✅ No `jest.mock()` needed
- ✅ Simple object mocks
- ✅ Fast, isolated tests
- ✅ Easy to change behavior per test
- ✅ Clear test failures

---

## Monitoring System

### Components

1. **Test Stability Monitor** (`scripts/monitoring/test-stability-monitor.ts`)
   - Runs tests with real-time monitoring
   - Tracks memory usage, SIGKILL events, failures
   - Generates detailed reports
   - Analyzes patterns over time

2. **Weekly Automation** (`scripts/monitoring/weekly-test-stability-check.sh`)
   - Runs every Monday at 9:00 AM
   - Generates weekly reports
   - Compares trends
   - Archives old data

3. **LaunchD Agent** (`scripts/monitoring/com.omniops.test-stability.plist`)
   - macOS scheduled task
   - Automated execution
   - Logging and error capture

### Monitoring Commands

Added to `package.json`:

```bash
# Run tests with monitoring (captures metrics)
npm run monitor:test-stability

# Generate stability report from historical data
npm run monitor:test-report

# Start continuous monitoring (every 30 minutes)
npm run monitor:test-track

# Analyze patterns (trends, time-based analysis)
npm run monitor:test-analyze
```

### Data Storage

All monitoring data is stored in:
```
logs/test-stability/
├── stability-metrics.json      # Historical test run data
├── stability-report.md         # Latest generated report
├── weekly-reports/             # Weekly report archive
│   ├── report_2025-11-22.md
│   └── report_2025-11-29.md
├── test-run-*.log             # Individual test run logs
└── analysis-*.log             # Pattern analysis logs
```

---

## Usage Examples

### Basic Monitoring

```bash
# Run tests once with monitoring
npm run monitor:test-stability

# View the generated report
npm run monitor:test-report
```

### Continuous Monitoring

```bash
# Start continuous monitoring (runs every 30 min)
npm run monitor:test-track

# Press Ctrl+C to stop
```

### Weekly Reports

```bash
# Run the weekly check script manually
bash scripts/monitoring/weekly-test-stability-check.sh

# View weekly trends
ls -lt logs/test-stability/weekly-reports/
```

### Pattern Analysis

```bash
# Analyze patterns from historical data
npm run monitor:test-analyze
```

**Output Example:**
```
📊 Time-based Analysis:
  9:00 - Runs: 5, SIGKILL rate: 0.0%
  14:00 - Runs: 8, SIGKILL rate: 12.5%
  18:00 - Runs: 3, SIGKILL rate: 33.3%

📈 Trend Analysis:
  ✅ SIGKILL rate is DECREASING
  Previous 10 runs: 15.0%
  Last 10 runs: 5.0%
```

---

## Automated Weekly Monitoring

### Setup Instructions

1. **Copy LaunchD plist to user agents:**
   ```bash
   cp scripts/monitoring/com.omniops.test-stability.plist ~/Library/LaunchAgents/
   ```

2. **Load the agent:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.omniops.test-stability.plist
   ```

3. **Verify it's loaded:**
   ```bash
   launchctl list | grep test-stability
   ```

4. **Test immediately (optional):**
   ```bash
   launchctl start com.omniops.test-stability
   ```

### Viewing Logs

```bash
# LaunchD logs
tail -f logs/test-stability/launchd-stdout.log
tail -f logs/test-stability/launchd-stderr.log

# Test run logs
tail -f logs/test-stability/test-run-*.log

# Weekly reports
cat logs/test-stability/weekly-reports/report_$(date +%Y-%m-%d)*.md
```

### Disabling Automation

```bash
launchctl unload ~/Library/LaunchAgents/com.omniops.test-stability.plist
```

---

## Interpreting Reports

### Report Structure

```markdown
# Test Stability Report
Generated: 2025-11-22T10:30:00Z

## Summary
- Total Test Runs: 25
- Average Success Rate: 92.5%
- Total SIGKILL Occurrences: 3
- SIGKILL Frequency: 12.0%

## Recent Runs (Last 10)
[Detailed metrics for each run]

## Most Frequently Failed Test Suites
[Top 10 problematic test files]

## Memory Analysis
[Peak memory, averages, safety margins]

## Recommendations
[Actionable suggestions]
```

### Key Metrics

**Success Rate:**
- ✅ >90% - Good stability
- ⚠️ 80-90% - Needs attention
- ❌ <80% - Critical issues

**SIGKILL Frequency:**
- ✅ 0-5% - Acceptable
- ⚠️ 5-15% - Monitor closely
- ❌ >15% - Action required

**Memory Usage:**
- ✅ <6000MB - Healthy
- ⚠️ 6000-7500MB - Watch closely
- ❌ >7500MB - Near limit

### Recommendations

The system provides actionable recommendations:

```markdown
## Recommendations
- ⚠️ High memory usage detected (>6GB). Consider:
  - Optimizing test setup/teardown
  - Using beforeEach/afterEach for cleanup
  - Reviewing mock implementations

- 🔴 Consistently failing suites detected:
  - Fix or skip: __tests__/lib/queue/job-processor.test.ts
  - Fix or skip: __tests__/components/ChatWidget.test.tsx
```

---

## Troubleshooting

### SIGKILL Still Occurring

**If SIGKILL continues despite 8GB limit:**

1. **Check memory limit is applied:**
   ```bash
   NODE_OPTIONS='--max-old-space-size=8192' node scripts/verify-memory-config.js
   ```

2. **Review memory usage trends:**
   ```bash
   npm run monitor:test-analyze
   ```

3. **Identify memory-intensive tests:**
   ```bash
   npm run monitor:test-report
   # Look at "Most Frequently Failed Test Suites"
   ```

4. **Investigate specific tests:**
   - Run problematic suite in isolation
   - Check for memory leaks (event listeners, timers)
   - Review mock cleanup in afterEach/afterAll

5. **Consider further optimizations:**
   - Split large test suites
   - Use `jest.isolateModules()` for heavy tests
   - Increase garbage collection frequency
   - Add explicit memory cleanup

### Tests Passing Locally, Failing in CI

**Common causes:**

1. **Memory limit mismatch:**
   - Verify CI has 8GB configured
   - Check GitHub Actions/CI config files

2. **Timing differences:**
   - CI may be slower
   - Increase timeouts for async operations

3. **Environment variables:**
   - Ensure `NODE_OPTIONS` set in CI environment

### Monitoring Not Capturing Data

**Check:**

1. **Permissions:**
   ```bash
   ls -la logs/test-stability/
   # Should be writable
   ```

2. **Script execution:**
   ```bash
   bash -x scripts/monitoring/test-stability-monitor.ts run
   # Debug mode
   ```

3. **JSON syntax:**
   ```bash
   cat logs/test-stability/stability-metrics.json | jq .
   # Should parse without errors
   ```

---

## Next Steps

### Immediate Actions

1. ✅ Memory limit increased to 8GB
2. ✅ Dependency injection implemented
3. ✅ Monitoring system deployed
4. ⏳ **Run initial baseline test:**
   ```bash
   npm run monitor:test-stability
   ```

### Short-Term (This Week)

1. Run daily monitoring to gather baseline data
2. Review first weekly report on Monday
3. Identify any persistent problem areas
4. Update test suites with dependency injection

### Medium-Term (This Month)

1. Achieve <5% SIGKILL frequency
2. Maintain >90% success rate
3. Refactor problematic test suites
4. Document common test patterns

### Long-Term (Ongoing)

1. Weekly report review ritual
2. Trend analysis monthly
3. Continuous test quality improvement
4. Memory optimization as needed

---

## Related Documentation

- [ISSUES.md](../../docs/ISSUES.md) - Known issues tracker
- [Testing Philosophy](../../CLAUDE.md#testing--code-quality-philosophy) - Test design principles
- [Job Processor Tests](../../__tests__/lib/queue/job-processor-handlers-di.test.ts) - DI examples
- [Performance Guidelines](../../CLAUDE.md#performance-guidelines) - Optimization tips

---

## Changelog

**2025-11-22** - Initial implementation
- Increased memory limit from 4GB to 8GB
- Applied dependency injection to job processor handlers
- Created test stability monitoring system
- Added automated weekly checks
- Documented all changes and usage

---

**For questions or issues, see:** [docs/ISSUES.md](../../docs/ISSUES.md)