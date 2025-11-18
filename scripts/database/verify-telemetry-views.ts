#!/usr/bin/env tsx
/**
 * Verification Script for Telemetry Materialized Views
 *
 * Purpose: Validate that the telemetry optimization migration was successful
 *
 * Checks:
 * 1. Materialized views exist
 * 2. Views contain data
 * 3. Indexes are present
 * 4. Refresh function works
 * 5. pg_cron job is scheduled
 * 6. Performance improvement (optional benchmark)
 *
 * Usage:
 *   npx tsx scripts/database/verify-telemetry-views.ts
 *   npx tsx scripts/database/verify-telemetry-views.ts --benchmark  # Include performance test
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

const results: CheckResult[] = [];

/**
 * Check if materialized views exist
 */
async function checkViewsExist(): Promise<void> {
  console.log('🔍 Checking if materialized views exist...');

  const expectedViews = [
    'chat_telemetry_domain_summary',
    'chat_telemetry_model_summary',
  ];

  try {
    const { data, error } = await supabase.rpc('query' as any, {
      query: `
        SELECT matviewname
        FROM pg_matviews
        WHERE schemaname = 'public'
          AND matviewname IN ('${expectedViews.join("','")}')
      `,
    });

    if (error) throw error;

    const foundViews = (data || []).map((row: any) => row.matviewname);
    const missingViews = expectedViews.filter(v => !foundViews.includes(v));

    if (missingViews.length === 0) {
      results.push({
        name: 'Materialized Views Exist',
        status: 'pass',
        message: `All ${expectedViews.length} views found`,
        details: foundViews,
      });
    } else {
      results.push({
        name: 'Materialized Views Exist',
        status: 'fail',
        message: `Missing views: ${missingViews.join(', ')}`,
        details: { found: foundViews, missing: missingViews },
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Materialized Views Exist',
      status: 'fail',
      message: `Error checking views: ${error.message}`,
    });
  }
}

/**
 * Check if views contain data
 */
async function checkViewsHaveData(): Promise<void> {
  console.log('🔍 Checking if views contain data...');

  const views = ['chat_telemetry_domain_summary', 'chat_telemetry_model_summary'];

  for (const view of views) {
    try {
      const { count, error } = await supabase
        .from(view as any)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      if (count && count > 0) {
        results.push({
          name: `${view} has data`,
          status: 'pass',
          message: `${count} rows`,
          details: { row_count: count },
        });
      } else {
        results.push({
          name: `${view} has data`,
          status: 'warn',
          message: 'View exists but is empty',
          details: { row_count: 0 },
        });
      }
    } catch (error: any) {
      results.push({
        name: `${view} has data`,
        status: 'fail',
        message: `Error: ${error.message}`,
      });
    }
  }
}

/**
 * Check if indexes exist
 */
async function checkIndexesExist(): Promise<void> {
  console.log('🔍 Checking if indexes exist...');

  const expectedIndexes = [
    'idx_chat_telemetry_rollups_bucket_granularity',
    'idx_chat_telemetry_rollups_recent',
    'idx_chat_telemetry_domain_rollups_cost',
    'idx_chat_telemetry_model_rollups_perf',
    'idx_chat_telemetry_domain_summary_domain',
    'idx_chat_telemetry_domain_summary_cost',
    'idx_chat_telemetry_domain_summary_recent',
    'idx_chat_telemetry_model_summary_model',
    'idx_chat_telemetry_model_summary_cost',
    'idx_chat_telemetry_model_summary_performance',
  ];

  try {
    const { data, error } = await supabase.rpc('query' as any, {
      query: `
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname IN ('${expectedIndexes.join("','")}')
      `,
    });

    if (error) throw error;

    const foundIndexes = (data || []).map((row: any) => row.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !foundIndexes.includes(idx));

    if (missingIndexes.length === 0) {
      results.push({
        name: 'Performance Indexes Exist',
        status: 'pass',
        message: `All ${expectedIndexes.length} indexes found`,
        details: foundIndexes,
      });
    } else {
      results.push({
        name: 'Performance Indexes Exist',
        status: 'warn',
        message: `Missing ${missingIndexes.length} indexes`,
        details: { found: foundIndexes, missing: missingIndexes },
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Performance Indexes Exist',
      status: 'fail',
      message: `Error checking indexes: ${error.message}`,
    });
  }
}

/**
 * Check if refresh function exists and works
 */
async function checkRefreshFunction(): Promise<void> {
  console.log('🔍 Checking refresh function...');

  try {
    const { data, error } = await supabase.rpc('refresh_telemetry_summary_views' as any);

    if (error) throw error;

    const results_data = data as Array<{ view_name: string; refresh_time_ms: number; status: string }>;
    const allSucceeded = results_data.every(r => r.status === 'SUCCESS');

    if (allSucceeded) {
      results.push({
        name: 'Refresh Function Works',
        status: 'pass',
        message: `All views refreshed successfully`,
        details: results_data,
      });
    } else {
      const failed = results_data.filter(r => r.status !== 'SUCCESS');
      results.push({
        name: 'Refresh Function Works',
        status: 'fail',
        message: `${failed.length} views failed to refresh`,
        details: failed,
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Refresh Function Works',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
  }
}

/**
 * Check if pg_cron job is scheduled
 */
async function checkCronJob(): Promise<void> {
  console.log('🔍 Checking pg_cron job...');

  try {
    const { data, error } = await supabase.rpc('query' as any, {
      query: `
        SELECT jobid, schedule, command
        FROM cron.job
        WHERE jobname = 'refresh-telemetry-summary-hourly'
      `,
    });

    if (error) throw error;

    if (data && data.length > 0) {
      const job = data[0];
      results.push({
        name: 'pg_cron Job Scheduled',
        status: 'pass',
        message: `Job scheduled: ${job.schedule}`,
        details: job,
      });
    } else {
      results.push({
        name: 'pg_cron Job Scheduled',
        status: 'warn',
        message: 'Job not found - views must be refreshed manually',
      });
    }
  } catch (error: any) {
    results.push({
      name: 'pg_cron Job Scheduled',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
  }
}

/**
 * Benchmark query performance (optional)
 */
async function benchmarkPerformance(): Promise<void> {
  console.log('🔍 Benchmarking query performance...');

  try {
    // Test 1: Domain summary (optimized)
    const start1 = Date.now();
    const { data: domainSummary, error: error1 } = await supabase
      .from('chat_telemetry_domain_summary' as any)
      .select('*');
    const time1 = Date.now() - start1;

    if (error1) throw error1;

    // Test 2: Model summary (optimized)
    const start2 = Date.now();
    const { data: modelSummary, error: error2 } = await supabase
      .from('chat_telemetry_model_summary' as any)
      .select('*');
    const time2 = Date.now() - start2;

    if (error2) throw error2;

    // Test 3: Rollup query (optimized)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const start3 = Date.now();
    const { data: rollups, error: error3 } = await supabase
      .from('chat_telemetry_rollups')
      .select('*')
      .eq('granularity', 'day')
      .gte('bucket_start', startDate.toISOString());
    const time3 = Date.now() - start3;

    if (error3) throw error3;

    const avgTime = (time1 + time2 + time3) / 3;

    if (avgTime < 200) {
      results.push({
        name: 'Query Performance',
        status: 'pass',
        message: `Average query time: ${avgTime.toFixed(0)}ms (excellent!)`,
        details: {
          domain_summary: `${time1}ms`,
          model_summary: `${time2}ms`,
          rollups_7d: `${time3}ms`,
          average: `${avgTime.toFixed(0)}ms`,
        },
      });
    } else if (avgTime < 500) {
      results.push({
        name: 'Query Performance',
        status: 'warn',
        message: `Average query time: ${avgTime.toFixed(0)}ms (acceptable)`,
        details: {
          domain_summary: `${time1}ms`,
          model_summary: `${time2}ms`,
          rollups_7d: `${time3}ms`,
          average: `${avgTime.toFixed(0)}ms`,
        },
      });
    } else {
      results.push({
        name: 'Query Performance',
        status: 'fail',
        message: `Average query time: ${avgTime.toFixed(0)}ms (too slow)`,
        details: {
          domain_summary: `${time1}ms`,
          model_summary: `${time2}ms`,
          rollups_7d: `${time3}ms`,
          average: `${avgTime.toFixed(0)}ms`,
        },
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Query Performance',
      status: 'fail',
      message: `Error: ${error.message}`,
    });
  }
}

/**
 * Print results
 */
function printResults(): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`);
    }
    console.log('');
  });

  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`⚠️  Warnings: ${warned}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log('='.repeat(80));

  if (failed > 0) {
    console.log('\n❌ VERIFICATION FAILED - Some checks did not pass');
    console.log('   Review the errors above and ensure migration was applied correctly.');
    process.exit(1);
  } else if (warned > 0) {
    console.log('\n⚠️  VERIFICATION PASSED WITH WARNINGS');
    console.log('   All critical checks passed, but some warnings were found.');
    process.exit(0);
  } else {
    console.log('\n✅ VERIFICATION PASSED - All checks successful!');
    console.log('   Telemetry materialized views are working correctly.');
    process.exit(0);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const includeBenchmark = process.argv.includes('--benchmark');

  console.log('🚀 Starting Telemetry Materialized Views Verification\n');

  await checkViewsExist();
  await checkViewsHaveData();
  await checkIndexesExist();
  await checkRefreshFunction();
  await checkCronJob();

  if (includeBenchmark) {
    await benchmarkPerformance();
  }

  printResults();
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
