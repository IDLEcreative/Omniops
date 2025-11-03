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

import { logger } from '@/lib/logger';

export interface RenderMetric {
  messageId: string;
  renderTime: number; // milliseconds
  contentLength: number;
  hasMarkdown: boolean;
  hasCodeBlocks: boolean;
  timestamp: Date;
}

export interface ScrollMetric {
  fps: number;
  frameTime: number; // milliseconds per frame
  jankFrames: number; // frames that took >16ms
  timestamp: Date;
  scrollHeight: number;
  messageCount: number;
}

export interface MemorySnapshot {
  heapUsed: number; // bytes
  heapTotal: number; // bytes
  external: number; // bytes
  timestamp: Date;
  sessionId?: string;
  messageCount?: number;
}

export interface TabSyncMetric {
  operation: 'broadcast' | 'receive' | 'reconcile';
  latency: number; // milliseconds
  dataSize: number; // bytes
  success: boolean;
  timestamp: Date;
  tabId?: string;
}

export interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number; // milliseconds
  requestSize?: number; // bytes
  responseSize?: number; // bytes
  cached: boolean;
  timestamp: Date;
  errorType?: string;
}

export interface BundleLoadMetric {
  bundleName: string;
  loadTime: number; // milliseconds
  size: number; // bytes
  cached: boolean;
  timestamp: Date;
}

export interface PerformanceSnapshot {
  renders: {
    count: number;
    avgTime: number;
    p95Time: number;
    slowRenders: number; // renders >16ms
  };
  scroll: {
    avgFps: number;
    minFps: number;
    jankPercentage: number;
  };
  memory: {
    current: number;
    peak: number;
    avgUsage: number;
  };
  tabSync: {
    count: number;
    avgLatency: number;
    p95Latency: number;
    failures: number;
  };
  api: {
    totalCalls: number;
    avgDuration: number;
    p95Duration: number;
    errorRate: number;
    cacheHitRate: number;
  };
  bundles: {
    totalLoaded: number;
    totalSize: number;
    avgLoadTime: number;
    cacheHitRate: number;
  };
}

export class PerformanceCollector {
  private static instance: PerformanceCollector;
  private renderMetrics: RenderMetric[] = [];
  private scrollMetrics: ScrollMetric[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private tabSyncMetrics: TabSyncMetric[] = [];
  private apiMetrics: APIMetric[] = [];
  private bundleMetrics: BundleLoadMetric[] = [];
  private readonly MAX_METRICS = 1000; // Per category
  private frameTimings: number[] = [];
  private lastFrameTime = 0;
  private isMonitoringScroll = false;

  private constructor() {
    // Start periodic memory snapshots
    this.startMemoryMonitoring();
  }

  static getInstance(): PerformanceCollector {
    if (!PerformanceCollector.instance) {
      PerformanceCollector.instance = new PerformanceCollector();
    }
    return PerformanceCollector.instance;
  }

  /**
   * Track message render performance
   */
  trackRender(metric: RenderMetric): void {
    this.renderMetrics.push(metric);
    this.trimMetrics(this.renderMetrics);

    // Alert on slow renders
    if (metric.renderTime > 16) {
      logger.warn('Slow message render detected', {
        messageId: metric.messageId,
        renderTime: `${metric.renderTime.toFixed(2)}ms`,
        contentLength: metric.contentLength,
      });
    }
  }

  /**
   * Start monitoring scroll performance
   */
  startScrollMonitoring(): void {
    if (this.isMonitoringScroll || typeof window === 'undefined') return;

    this.isMonitoringScroll = true;
    this.frameTimings = [];
    this.lastFrameTime = performance.now();

    const measureFrame = () => {
      if (!this.isMonitoringScroll) return;

      const now = performance.now();
      const frameTime = now - this.lastFrameTime;
      this.frameTimings.push(frameTime);
      this.lastFrameTime = now;

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  /**
   * Stop monitoring scroll performance and record metrics
   */
  stopScrollMonitoring(scrollHeight: number, messageCount: number): void {
    if (!this.isMonitoringScroll) return;

    this.isMonitoringScroll = false;

    // Calculate FPS metrics
    const avgFrameTime = this.frameTimings.reduce((a, b) => a + b, 0) / (this.frameTimings.length || 1);
    const fps = 1000 / avgFrameTime;
    const jankFrames = this.frameTimings.filter(t => t > 16).length;

    const metric: ScrollMetric = {
      fps,
      frameTime: avgFrameTime,
      jankFrames,
      timestamp: new Date(),
      scrollHeight,
      messageCount,
    };

    this.scrollMetrics.push(metric);
    this.trimMetrics(this.scrollMetrics);

    // Alert on poor scroll performance
    if (fps < 55) {
      logger.warn('Poor scroll performance detected', {
        fps: fps.toFixed(2),
        jankFrames,
        messageCount,
      });
    }

    // Reset for next measurement
    this.frameTimings = [];
  }

  /**
   * Take memory snapshot
   */
  takeMemorySnapshot(sessionId?: string, messageCount?: number): void {
    if (typeof window === 'undefined' || !performance.memory) return;

    const snapshot: MemorySnapshot = {
      heapUsed: (performance.memory as any).usedJSHeapSize,
      heapTotal: (performance.memory as any).totalJSHeapSize,
      external: 0, // Not available in browser
      timestamp: new Date(),
      sessionId,
      messageCount,
    };

    this.memorySnapshots.push(snapshot);
    this.trimMetrics(this.memorySnapshots);

    // Alert on high memory usage (>50MB)
    if (snapshot.heapUsed > 50 * 1024 * 1024) {
      logger.warn('High memory usage detected', {
        heapUsed: `${(snapshot.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        messageCount,
      });
    }
  }

  /**
   * Track tab sync performance
   */
  trackTabSync(metric: TabSyncMetric): void {
    this.tabSyncMetrics.push(metric);
    this.trimMetrics(this.tabSyncMetrics);

    // Alert on slow tab sync
    if (metric.latency > 50) {
      logger.warn('Slow tab sync detected', {
        operation: metric.operation,
        latency: `${metric.latency}ms`,
        dataSize: `${metric.dataSize} bytes`,
      });
    }
  }

  /**
   * Track API call performance
   */
  trackAPI(metric: APIMetric): void {
    this.apiMetrics.push(metric);
    this.trimMetrics(this.apiMetrics);

    // Alert on slow API calls
    if (metric.duration > 500) {
      logger.warn('Slow API call detected', {
        endpoint: metric.endpoint,
        duration: `${metric.duration}ms`,
        statusCode: metric.statusCode,
      });
    }

    // Alert on errors
    if (metric.statusCode >= 400) {
      logger.error('API call failed', {
        endpoint: metric.endpoint,
        statusCode: metric.statusCode,
        duration: `${metric.duration}ms`,
        errorType: metric.errorType,
      });
    }
  }

  /**
   * Track bundle load performance
   */
  trackBundleLoad(metric: BundleLoadMetric): void {
    this.bundleMetrics.push(metric);
    this.trimMetrics(this.bundleMetrics);

    // Alert on slow bundle loads
    if (metric.loadTime > 1000) {
      logger.warn('Slow bundle load detected', {
        bundleName: metric.bundleName,
        loadTime: `${metric.loadTime}ms`,
        size: `${(metric.size / 1024).toFixed(2)}KB`,
        cached: metric.cached,
      });
    }
  }

  /**
   * Get comprehensive performance snapshot
   */
  getSnapshot(timeWindowMs?: number): PerformanceSnapshot {
    const renders = timeWindowMs ? this.getRecentMetrics(this.renderMetrics, timeWindowMs) : this.renderMetrics;
    const scrolls = timeWindowMs ? this.getRecentMetrics(this.scrollMetrics, timeWindowMs) : this.scrollMetrics;
    const memory = timeWindowMs ? this.getRecentMetrics(this.memorySnapshots, timeWindowMs) : this.memorySnapshots;
    const tabSync = timeWindowMs ? this.getRecentMetrics(this.tabSyncMetrics, timeWindowMs) : this.tabSyncMetrics;
    const api = timeWindowMs ? this.getRecentMetrics(this.apiMetrics, timeWindowMs) : this.apiMetrics;
    const bundles = timeWindowMs ? this.getRecentMetrics(this.bundleMetrics, timeWindowMs) : this.bundleMetrics;

    // Render stats
    const renderTimes = renders.map(r => r.renderTime).sort((a, b) => a - b);
    const slowRenders = renders.filter(r => r.renderTime > 16).length;

    // Scroll stats
    const avgFps = scrolls.reduce((sum, s) => sum + s.fps, 0) / (scrolls.length || 1);
    const minFps = scrolls.length > 0 ? Math.min(...scrolls.map(s => s.fps)) : 0;
    const totalFrames = scrolls.reduce((sum, s) => sum + (s.jankFrames + (1000 / s.frameTime)), 0);
    const jankFrames = scrolls.reduce((sum, s) => sum + s.jankFrames, 0);

    // Memory stats
    const memoryUsages = memory.map(m => m.heapUsed);
    const currentMemory = memoryUsages[memoryUsages.length - 1] || 0;
    const peakMemory = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0;
    const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / (memoryUsages.length || 1);

    // Tab sync stats
    const syncLatencies = tabSync.map(t => t.latency).sort((a, b) => a - b);
    const syncFailures = tabSync.filter(t => !t.success).length;

    // API stats
    const apiDurations = api.map(a => a.duration).sort((a, b) => a - b);
    const apiErrors = api.filter(a => a.statusCode >= 400).length;
    const cachedAPIs = api.filter(a => a.cached).length;

    // Bundle stats
    const bundleTimes = bundles.map(b => b.loadTime).sort((a, b) => a - b);
    const totalBundleSize = bundles.reduce((sum, b) => sum + b.size, 0);
    const cachedBundles = bundles.filter(b => b.cached).length;

    return {
      renders: {
        count: renders.length,
        avgTime: renderTimes.reduce((a, b) => a + b, 0) / (renderTimes.length || 1),
        p95Time: this.percentile(renderTimes, 95),
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
        avgLatency: syncLatencies.reduce((a, b) => a + b, 0) / (syncLatencies.length || 1),
        p95Latency: this.percentile(syncLatencies, 95),
        failures: syncFailures,
      },
      api: {
        totalCalls: api.length,
        avgDuration: apiDurations.reduce((a, b) => a + b, 0) / (apiDurations.length || 1),
        p95Duration: this.percentile(apiDurations, 95),
        errorRate: api.length > 0 ? (apiErrors / api.length) * 100 : 0,
        cacheHitRate: api.length > 0 ? (cachedAPIs / api.length) * 100 : 0,
      },
      bundles: {
        totalLoaded: bundles.length,
        totalSize: totalBundleSize,
        avgLoadTime: bundleTimes.reduce((a, b) => a + b, 0) / (bundleTimes.length || 1),
        cacheHitRate: bundles.length > 0 ? (cachedBundles / bundles.length) * 100 : 0,
      },
    };
  }

  /**
   * Export all metrics for external analysis
   */
  exportMetrics(): {
    renders: RenderMetric[];
    scrolls: ScrollMetric[];
    memory: MemorySnapshot[];
    tabSync: TabSyncMetric[];
    api: APIMetric[];
    bundles: BundleLoadMetric[];
  } {
    return {
      renders: this.renderMetrics,
      scrolls: this.scrollMetrics,
      memory: this.memorySnapshots,
      tabSync: this.tabSyncMetrics,
      api: this.apiMetrics,
      bundles: this.bundleMetrics,
    };
  }

  /**
   * Start automatic memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Take snapshot every 30 seconds
    setInterval(() => {
      this.takeMemorySnapshot();
    }, 30000);
  }

  /**
   * Trim metrics array to max size
   */
  private trimMetrics<T>(metrics: T[]): void {
    if (metrics.length > this.MAX_METRICS) {
      metrics.splice(0, metrics.length - this.MAX_METRICS);
    }
  }

  /**
   * Get recent metrics within time window
   */
  private getRecentMetrics<T extends { timestamp: Date }>(metrics: T[], timeWindowMs: number): T[] {
    const cutoff = Date.now() - timeWindowMs;
    return metrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.renderMetrics = [];
    this.scrollMetrics = [];
    this.memorySnapshots = [];
    this.tabSyncMetrics = [];
    this.apiMetrics = [];
    this.bundleMetrics = [];
    this.frameTimings = [];
    this.isMonitoringScroll = false;
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

export function stopScrollMonitoring(scrollHeight: number, messageCount: number): void {
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
