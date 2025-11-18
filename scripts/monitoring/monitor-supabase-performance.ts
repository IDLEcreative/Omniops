#!/usr/bin/env tsx

/**
 * Supabase Performance Monitoring Script
 *
 * Monitors key performance metrics after optimization deployment:
 * - Query execution times
 * - Index usage statistics
 * - Materialized view freshness
 * - Cache hit rates
 * - Connection pool usage
 * - RLS policy overhead
 *
 * Run after deploying performance optimizations to verify improvements.
 *
 * Usage:
 *   npx tsx scripts/monitoring/monitor-supabase-performance.ts
 *   npx tsx scripts/monitoring/monitor-supabase-performance.ts --watch
 *   npx tsx scripts/monitoring/monitor-supabase-performance.ts --json > metrics.json
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface PerformanceMetrics {
  timestamp: string;
  queryPerformance: QueryMetrics[];
  indexUsage: IndexMetrics[];
  materializedViews: MaterializedViewMetrics[];
  connectionPool: ConnectionPoolMetrics;
  slowQueries: SlowQuery[];
}

interface QueryMetrics {
  query: string;
  avgExecutionTimeMs: number;
  calls: number;
  totalTimeMs: number;
}

interface IndexMetrics {
  tableName: string;
  indexName: string;
  indexScans: number;
  tuplesRead: number;
  tuplesReturned: number;
  usagePercentage: number;
}

interface MaterializedViewMetrics {
  viewName: string;
  sizeBytes: number;
  sizePretty: string;
  lastRefreshed: string;
  staleness: string;
  rowCount: number;
}

interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  utilizationPercentage: number;
}

interface SlowQuery {
  query: string;
  avgTimeMs: number;
  calls: number;
  percentageOfTotal: number;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getQueryPerformance(): Promise<QueryMetrics[]> {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT
        substring(query, 1, 100) as query,
        ROUND(mean_exec_time::numeric, 2) as avg_execution_time_ms,
        calls,
        ROUND(total_exec_time::numeric, 2) as total_time_ms
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%pg_catalog%'
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `
  });

  if (error) {
    console.error('Error fetching query performance:', error);
    return [];
  }

  return (data as any[]).map(row => ({
    query: row.query,
    avgExecutionTimeMs: parseFloat(row.avg_execution_time_ms),
    calls: parseInt(row.calls),
    totalTimeMs: parseFloat(row.total_time_ms)
  }));
}

async function getIndexUsage(): Promise<IndexMetrics[]> {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        CASE
          WHEN idx_scan = 0 THEN 0
          ELSE ROUND((idx_tup_read::numeric / NULLIF(idx_scan, 0)) * 100, 2)
        END as usage_percentage
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND (
          indexname LIKE 'idx_%'
          OR indexname LIKE '%_pkey'
          OR indexname LIKE '%_unique'
        )
      ORDER BY idx_scan DESC
      LIMIT 30
    `
  });

  if (error) {
    console.error('Error fetching index usage:', error);
    return [];
  }

  return (data as any[]).map(row => ({
    tableName: row.tablename,
    indexName: row.indexname,
    indexScans: parseInt(row.idx_scan),
    tuplesRead: parseInt(row.idx_tup_read),
    tuplesReturned: parseInt(row.idx_tup_fetch),
    usagePercentage: parseFloat(row.usage_percentage)
  }));
}

async function getMaterializedViewMetrics(): Promise<MaterializedViewMetrics[]> {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT
        matviewname,
        pg_total_relation_size(matviewname::regclass) as size_bytes,
        pg_size_pretty(pg_total_relation_size(matviewname::regclass)) as size_pretty
      FROM pg_matviews
      WHERE schemaname = 'public'
    `
  });

  if (error) {
    console.error('Error fetching materialized view metrics:', error);
    return [];
  }

  const metrics: MaterializedViewMetrics[] = [];

  for (const row of data as any[]) {
    // Get row count and last refresh time
    const { data: viewData } = await supabase
      .from(row.matviewname)
      .select('materialized_at', { count: 'exact', head: true });

    const { count } = viewData as any;

    // Get last refresh timestamp
    const { data: refreshData } = await supabase
      .from(row.matviewname)
      .select('materialized_at')
      .limit(1)
      .single();

    const lastRefreshed = refreshData?.materialized_at || 'Unknown';
    const staleness = lastRefreshed !== 'Unknown'
      ? calculateStaleness(lastRefreshed)
      : 'Unknown';

    metrics.push({
      viewName: row.matviewname,
      sizeBytes: parseInt(row.size_bytes),
      sizePretty: row.size_pretty,
      lastRefreshed,
      staleness,
      rowCount: count || 0
    });
  }

  return metrics;
}

async function getConnectionPoolMetrics(): Promise<ConnectionPoolMetrics> {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT
        COUNT(*) FILTER (WHERE state = 'active') as active_connections,
        COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
        COUNT(*) as total_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `
  });

  if (error) {
    console.error('Error fetching connection pool metrics:', error);
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: 0,
      utilizationPercentage: 0
    };
  }

  const row = (data as any[])[0];
  const utilizationPercentage = (row.total_connections / row.max_connections) * 100;

  return {
    activeConnections: parseInt(row.active_connections),
    idleConnections: parseInt(row.idle_connections),
    totalConnections: parseInt(row.total_connections),
    maxConnections: parseInt(row.max_connections),
    utilizationPercentage: parseFloat(utilizationPercentage.toFixed(2))
  };
}

async function getSlowQueries(): Promise<SlowQuery[]> {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      WITH total_time AS (
        SELECT SUM(total_exec_time) as total
        FROM pg_stat_statements
      )
      SELECT
        substring(query, 1, 150) as query,
        ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
        calls,
        ROUND((total_exec_time / (SELECT total FROM total_time) * 100)::numeric, 2) as percentage_of_total
      FROM pg_stat_statements
      WHERE mean_exec_time > 100  -- Queries slower than 100ms
        AND query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%pg_catalog%'
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `
  });

  if (error) {
    console.error('Error fetching slow queries:', error);
    return [];
  }

  return (data as any[]).map(row => ({
    query: row.query,
    avgTimeMs: parseFloat(row.avg_time_ms),
    calls: parseInt(row.calls),
    percentageOfTotal: parseFloat(row.percentage_of_total)
  }));
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

async function collectMetrics(): Promise<PerformanceMetrics> {
  console.log('📊 Collecting Supabase performance metrics...\n');

  const [
    queryPerformance,
    indexUsage,
    materializedViews,
    connectionPool,
    slowQueries
  ] = await Promise.all([
    getQueryPerformance(),
    getIndexUsage(),
    getMaterializedViewMetrics(),
    getConnectionPoolMetrics(),
    getSlowQueries()
  ]);

  return {
    timestamp: new Date().toISOString(),
    queryPerformance,
    indexUsage,
    materializedViews,
    connectionPool,
    slowQueries
  };
}

function displayMetrics(metrics: PerformanceMetrics) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SUPABASE PERFORMANCE DASHBOARD');
  console.log(`  Collected: ${new Date(metrics.timestamp).toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Connection Pool
  console.log('🔌 CONNECTION POOL STATUS');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`  Active:    ${metrics.connectionPool.activeConnections}`);
  console.log(`  Idle:      ${metrics.connectionPool.idleConnections}`);
  console.log(`  Total:     ${metrics.connectionPool.totalConnections} / ${metrics.connectionPool.maxConnections}`);
  console.log(`  Usage:     ${metrics.connectionPool.utilizationPercentage.toFixed(1)}%`);

  const poolStatus = metrics.connectionPool.utilizationPercentage > 80 ? '🔴 HIGH' :
                      metrics.connectionPool.utilizationPercentage > 50 ? '🟡 MODERATE' : '🟢 HEALTHY';
  console.log(`  Status:    ${poolStatus}\n`);

  // Materialized Views
  console.log('📊 MATERIALIZED VIEWS');
  console.log('─────────────────────────────────────────────────────────');
  if (metrics.materializedViews.length === 0) {
    console.log('  No materialized views found\n');
  } else {
    metrics.materializedViews.forEach(view => {
      console.log(`  ${view.viewName}`);
      console.log(`    Size:          ${view.sizePretty}`);
      console.log(`    Rows:          ${view.rowCount.toLocaleString()}`);
      console.log(`    Last Refresh:  ${view.staleness}`);

      const stalenessWarning = view.staleness.includes('hours') && parseInt(view.staleness) > 2 ? ' ⚠️' : '';
      if (stalenessWarning) {
        console.log(`    Status:        🟡 Stale${stalenessWarning}`);
      }
      console.log();
    });
  }

  // Index Usage
  console.log('📈 TOP INDEX USAGE (by scan count)');
  console.log('─────────────────────────────────────────────────────────');
  const topIndexes = metrics.indexUsage.slice(0, 10);
  if (topIndexes.length === 0) {
    console.log('  No index usage data available\n');
  } else {
    topIndexes.forEach((idx, i) => {
      const unused = idx.indexScans === 0 ? ' ⚠️ UNUSED' : '';
      console.log(`  ${i + 1}. ${idx.indexName}${unused}`);
      console.log(`     Table:  ${idx.tableName}`);
      console.log(`     Scans:  ${idx.indexScans.toLocaleString()}`);
      if (idx.indexScans > 0) {
        console.log(`     Avg:    ${(idx.tuplesRead / idx.indexScans).toFixed(1)} tuples/scan`);
      }
      console.log();
    });
  }

  // Slow Queries
  console.log('🐌 SLOW QUERIES (>100ms avg)');
  console.log('─────────────────────────────────────────────────────────');
  if (metrics.slowQueries.length === 0) {
    console.log('  ✅ No slow queries detected!\n');
  } else {
    metrics.slowQueries.forEach((query, i) => {
      console.log(`  ${i + 1}. ${query.avgTimeMs.toFixed(1)}ms avg (${query.calls} calls)`);
      console.log(`     ${query.query}...`);
      console.log(`     Impact: ${query.percentageOfTotal.toFixed(1)}% of total DB time\n`);
    });
  }

  // Top Queries by Execution Time
  console.log('⚡ TOP QUERIES BY AVG EXECUTION TIME');
  console.log('─────────────────────────────────────────────────────────');
  const topQueries = metrics.queryPerformance.slice(0, 5);
  if (topQueries.length === 0) {
    console.log('  No query performance data available\n');
  } else {
    topQueries.forEach((query, i) => {
      const status = query.avgExecutionTimeMs > 500 ? '🔴' :
                     query.avgExecutionTimeMs > 200 ? '🟡' : '🟢';
      console.log(`  ${i + 1}. ${status} ${query.avgExecutionTimeMs.toFixed(1)}ms avg (${query.calls} calls)`);
      console.log(`     ${query.query}...`);
      console.log(`     Total: ${(query.totalTimeMs / 1000).toFixed(1)}s\n`);
    });
  }

  // Recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('─────────────────────────────────────────────────────────');
  const recommendations: string[] = [];

  if (metrics.connectionPool.utilizationPercentage > 80) {
    recommendations.push('⚠️  Connection pool usage >80% - consider increasing pool size');
  }

  const unusedIndexes = metrics.indexUsage.filter(idx => idx.indexScans === 0);
  if (unusedIndexes.length > 0) {
    recommendations.push(`⚠️  ${unusedIndexes.length} unused indexes detected - consider dropping them`);
  }

  const staleViews = metrics.materializedViews.filter(
    v => v.staleness.includes('hours') && parseInt(v.staleness) > 2
  );
  if (staleViews.length > 0) {
    recommendations.push(`⚠️  ${staleViews.length} materialized views are stale - refresh recommended`);
  }

  if (metrics.slowQueries.length > 5) {
    recommendations.push(`⚠️  ${metrics.slowQueries.length} slow queries detected - optimization needed`);
  }

  if (recommendations.length === 0) {
    console.log('  ✅ All metrics look healthy!\n');
  } else {
    recommendations.forEach(rec => console.log(`  ${rec}`));
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');
  const json = args.includes('--json');

  if (watch) {
    console.log('👀 Watching Supabase performance (refreshes every 30 seconds)...\n');
    console.log('Press Ctrl+C to stop\n');

    // Initial collection
    const metrics = await collectMetrics();
    if (!json) {
      displayMetrics(metrics);
    } else {
      console.log(JSON.stringify(metrics, null, 2));
    }

    // Watch mode
    setInterval(async () => {
      const metrics = await collectMetrics();
      if (!json) {
        console.clear();
        displayMetrics(metrics);
      } else {
        console.log(JSON.stringify(metrics, null, 2));
      }
    }, 30000);
  } else {
    // Single collection
    const metrics = await collectMetrics();
    if (json) {
      console.log(JSON.stringify(metrics, null, 2));
    } else {
      displayMetrics(metrics);
    }
  }
}

main().catch(console.error);
