/**
 * Metric storage and management
 *
 * Centralized storage for all performance metrics with automatic trimming.
 */

import type {
  RenderMetric,
  ScrollMetric,
  MemorySnapshot,
  TabSyncMetric,
  APIMetric,
  BundleLoadMetric,
} from './types';

export class MetricStorage {
  private static instance: MetricStorage;

  readonly renderMetrics: RenderMetric[] = [];
  readonly scrollMetrics: ScrollMetric[] = [];
  readonly memorySnapshots: MemorySnapshot[] = [];
  readonly tabSyncMetrics: TabSyncMetric[] = [];
  readonly apiMetrics: APIMetric[] = [];
  readonly bundleMetrics: BundleLoadMetric[] = [];

  readonly frameTimings: number[] = [];

  private readonly MAX_METRICS = 1000; // Per category

  private constructor() {}

  static getInstance(): MetricStorage {
    if (!MetricStorage.instance) {
      MetricStorage.instance = new MetricStorage();
    }
    return MetricStorage.instance;
  }

  /**
   * Trim metrics array to max size
   */
  trimMetrics<T>(metrics: T[]): void {
    if (metrics.length > this.MAX_METRICS) {
      metrics.splice(0, metrics.length - this.MAX_METRICS);
    }
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.renderMetrics.length = 0;
    this.scrollMetrics.length = 0;
    this.memorySnapshots.length = 0;
    this.tabSyncMetrics.length = 0;
    this.apiMetrics.length = 0;
    this.bundleMetrics.length = 0;
    this.frameTimings.length = 0;
  }

  /**
   * Export all metrics for external analysis
   */
  exportAll() {
    return {
      renders: this.renderMetrics,
      scrolls: this.scrollMetrics,
      memory: this.memorySnapshots,
      tabSync: this.tabSyncMetrics,
      api: this.apiMetrics,
      bundles: this.bundleMetrics,
    };
  }
}
