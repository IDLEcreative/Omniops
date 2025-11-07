#!/usr/bin/env tsx
/**
 * Analytics Query Performance Benchmark
 *
 * Purpose: Measure query performance improvements from materialized views
 *          and verify 70-80% speed improvement target
 *
 * Usage:
 *   npx tsx scripts/database/benchmark-analytics-queries.ts
 *   npx tsx scripts/database/benchmark-analytics-queries.ts --domain=example.com
 *
 * Requirements:
 *   - Development server must be running (npm run dev)
 *   - Materialized views must be created and populated
 *   - At least 1000+ messages in database for meaningful results
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface BenchmarkResult {
  query: string;
  method: 'raw' | 'materialized_view';
  timeMs: number;
  rowCount: number;
  dateRange: string;
}

/**
 * Benchmark raw query against messages table
 */
async function benchmarkRawQuery(
  domain: string,
  daysAgo: number
): Promise<BenchmarkResult> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const startTime = Date.now();

  let query = supabase
    .from('messages')
    .select('created_at, metadata', { count: 'exact' })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (domain !== 'all') {
    query = query.eq('domain', domain);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Raw query failed: ${error.message}`);
  }

  const endTime = Date.now();

  return {
    query: 'fetchMessagesForUsageAnalysis (raw)',
    method: 'raw',
    timeMs: endTime - startTime,
    rowCount: count || 0,
    dateRange: `${daysAgo} days`,
  };
}

/**
 * Benchmark materialized view query
 */
async function benchmarkMaterializedView(
  domain: string,
  daysAgo: number
): Promise<BenchmarkResult> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const startTime = Date.now();

  let query = supabase
    .from('hourly_usage_stats' as any)
    .select('*', { count: 'exact' })
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  if (domain !== 'all') {
    // Get domain_id
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', domain)
      .single();

    if (domainData) {
      query = query.eq('domain_id', domainData.id);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Materialized view query failed: ${error.message}`);
  }

  const endTime = Date.now();

  return {
    query: 'fetchMessagesForUsageAnalysis (view)',
    method: 'materialized_view',
    timeMs: endTime - startTime,
    rowCount: count || 0,
    dateRange: `${daysAgo} days`,
  };
}

/**
 * Calculate performance improvement percentage
 */
function calculateImprovement(rawMs: number, viewMs: number): number {
  return Math.round(((rawMs - viewMs) / rawMs) * 100);
}

/**
 * Format result table row
 */
function formatResultRow(result: BenchmarkResult): string {
  const query = result.query.padEnd(40);
  const method = result.method.padEnd(20);
  const time = result.timeMs.toString().padStart(8);
  const rows = result.rowCount.toString().padStart(8);
  const range = result.dateRange.padEnd(12);

  return `│ ${query} │ ${method} │ ${time} │ ${rows} │ ${range} │`;
}

/**
 * Run comprehensive benchmark suite
 */
async function runBenchmarks(domain: string): Promise<void> {
  console.log('🚀 Analytics Query Performance Benchmark\n');
  console.log(`Testing domain: ${domain === 'all' ? 'ALL' : domain}\n`);

  // Test different date ranges
  const dateRanges = [7, 14, 30, 90];
  const results: BenchmarkResult[] = [];

  console.log('Running benchmarks...\n');

  for (const days of dateRanges) {
    console.log(`📊 Testing ${days}-day range...`);

    // Benchmark raw query
    try {
      const rawResult = await benchmarkRawQuery(domain, days);
      results.push(rawResult);
      console.log(`   Raw query: ${rawResult.timeMs}ms (${rawResult.rowCount} rows)`);
    } catch (error: any) {
      console.error(`   ❌ Raw query failed: ${error.message}`);
    }

    // Benchmark materialized view
    try {
      const viewResult = await benchmarkMaterializedView(domain, days);
      results.push(viewResult);
      console.log(`   Materialized view: ${viewResult.timeMs}ms (${viewResult.rowCount} rows)`);

      // Calculate improvement
      const rawResult = results.find(
        r => r.dateRange === `${days} days` && r.method === 'raw'
      );

      if (rawResult) {
        const improvement = calculateImprovement(rawResult.timeMs, viewResult.timeMs);
        const emoji = improvement >= 70 ? '🎯' : improvement >= 50 ? '✅' : '⚠️';
        console.log(`   ${emoji} Improvement: ${improvement}% faster\n`);
      }
    } catch (error: any) {
      console.error(`   ❌ Materialized view query failed: ${error.message}\n`);
    }
  }

  // Display summary table
  console.log('\n📋 Benchmark Results Summary\n');
  console.log('┌──────────────────────────────────────────┬──────────────────────┬──────────┬──────────┬──────────────┐');
  console.log('│ Query                                    │ Method               │ Time(ms) │ Rows     │ Range        │');
  console.log('├──────────────────────────────────────────┼──────────────────────┼──────────┼──────────┼──────────────┤');

  for (const result of results) {
    console.log(formatResultRow(result));
  }

  console.log('└──────────────────────────────────────────┴──────────────────────┴──────────┴──────────┴──────────────┘');

  // Calculate and display performance improvements
  console.log('\n📈 Performance Improvements:\n');

  let goalsMet = 0;
  let totalTests = 0;

  for (const days of dateRanges) {
    const rawResult = results.find(
      r => r.dateRange === `${days} days` && r.method === 'raw'
    );
    const viewResult = results.find(
      r => r.dateRange === `${days} days` && r.method === 'materialized_view'
    );

    if (rawResult && viewResult) {
      totalTests++;
      const improvement = calculateImprovement(rawResult.timeMs, viewResult.timeMs);
      const status = improvement >= 70 ? '🎯 GOAL MET' : improvement >= 50 ? '✅ GOOD' : '⚠️  NEEDS WORK';

      console.log(`${status}: ${days}-day range → ${improvement}% faster (${rawResult.timeMs}ms → ${viewResult.timeMs}ms)`);

      if (improvement >= 70) {
        goalsMet++;
      }
    }
  }

  // Final verdict
  console.log('\n' + '='.repeat(80));

  if (goalsMet === totalTests && totalTests > 0) {
    console.log('\n🎉 SUCCESS! All queries meet 70-80% performance improvement goal!\n');
  } else if (goalsMet > 0) {
    console.log(`\n✅ ${goalsMet}/${totalTests} queries meet performance goal (70%+ improvement)`);
    console.log(`⚠️  ${totalTests - goalsMet} queries need optimization\n`);
  } else {
    console.log('\n❌ Performance goals not met. Consider:');
    console.log('   1. Refreshing materialized views: npx tsx scripts/database/refresh-analytics-views.ts');
    console.log('   2. Ensuring indexes are created properly');
    console.log('   3. Checking if views have enough data\n');
  }

  // Database health check
  console.log('🔍 Database Health Check:\n');

  // Check view existence and row counts
  for (const viewName of ['daily_analytics_summary', 'hourly_usage_stats', 'weekly_analytics_summary']) {
    const { count, error } = await supabase
      .from(viewName as any)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ ${viewName}: Not found or error`);
    } else {
      const status = count && count > 0 ? '✅' : '⚠️';
      console.log(`   ${status} ${viewName}: ${count || 0} rows`);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let domain = 'all';
  const domainArg = args.find(arg => arg.startsWith('--domain='));
  if (domainArg) {
    domain = domainArg.split('=')[1];
  }

  try {
    await runBenchmarks(domain);
  } catch (error: any) {
    console.error('\n❌ Benchmark failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure materialized views are created:');
    console.error('   - Check migration: supabase/migrations/*_analytics_materialized_views.sql');
    console.error('   - Apply migration if needed\n');
    console.error('2. Ensure views are populated:');
    console.error('   npx tsx scripts/database/refresh-analytics-views.ts\n');
    console.error('3. Ensure database has test data:');
    console.error('   - Need at least 1000+ messages for meaningful results\n');
    process.exit(1);
  }
}

main();
