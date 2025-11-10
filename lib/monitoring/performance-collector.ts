/**
 * Performance Metrics Collector for Chat Widget
 *
 * Collects comprehensive performance metrics including:
 * - Message render times
 * - Scroll performance (FPS)
 * - Memory usage snapshots
 * - Tab sync latencies
 * - API response times
 * - Bundle load times
 *
 * Target Metrics:
 * - render.message_time: <16ms (60fps)
 * - scroll.fps: >55fps
 * - memory.usage: <50MB
 * - tabsync.latency: <50ms
 */

// Re-export all types for backward compatibility
export type {
  RenderMetric,
  ScrollMetric,
  MemorySnapshot,
  TabSyncMetric,
  APIMetric,
  BundleLoadMetric,
  PerformanceSnapshot,
} from './collector/types';

import { MetricStorage } from './collector/storage';
import { MetricTrackers } from './collector/trackers';
import { ScrollMonitor } from './collector/scroll-monitor';
import { PerformanceAggregator } from './collector/aggregator';
import type {
  RenderMetric,
  ScrollMetric,
  TabSyncMetric,
  APIMetric,
  BundleLoadMetric,
  PerformanceSnapshot,
} from './collector/types';

export class PerformanceCollector {
  private static instance: PerformanceCollector;
  private storage: MetricStorage;
  private trackers: MetricTrackers;
  private scrollMonitor: ScrollMonitor;
  private aggregator: PerformanceAggregator;

  private constructor() {
    this.storage = MetricStorage.getInstance();
    this.trackers = new MetricTrackers(this.storage);
    this.scrollMonitor = new ScrollMonitor(this.storage, (metric) =>
      this.trackers.trackScroll(metric)
    );
    this.aggregator = new PerformanceAggregator(this.storage);

    // Start periodic memory snapshots
    this.trackers.startMemoryMonitoring();
  }

  static getInstance(): PerformanceCollector {
    if (!PerformanceCollector.instance) {
      PerformanceCollector.instance = new PerformanceCollector();
    }
    return PerformanceCollector.instance;
  }

  // Delegate to trackers
  trackRender(metric: RenderMetric): void {
    this.trackers.trackRender(metric);
  }

  trackTabSync(metric: TabSyncMetric): void {
    this.trackers.trackTabSync(metric);
  }

  trackAPI(metric: APIMetric): void {
    this.trackers.trackAPI(metric);
  }

  trackBundleLoad(metric: BundleLoadMetric): void {
    this.trackers.trackBundleLoad(metric);
  }

  takeMemorySnapshot(sessionId?: string, messageCount?: number): void {
    this.trackers.takeMemorySnapshot(sessionId, messageCount);
  }

  // Delegate to scroll monitor
  startScrollMonitoring(): void {
    this.scrollMonitor.start();
  }

  stopScrollMonitoring(scrollHeight: number, messageCount: number): void {
    this.scrollMonitor.stop(scrollHeight, messageCount);
  }

  // Delegate to aggregator
  getSnapshot(timeWindowMs?: number): PerformanceSnapshot {
    return this.aggregator.getSnapshot(timeWindowMs);
  }

  // Delegate to storage
  exportMetrics() {
    return this.storage.exportAll();
  }

  reset(): void {
    this.storage.reset();
  }
}

// Export singleton instance
export const performanceCollector = PerformanceCollector.getInstance();

// Convenience functions
export function trackRender(metric: RenderMetric): void {
  performanceCollector.trackRender(metric);
}

export function startScrollMonitoring(): void {
  performanceCollector.startScrollMonitoring();
}

export function stopScrollMonitoring(
  scrollHeight: number,
  messageCount: number
): void {
  performanceCollector.stopScrollMonitoring(scrollHeight, messageCount);
}

export function takeMemorySnapshot(sessionId?: string, messageCount?: number): void {
  performanceCollector.takeMemorySnapshot(sessionId, messageCount);
}

export function trackTabSync(metric: TabSyncMetric): void {
  performanceCollector.trackTabSync(metric);
}

export function trackAPI(metric: APIMetric): void {
  performanceCollector.trackAPI(metric);
}

export function trackBundleLoad(metric: BundleLoadMetric): void {
  performanceCollector.trackBundleLoad(metric);
}

export function getPerformanceSnapshot(timeWindowMs?: number): PerformanceSnapshot {
  return performanceCollector.getSnapshot(timeWindowMs);
}
