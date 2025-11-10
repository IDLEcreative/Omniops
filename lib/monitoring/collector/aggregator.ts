/**
 * Performance snapshot aggregation
 *
 * Aggregates raw metrics into comprehensive performance snapshots with statistics.
 */

import { MetricStorage } from './storage';
import { getRecentMetrics, percentile } from './utils';
import type { PerformanceSnapshot } from './types';

export class PerformanceAggregator {
  constructor(private storage: MetricStorage) {}

  /**
   * Get comprehensive performance snapshot
   */
  getSnapshot(timeWindowMs?: number): PerformanceSnapshot {
    // Apply time window filter if specified
    const renders = timeWindowMs
      ? getRecentMetrics(this.storage.renderMetrics, timeWindowMs)
      : this.storage.renderMetrics;
    const scrolls = timeWindowMs
      ? getRecentMetrics(this.storage.scrollMetrics, timeWindowMs)
      : this.storage.scrollMetrics;
    const memory = timeWindowMs
      ? getRecentMetrics(this.storage.memorySnapshots, timeWindowMs)
      : this.storage.memorySnapshots;
    const tabSync = timeWindowMs
      ? getRecentMetrics(this.storage.tabSyncMetrics, timeWindowMs)
      : this.storage.tabSyncMetrics;
    const api = timeWindowMs
      ? getRecentMetrics(this.storage.apiMetrics, timeWindowMs)
      : this.storage.apiMetrics;
    const bundles = timeWindowMs
      ? getRecentMetrics(this.storage.bundleMetrics, timeWindowMs)
      : this.storage.bundleMetrics;

    // Render stats
    const renderTimes = renders.map((r) => r.renderTime).sort((a, b) => a - b);
    const slowRenders = renders.filter((r) => r.renderTime > 16).length;

    // Scroll stats
    const avgFps =
      scrolls.reduce((sum, s) => sum + s.fps, 0) / (scrolls.length || 1);
    const minFps = scrolls.length > 0 ? Math.min(...scrolls.map((s) => s.fps)) : 0;
    const totalFrames = scrolls.reduce(
      (sum, s) => sum + (s.jankFrames + 1000 / s.frameTime),
      0
    );
    const jankFrames = scrolls.reduce((sum, s) => sum + s.jankFrames, 0);

    // Memory stats
    const memoryUsages = memory.map((m) => m.heapUsed);
    const currentMemory = memoryUsages[memoryUsages.length - 1] || 0;
    const peakMemory = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0;
    const avgMemory =
      memoryUsages.reduce((a, b) => a + b, 0) / (memoryUsages.length || 1);

    // Tab sync stats
    const syncLatencies = tabSync.map((t) => t.latency).sort((a, b) => a - b);
    const syncFailures = tabSync.filter((t) => !t.success).length;

    // API stats
    const apiDurations = api.map((a) => a.duration).sort((a, b) => a - b);
    const apiErrors = api.filter((a) => a.statusCode >= 400).length;
    const cachedAPIs = api.filter((a) => a.cached).length;

    // Bundle stats
    const bundleTimes = bundles.map((b) => b.loadTime).sort((a, b) => a - b);
    const totalBundleSize = bundles.reduce((sum, b) => sum + b.size, 0);
    const cachedBundles = bundles.filter((b) => b.cached).length;

    return {
      renders: {
        count: renders.length,
        avgTime:
          renderTimes.reduce((a, b) => a + b, 0) / (renderTimes.length || 1),
        p95Time: percentile(renderTimes, 95),
        slowRenders,
      },
      scroll: {
        avgFps,
        minFps,
        jankPercentage: totalFrames > 0 ? (jankFrames / totalFrames) * 100 : 0,
      },
      memory: {
        current: currentMemory,
        peak: peakMemory,
        avgUsage: avgMemory,
      },
      tabSync: {
        count: tabSync.length,
        avgLatency:
          syncLatencies.reduce((a, b) => a + b, 0) / (syncLatencies.length || 1),
        p95Latency: percentile(syncLatencies, 95),
        failures: syncFailures,
      },
      api: {
        totalCalls: api.length,
        avgDuration:
          apiDurations.reduce((a, b) => a + b, 0) / (apiDurations.length || 1),
        p95Duration: percentile(apiDurations, 95),
        errorRate: api.length > 0 ? (apiErrors / api.length) * 100 : 0,
        cacheHitRate: api.length > 0 ? (cachedAPIs / api.length) * 100 : 0,
      },
      bundles: {
        totalLoaded: bundles.length,
        totalSize: totalBundleSize,
        avgLoadTime:
          bundleTimes.reduce((a, b) => a + b, 0) / (bundleTimes.length || 1),
        cacheHitRate:
          bundles.length > 0 ? (cachedBundles / bundles.length) * 100 : 0,
      },
    };
  }
}
