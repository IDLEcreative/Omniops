/**
 * Dashboard Query Benchmark
 *
 * Measures performance improvement from N+1 query fix
 *
 * Usage:
 * ```bash
 * npx tsx scripts/benchmark-dashboard.ts
 * ```
 *
 * Expected Results:
 * - Query Count: 20+ → 3-4 queries
 * - Average Time: ~1000ms → ~100ms
 * - 80-90% improvement
 */

import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/queries/dashboard-stats';
import { getQueryLogger } from '@/lib/query-logger';

interface BenchmarkResult {
  run: number;
  duration: number;
  queryCount: number;
  success: boolean;
  error?: string;
}

async function benchmark() {
  console.log('=================================');
  console.log('Dashboard Query Benchmark');
  console.log('=================================\n');

  const runs = 10;
  const results: BenchmarkResult[] = [];

  // Get Supabase client
  const supabase = await createClient();

  // Get current user (for testing)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ Error: Not authenticated');
    console.error('   Please ensure you are logged in');
    process.exit(1);
  }

  console.log(`Testing with user: ${user.email}`);
  console.log(`Running ${runs} iterations...\n`);

  for (let i = 0; i < runs; i++) {
    const logger = getQueryLogger();
    logger.reset();

    try {
      const start = performance.now();
      await getDashboardStats(supabase, user.id);
      const duration = performance.now() - start;

      results.push({
        run: i + 1,
        duration,
        queryCount: logger.getQueryCount(),
        success: true
      });

      console.log(`Run ${i + 1}: ${duration.toFixed(2)}ms (${logger.getQueryCount()} queries)`);
    } catch (error) {
      results.push({
        run: i + 1,
        duration: 0,
        queryCount: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });

      console.log(`Run ${i + 1}: ❌ Failed - ${error instanceof Error ? error.message : error}`);
    }
  }

  // Calculate statistics
  const successfulRuns = results.filter(r => r.success);

  if (successfulRuns.length === 0) {
    console.error('\n❌ All runs failed. Cannot calculate statistics.');
    process.exit(1);
  }

  const times = successfulRuns.map(r => r.duration);
  const queryCounts = successfulRuns.map(r => r.queryCount);

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
  const avgQueries = queryCounts.reduce((a, b) => a + b, 0) / queryCounts.length;

  console.log('\n=== Results ===');
  console.log(`Successful Runs: ${successfulRuns.length}/${runs}`);
  console.log(`\nQuery Statistics:`);
  console.log(`  Average Queries: ${avgQueries.toFixed(1)}`);
  console.log(`  Target: ≤4 queries`);

  if (avgQueries <= 4) {
    console.log(`  ✅ PASS - Query count within target`);
  } else {
    console.log(`  ❌ FAIL - Too many queries (${avgQueries.toFixed(1)} > 4)`);
  }

  console.log(`\nPerformance Statistics:`);
  console.log(`  Average: ${avg.toFixed(2)}ms`);
  console.log(`  Median:  ${median.toFixed(2)}ms`);
  console.log(`  Min:     ${min.toFixed(2)}ms`);
  console.log(`  Max:     ${max.toFixed(2)}ms`);
  console.log(`  Target:  <500ms`);

  if (avg < 500) {
    console.log(`  ✅ PASS - Performance within target`);
  } else {
    console.log(`  ❌ FAIL - Too slow (${avg.toFixed(2)}ms > 500ms)`);
  }

  // Calculate improvement from baseline
  const baselineTime = 1000; // Estimated before optimization
  const baselineQueries = 20; // Estimated before optimization

  const timeImprovement = ((baselineTime - avg) / baselineTime) * 100;
  const queryImprovement = ((baselineQueries - avgQueries) / baselineQueries) * 100;

  console.log(`\n=== Improvement ===`);
  console.log(`Time Improvement:  ${timeImprovement.toFixed(1)}% faster`);
  console.log(`Query Reduction:   ${queryImprovement.toFixed(1)}% fewer queries`);

  console.log('\n=== Overall Status ===');

  if (avgQueries <= 4 && avg < 500) {
    console.log('✅ ALL CHECKS PASSED');
    console.log('   Dashboard queries optimized successfully!');
    process.exit(0);
  } else {
    console.log('❌ SOME CHECKS FAILED');
    console.log('   Dashboard queries need further optimization');
    process.exit(1);
  }
}

// Run benchmark
benchmark().catch(error => {
  console.error('\n❌ Benchmark failed:', error);
  process.exit(1);
});
