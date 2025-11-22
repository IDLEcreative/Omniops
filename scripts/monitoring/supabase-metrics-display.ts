/**
 * Supabase Metrics Display Functions
 *
 * @purpose Formatting and display logic for Supabase performance metrics
 *
 * @flow
 *   1. Receive PerformanceMetrics object
 *   2. Format data into human-readable sections
 *   3. Display with colored status indicators
 *   4. Generate recommendations based on thresholds
 *
 * @keyFunctions
 *   - displayMetrics: Main display orchestrator
 *
 * @handles
 *   - Connection pool status with utilization warnings
 *   - Materialized view staleness detection
 *   - Index usage statistics with unused index warnings
 *   - Slow query identification and impact
 *   - Automated recommendations based on metrics
 *
 * @consumers
 *   - scripts/monitoring/monitor-supabase-performance.ts
 *
 * @totalLines 140
 */

import type { PerformanceMetrics } from './supabase-performance-types';

export function displayMetrics(metrics: PerformanceMetrics): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SUPABASE PERFORMANCE DASHBOARD');
  console.log(`  Collected: ${new Date(metrics.timestamp).toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  displayConnectionPool(metrics);
  displayMaterializedViews(metrics);
  displayIndexUsage(metrics);
  displaySlowQueries(metrics);
  displayTopQueries(metrics);
  displayRecommendations(metrics);

  console.log('═══════════════════════════════════════════════════════════\n');
}

function displayConnectionPool(metrics: PerformanceMetrics): void {
  console.log('🔌 CONNECTION POOL STATUS');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`  Active:    ${metrics.connectionPool.activeConnections}`);
  console.log(`  Idle:      ${metrics.connectionPool.idleConnections}`);
  console.log(`  Total:     ${metrics.connectionPool.totalConnections} / ${metrics.connectionPool.maxConnections}`);
  console.log(`  Usage:     ${metrics.connectionPool.utilizationPercentage.toFixed(1)}%`);

  const poolStatus = metrics.connectionPool.utilizationPercentage > 80 ? '🔴 HIGH' :
                      metrics.connectionPool.utilizationPercentage > 50 ? '🟡 MODERATE' : '🟢 HEALTHY';
  console.log(`  Status:    ${poolStatus}\n`);
}

function displayMaterializedViews(metrics: PerformanceMetrics): void {
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
}

function displayIndexUsage(metrics: PerformanceMetrics): void {
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
}

function displaySlowQueries(metrics: PerformanceMetrics): void {
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
}

function displayTopQueries(metrics: PerformanceMetrics): void {
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
}

function displayRecommendations(metrics: PerformanceMetrics): void {
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
}
