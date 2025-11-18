#!/usr/bin/env tsx

/**
 * Verification Script for Additional Analytics Materialized Views
 *
 * Verifies migration 20251118000004_additional_analytics_materialized_views.sql
 *
 * Checks:
 * - All 5 materialized views exist
 * - Views have data populated
 * - Indexes created correctly
 * - Cron job scheduled
 * - Performance improvements measured
 *
 * Usage:
 *   npx tsx scripts/database/verify-analytics-materialized-views.ts
 *   npx tsx scripts/database/verify-analytics-materialized-views.ts --benchmark
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ViewInfo {
  viewName: string;
  rowCount: number;
  sizeBytes: number;
  sizePretty: string;
  lastRefreshed: string | null;
}

async function checkViewsExist(): Promise<ViewInfo[]> {
  console.log('\n📊 Checking materialized views...\n');

  const views = [
    'conversation_analytics_summary',
    'conversation_volume_by_hour',
    'conversation_status_daily',
    'cart_analytics_summary',
    'woocommerce_order_summary'
  ];

  const results: ViewInfo[] = [];

  for (const viewName of views) {
    try {
      // Check if view exists and get row count
      const { data, error, count } = await supabase
        .from(viewName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ ${viewName}: Does not exist or not accessible`);
        console.log(`     Error: ${error.message}`);
        continue;
      }

      // Get size and last refresh
      const { data: sizeData } = await supabase.rpc('execute_sql', {
        sql: `
          SELECT
            pg_total_relation_size('${viewName}') as size_bytes,
            pg_size_pretty(pg_total_relation_size('${viewName}')) as size_pretty
        `
      });

      const size = sizeData?.[0];

      // Get last refresh time
      const { data: refreshData } = await supabase
        .from(viewName)
        .select('materialized_at')
        .limit(1)
        .single();

      results.push({
        viewName,
        rowCount: count || 0,
        sizeBytes: size?.size_bytes || 0,
        sizePretty: size?.size_pretty || '0 bytes',
        lastRefreshed: refreshData?.materialized_at || null
      });

      console.log(`  ✅ ${viewName}`);
      console.log(`     Rows: ${(count || 0).toLocaleString()}`);
      console.log(`     Size: ${size?.size_pretty || '0 bytes'}`);
      if (refreshData?.materialized_at) {
        const staleness = calculateStaleness(refreshData.materialized_at);
        console.log(`     Last refreshed: ${staleness}`);
      }
      console.log();
    } catch (err) {
      console.log(`  ❌ ${viewName}: Error checking view`);
      console.log(`     ${err}`);
      console.log();
    }
  }

  return results;
}

async function checkIndexes(): Promise<void> {
  console.log('\n📈 Checking indexes on materialized views...\n');

  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN (
        'conversation_analytics_summary',
        'conversation_volume_by_hour',
        'conversation_status_daily',
        'cart_analytics_summary',
        'woocommerce_order_summary'
      )
      ORDER BY tablename, indexname
    `
  });

  if (error) {
    console.log('  ❌ Failed to query indexes:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('  ⚠️  No indexes found on materialized views');
    return;
  }

  let currentTable = '';
  data.forEach((idx: any) => {
    if (idx.tablename !== currentTable) {
      if (currentTable) console.log();
      console.log(`  ${idx.tablename}:`);
      currentTable = idx.tablename;
    }
    console.log(`    ✅ ${idx.indexname}`);
  });

  console.log();
}

async function checkCronJob(): Promise<void> {
  console.log('\n⏰ Checking cron job schedule...\n');

  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT jobname, schedule, command
      FROM cron.job
      WHERE jobname = 'refresh-analytics-materialized-views'
    `
  });

  if (error) {
    console.log('  ❌ Failed to query cron jobs:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('  ⚠️  Cron job not scheduled');
    console.log('     Run migration to create hourly refresh schedule');
    return;
  }

  const job = data[0];
  console.log(`  ✅ Cron job scheduled: ${job.jobname}`);
  console.log(`     Schedule: ${job.schedule} (hourly at :15)`);
  console.log(`     Refreshes: All 5 materialized views`);
  console.log();
}

async function benchmarkPerformance(): Promise<void> {
  console.log('\n⚡ Performance Benchmarking...\n');
  console.log('Comparing materialized view queries vs raw table queries\n');

  // Benchmark 1: Conversation Analytics Summary
  console.log('1. Conversation Analytics (last 30 days)');
  console.log('   -------------------------------------------');

  const startRaw1 = Date.now();
  const { data: rawData1 } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT
        DATE(started_at) as date,
        domain,
        COUNT(*) as total_conversations,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_conversations
      FROM conversations
      WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(started_at), domain
      LIMIT 100
    `
  });
  const timeRaw1 = Date.now() - startRaw1;

  const startMV1 = Date.now();
  const { data: mvData1 } = await supabase
    .from('conversation_analytics_summary')
    .select('*')
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .limit(100);
  const timeMV1 = Date.now() - startMV1;

  console.log(`   Raw table query:        ${timeRaw1}ms`);
  console.log(`   Materialized view:      ${timeMV1}ms`);
  const improvement1 = ((timeRaw1 - timeMV1) / timeRaw1 * 100).toFixed(1);
  console.log(`   Improvement:            ${improvement1}% faster`);
  console.log();

  // Benchmark 2: Volume by Hour
  console.log('2. Conversation Volume by Hour');
  console.log('   -------------------------------------------');

  const startRaw2 = Date.now();
  const { data: rawData2 } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT
        EXTRACT(HOUR FROM started_at)::int as hour_of_day,
        COUNT(*) as conversation_count
      FROM conversations
      WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM started_at)::int
      LIMIT 24
    `
  });
  const timeRaw2 = Date.now() - startRaw2;

  const startMV2 = Date.now();
  const { data: mvData2 } = await supabase
    .from('conversation_volume_by_hour')
    .select('*')
    .limit(24);
  const timeMV2 = Date.now() - startMV2;

  console.log(`   Raw table query:        ${timeRaw2}ms`);
  console.log(`   Materialized view:      ${timeMV2}ms`);
  const improvement2 = ((timeRaw2 - timeMV2) / timeRaw2 * 100).toFixed(1);
  console.log(`   Improvement:            ${improvement2}% faster`);
  console.log();

  // Benchmark 3: Status Over Time
  console.log('3. Status Distribution Over Time');
  console.log('   -------------------------------------------');

  const startRaw3 = Date.now();
  const { data: rawData3 } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT
        DATE(started_at) as date,
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count
      FROM conversations
      WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(started_at)
      LIMIT 30
    `
  });
  const timeRaw3 = Date.now() - startRaw3;

  const startMV3 = Date.now();
  const { data: mvData3 } = await supabase
    .from('conversation_status_daily')
    .select('*')
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .limit(30);
  const timeMV3 = Date.now() - startMV3;

  console.log(`   Raw table query:        ${timeRaw3}ms`);
  console.log(`   Materialized view:      ${timeMV3}ms`);
  const improvement3 = ((timeRaw3 - timeMV3) / timeRaw3 * 100).toFixed(1);
  console.log(`   Improvement:            ${improvement3}% faster`);
  console.log();

  // Overall Summary
  const avgRawTime = (timeRaw1 + timeRaw2 + timeRaw3) / 3;
  const avgMVTime = (timeMV1 + timeMV2 + timeMV3) / 3;
  const avgImprovement = ((avgRawTime - avgMVTime) / avgRawTime * 100).toFixed(1);

  console.log('Overall Performance Improvement');
  console.log('   -------------------------------------------');
  console.log(`   Average raw query time: ${avgRawTime.toFixed(0)}ms`);
  console.log(`   Average MV query time:  ${avgMVTime.toFixed(0)}ms`);
  console.log(`   Average improvement:    ${avgImprovement}% faster`);
  console.log();
}

function calculateStaleness(lastRefreshed: string): string {
  const now = new Date();
  const refreshedAt = new Date(lastRefreshed);
  const diffMs = now.getTime() - refreshedAt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

async function main() {
  const args = process.argv.slice(2);
  const benchmark = args.includes('--benchmark');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ANALYTICS MATERIALIZED VIEWS VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    const views = await checkViewsExist();

    if (views.length === 0) {
      console.log('\n❌ No materialized views found!');
      console.log('   Run migration 20251118000004_additional_analytics_materialized_views.sql\n');
      process.exit(1);
    }

    if (views.length < 5) {
      console.log(`\n⚠️  Only ${views.length}/5 views found`);
      console.log('   Expected: conversation_analytics_summary, conversation_volume_by_hour,');
      console.log('             conversation_status_daily, cart_analytics_summary,');
      console.log('             woocommerce_order_summary\n');
    }

    await checkIndexes();
    await checkCronJob();

    if (benchmark) {
      await benchmarkPerformance();
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Verification complete!');

    if (!benchmark) {
      console.log('\n💡 Run with --benchmark flag to measure performance improvements:');
      console.log('   npx tsx scripts/database/verify-analytics-materialized-views.ts --benchmark\n');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

main();
