/**
 * Metric tracking implementations
 *
 * Individual tracking methods for each metric type with validation and alerting.
 */

import { logger } from '@/lib/logger';
import { MetricStorage } from './storage';
import type {
  RenderMetric,
  ScrollMetric,
  MemorySnapshot,
  TabSyncMetric,
  APIMetric,
  BundleLoadMetric,
} from './types';

export class MetricTrackers {
  constructor(private storage: MetricStorage) {}

  /**
   * Track message render performance
   */
  trackRender(metric: RenderMetric): void {
    this.storage.renderMetrics.push(metric);
    this.storage.trimMetrics(this.storage.renderMetrics);

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
   * Track scroll performance metric
   */
  trackScroll(metric: ScrollMetric): void {
    this.storage.scrollMetrics.push(metric);
    this.storage.trimMetrics(this.storage.scrollMetrics);

    // Alert on poor scroll performance
    if (metric.fps < 55) {
      logger.warn('Poor scroll performance detected', {
        fps: metric.fps.toFixed(2),
        jankFrames: metric.jankFrames,
        messageCount: metric.messageCount,
      });
    }
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

    this.storage.memorySnapshots.push(snapshot);
    this.storage.trimMetrics(this.storage.memorySnapshots);

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
    this.storage.tabSyncMetrics.push(metric);
    this.storage.trimMetrics(this.storage.tabSyncMetrics);

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
    this.storage.apiMetrics.push(metric);
    this.storage.trimMetrics(this.storage.apiMetrics);

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
    this.storage.bundleMetrics.push(metric);
    this.storage.trimMetrics(this.storage.bundleMetrics);

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
   * Start automatic memory monitoring
   */
  startMemoryMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Take snapshot every 30 seconds
    setInterval(() => {
      this.takeMemorySnapshot();
    }, 30000);
  }
}
