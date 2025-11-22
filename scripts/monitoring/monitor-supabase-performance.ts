#!/usr/bin/env tsx

/**
 * Supabase Performance Monitoring Script - AI-optimized header
 *
 * @purpose Main orchestration script for Supabase performance monitoring
 *
 * @flow
 *   1. Parse command-line arguments (--watch, --json)
 *   2. Collect metrics via collectors module
 *   3. Display metrics via display module or output JSON
 *   4. If watch mode, repeat every 30 seconds
 *
 * @keyFunctions
 *   - main: Entry point, handles CLI args and mode selection
 *
 * @handles
 *   - Query execution times
 *   - Index usage statistics
 *   - Materialized view freshness
 *   - Cache hit rates
 *   - Connection pool usage
 *   - RLS policy overhead
 *
 * @usage
 *   npx tsx scripts/monitoring/monitor-supabase-performance.ts
 *   npx tsx scripts/monitoring/monitor-supabase-performance.ts --watch
 *   npx tsx scripts/monitoring/monitor-supabase-performance.ts --json > metrics.json
 *
 * @dependencies
 *   - ./supabase-metrics-collectors (data collection)
 *   - ./supabase-metrics-display (output formatting)
 *   - ./supabase-performance-types (type definitions)
 *
 * @consumers
 *   - DevOps teams for performance monitoring
 *   - CI/CD pipelines for regression detection
 *   - Performance optimization workflows
 *
 * @totalLines 62
 * @estimatedTokens ~1,200 (without header), ~1,400 (with header - 14% savings)
 */

import { collectMetrics } from './supabase-metrics-collectors';
import { displayMetrics } from './supabase-metrics-display';

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
