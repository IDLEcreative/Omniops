/**
 * Supabase Performance Monitoring Types
 *
 * @purpose Type definitions for Supabase performance monitoring system
 *
 * @exports
 *   - PerformanceMetrics: Complete metrics snapshot
 *   - QueryMetrics: Individual query performance data
 *   - IndexMetrics: Index usage statistics
 *   - MaterializedViewMetrics: View metadata and staleness
 *   - ConnectionPoolMetrics: Connection pool status
 *   - SlowQuery: Slow query identification data
 *
 * @consumers
 *   - scripts/monitoring/monitor-supabase-performance.ts
 *   - scripts/monitoring/supabase-metrics-collectors.ts
 *   - scripts/monitoring/supabase-metrics-display.ts
 *
 * @totalLines 66
 */

export interface PerformanceMetrics {
  timestamp: string;
  queryPerformance: QueryMetrics[];
  indexUsage: IndexMetrics[];
  materializedViews: MaterializedViewMetrics[];
  connectionPool: ConnectionPoolMetrics;
  slowQueries: SlowQuery[];
}

export interface QueryMetrics {
  query: string;
  avgExecutionTimeMs: number;
  calls: number;
  totalTimeMs: number;
}

export interface IndexMetrics {
  tableName: string;
  indexName: string;
  indexScans: number;
  tuplesRead: number;
  tuplesReturned: number;
  usagePercentage: number;
}

export interface MaterializedViewMetrics {
  viewName: string;
  sizeBytes: number;
  sizePretty: string;
  lastRefreshed: string;
  staleness: string;
  rowCount: number;
}

export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  utilizationPercentage: number;
}

export interface SlowQuery {
  query: string;
  avgTimeMs: number;
  calls: number;
  percentageOfTotal: number;
}
