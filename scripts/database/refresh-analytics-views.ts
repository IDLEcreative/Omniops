#!/usr/bin/env tsx
/**
 * Analytics Materialized Views Refresh Utility
 *
 * Purpose: Refresh materialized views for analytics queries to maintain
 *          optimal performance without blocking production queries
 *
 * Usage:
 *   npx tsx scripts/database/refresh-analytics-views.ts            # Refresh all views
 *   npx tsx scripts/database/refresh-analytics-views.ts --view=daily  # Refresh specific view
 *   npx tsx scripts/database/refresh-analytics-views.ts --check    # Check last refresh times
 *
 * Cron Job Setup (run nightly at 2 AM):
 *   0 2 * * * cd /path/to/omniops && npx tsx scripts/database/refresh-analytics-views.ts >> logs/analytics-refresh.log 2>&1
 *
 * Performance:
 *   - Uses REFRESH MATERIALIZED VIEW CONCURRENTLY (non-blocking)
 *   - Typically completes in 5-15 seconds for 10K+ messages
 *   - Safe to run during production hours
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

interface RefreshResult {
  view_name: string;
  refresh_time_ms: number;
  status: string;
}

interface ViewStats {
  view_name: string;
  row_count: number;
  size_bytes: number;
  size_pretty: string;
}

/**
 * Refresh all analytics materialized views using the helper function
 */
async function refreshAllViews(): Promise<void> {
  console.log('🔄 Refreshing all analytics materialized views...\n');

  const startTime = Date.now();

  // Call the PostgreSQL function that refreshes all views concurrently
  const { data, error } = await supabase.rpc('refresh_analytics_views');

  if (error) {
    console.error('❌ Error refreshing views:', error.message);
    process.exit(1);
  }

  const results = data as RefreshResult[];
  const totalTime = Date.now() - startTime;

  console.log('📊 Refresh Results:\n');
  console.log('┌─────────────────────────────┬──────────────┬──────────┐');
  console.log('│ View Name                   │ Time (ms)    │ Status   │');
  console.log('├─────────────────────────────┼──────────────┼──────────┤');

  for (const result of results) {
    const viewName = result.view_name.padEnd(27);
    const time = result.refresh_time_ms.toFixed(0).padStart(12);
    const status = result.status === 'SUCCESS' ? '✅ OK' : '❌ FAIL';
    console.log(`│ ${viewName} │ ${time} │ ${status.padEnd(8)} │`);
  }

  console.log('└─────────────────────────────┴──────────────┴──────────┘');
  console.log(`\n⏱️  Total refresh time: ${totalTime}ms`);

  // Check for any failures
  const failures = results.filter(r => r.status !== 'SUCCESS');
  if (failures.length > 0) {
    console.error('\n❌ Some views failed to refresh:');
    failures.forEach(f => {
      console.error(`   - ${f.view_name}: ${f.status}`);
    });
    process.exit(1);
  }

  console.log('\n✅ All views refreshed successfully!');
}

/**
 * Refresh a specific materialized view
 */
async function refreshSingleView(viewName: string): Promise<void> {
  const validViews = [
    'daily_analytics_summary',
    'hourly_usage_stats',
    'weekly_analytics_summary',
  ];

  if (!validViews.includes(viewName)) {
    console.error(`❌ Invalid view name: ${viewName}`);
    console.error(`   Valid options: ${validViews.join(', ')}`);
    process.exit(1);
  }

  console.log(`🔄 Refreshing ${viewName}...\n`);

  const startTime = Date.now();

  // Use CONCURRENTLY to avoid blocking queries
  const { error } = await supabase.rpc('query', {
    query: `REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`,
  });

  const endTime = Date.now();

  if (error) {
    console.error(`❌ Error refreshing ${viewName}:`, error.message);
    process.exit(1);
  }

  console.log(`✅ ${viewName} refreshed successfully!`);
  console.log(`⏱️  Time: ${endTime - startTime}ms`);
}

/**
 * Check last refresh times and view statistics
 */
async function checkRefreshStatus(): Promise<void> {
  console.log('📊 Analytics Materialized View Status\n');

  const views = [
    'daily_analytics_summary',
    'hourly_usage_stats',
    'weekly_analytics_summary',
  ];

  console.log('┌─────────────────────────────┬──────────┬──────────────┬────────────────────┐');
  console.log('│ View Name                   │ Rows     │ Size         │ Last Updated       │');
  console.log('├─────────────────────────────┼──────────┼──────────────┼────────────────────┤');

  for (const viewName of views) {
    // Get row count
    const { count, error: countError } = await supabase
      .from(viewName as any)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`❌ Error getting count for ${viewName}:`, countError.message);
      continue;
    }

    // Get view size and last updated time
    const { data: sizeData, error: sizeError } = await supabase.rpc('query', {
      query: `
        SELECT
          pg_size_pretty(pg_total_relation_size(c.oid)) as size_pretty,
          pg_total_relation_size(c.oid) as size_bytes,
          GREATEST(
            pg_stat_get_last_analyze_time(c.oid),
            pg_stat_get_last_autoanalyze_time(c.oid)
          ) as last_updated
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = '${viewName}'
          AND c.relkind = 'm'
      `,
    });

    if (sizeError) {
      console.error(`❌ Error getting size for ${viewName}:`, sizeError.message);
      continue;
    }

    const size = sizeData?.[0]?.size_pretty || 'N/A';
    const lastUpdated = sizeData?.[0]?.last_updated
      ? new Date(sizeData[0].last_updated).toLocaleString()
      : 'Never';

    const name = viewName.padEnd(27);
    const rowCount = (count || 0).toString().padStart(8);
    const sizeStr = size.padStart(12);
    const updated = lastUpdated.padEnd(18);

    console.log(`│ ${name} │ ${rowCount} │ ${sizeStr} │ ${updated} │`);
  }

  console.log('└─────────────────────────────┴──────────┴──────────────┴────────────────────┘');

  // Check if views need refresh (older than 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const { data: refreshCheck } = await supabase.rpc('query', {
    query: `
      SELECT
        c.relname as view_name,
        GREATEST(
          pg_stat_get_last_analyze_time(c.oid),
          pg_stat_get_last_autoanalyze_time(c.oid)
        ) as last_updated
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'm'
        AND c.relname IN ('daily_analytics_summary', 'hourly_usage_stats', 'weekly_analytics_summary')
    `,
  });

  if (refreshCheck) {
    const staleViews = refreshCheck.filter((v: any) => {
      const lastUpdated = v.last_updated ? new Date(v.last_updated).getTime() : 0;
      return lastUpdated < oneDayAgo;
    });

    if (staleViews.length > 0) {
      console.log('\n⚠️  Warning: The following views are older than 24 hours:');
      staleViews.forEach((v: any) => {
        console.log(`   - ${v.view_name}`);
      });
      console.log('\n   Run: npx tsx scripts/database/refresh-analytics-views.ts');
    } else {
      console.log('\n✅ All views are up to date (refreshed within 24 hours)');
    }
  }
}

/**
 * Display usage information
 */
function showUsage(): void {
  console.log(`
Analytics Materialized Views Refresh Utility

Usage:
  npx tsx scripts/database/refresh-analytics-views.ts [OPTIONS]

Options:
  --check              Check last refresh times and view statistics
  --view=VIEW_NAME     Refresh a specific view only
  --help               Show this help message

Views:
  daily_analytics_summary   Daily aggregated statistics
  hourly_usage_stats        Hourly usage patterns
  weekly_analytics_summary  Weekly trend analysis

Examples:
  # Refresh all views (recommended for cron job)
  npx tsx scripts/database/refresh-analytics-views.ts

  # Check view status
  npx tsx scripts/database/refresh-analytics-views.ts --check

  # Refresh only daily summary
  npx tsx scripts/database/refresh-analytics-views.ts --view=daily_analytics_summary

Cron Job (run nightly at 2 AM):
  0 2 * * * cd /path/to/omniops && npx tsx scripts/database/refresh-analytics-views.ts >> logs/analytics-refresh.log 2>&1
  `);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  if (args.includes('--check')) {
    await checkRefreshStatus();
    process.exit(0);
  }

  const viewArg = args.find(arg => arg.startsWith('--view='));
  if (viewArg) {
    const viewName = viewArg.split('=')[1];
    await refreshSingleView(viewName);
    process.exit(0);
  }

  // Default: refresh all views
  await refreshAllViews();
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
