/**
 * Supabase Metrics Collection Functions
 *
 * @purpose Data collection functions for Supabase performance monitoring
 *
 * @flow
 *   1. Each collector executes specific SQL queries via Supabase RPC
 *   2. Results are parsed and transformed into typed metrics
 *   3. All collectors can run in parallel via Promise.all
 *
 * @keyFunctions
 *   - getQueryPerformance: Top 20 queries by avg execution time
 *   - getIndexUsage: Index scan statistics and usage patterns
 *   - getMaterializedViewMetrics: View sizes, row counts, staleness
 *   - getConnectionPoolMetrics: Active/idle connections, utilization
 *   - getSlowQueries: Queries averaging >100ms
 *   - collectMetrics: Orchestrates all collectors in parallel
 *
 * @dependencies
 *   - @supabase/supabase-js
 *   - NEXT_PUBLIC_SUPABASE_URL (env)
 *   - SUPABASE_SERVICE_ROLE_KEY (env)
 *
 * @consumers
 *   - scripts/monitoring/monitor-supabase-performance.ts
 *
 * @totalLines 218
 */

import { createClient } from '@supabase/supabase-js';
import type {
  PerformanceMetrics,
  QueryMetrics,
  IndexMetrics,
  MaterializedViewMetrics,
  ConnectionPoolMetrics,
  SlowQuery
} from './supabase-performance-types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function getQueryPerformance(): Promise<QueryMetrics[]> {
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

export async function getIndexUsage(): Promise<IndexMetrics[]> {
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

export async function getMaterializedViewMetrics(): Promise<MaterializedViewMetrics[]> {
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

export async function getConnectionPoolMetrics(): Promise<ConnectionPoolMetrics> {
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

export async function getSlowQueries(): Promise<SlowQuery[]> {
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
      WHERE mean_exec_time > 100
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

export async function collectMetrics(): Promise<PerformanceMetrics> {
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
