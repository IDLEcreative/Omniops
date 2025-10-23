/**
 * Performance Monitoring System
 * Tracks detailed metrics for all critical operations
 */

import { logger } from '@/lib/logger';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface AggregatedMetrics {
  operation: string;
  count: number;
  successRate: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  throughput: number; // requests per second
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private aggregationInterval: NodeJS.Timeout | null = null;
  private readonly MAX_METRICS_PER_OP = 1000; // Keep last 1000 metrics per operation
  private readonly AGGREGATION_WINDOW = 60000; // 1 minute

  private constructor() {
    // Start aggregation timer
    this.startAggregation();
  }

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  /**
   * Start tracking a performance metric
   */
  startOperation(operationName: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        duration,
        timestamp: new Date(),
        success: true
      });
    };
  }

  /**
   * Track an async operation
   */
  async trackAsync<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;

    try {
      const result = await operation();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        duration,
        timestamp: new Date(),
        success,
        metadata
      });
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    const operations = this.metrics.get(metric.operation) || [];
    operations.push(metric);

    // Keep only last N metrics to prevent memory leak
    if (operations.length > this.MAX_METRICS_PER_OP) {
      operations.shift();
    }

    this.metrics.set(metric.operation, operations);

    // Log slow operations
    if (metric.duration > 1000) {
      logger.warn('Slow operation detected', {
        operation: metric.operation,
        duration: `${metric.duration.toFixed(2)}ms`,
        metadata: metric.metadata
      });
    }
  }

  /**
   * Get aggregated metrics for an operation
   */
  getMetrics(operationName?: string): AggregatedMetrics[] {
    const results: AggregatedMetrics[] = [];

    const operationsToProcess = operationName
      ? [operationName]
      : Array.from(this.metrics.keys());

    for (const op of operationsToProcess) {
      const metrics = this.metrics.get(op);
      if (!metrics || metrics.length === 0) continue;

      const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
      const successCount = metrics.filter(m => m.success).length;
      const totalCount = metrics.length;

      // Calculate time window for throughput
      const oldestMetric = metrics[0]?.timestamp;
      const newestMetric = metrics[metrics.length - 1]?.timestamp;
      const timeWindowSeconds = oldestMetric && newestMetric
        ? (newestMetric.getTime() - oldestMetric.getTime()) / 1000
        : 0;

      results.push({
        operation: op,
        count: totalCount,
        successRate: (successCount / totalCount) * 100,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: durations[0] || 0,
        maxDuration: durations[durations.length - 1] || 0,
        p50: this.percentile(durations, 50),
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99),
        errorRate: ((totalCount - successCount) / totalCount) * 100,
        throughput: timeWindowSeconds > 0 ? totalCount / timeWindowSeconds : 0
      });
    }

    return results;
  }

  /**
   * Get real-time performance snapshot
   */
  getSnapshot(): {
    totalOperations: number;
    operationTypes: number;
    recentMetrics: PerformanceMetric[];
    aggregated: AggregatedMetrics[];
  } {
    const allMetrics = Array.from(this.metrics.values()).flat();
    const recentMetrics = allMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100);

    return {
      totalOperations: allMetrics.length,
      operationTypes: this.metrics.size,
      recentMetrics,
      aggregated: this.getMetrics()
    };
  }

  /**
   * Clear metrics older than specified age
   */
  cleanOldMetrics(maxAgeMs: number = 3600000): void {
    const cutoff = Date.now() - maxAgeMs;

    for (const [operation, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp.getTime() > cutoff);
      if (filtered.length > 0) {
        this.metrics.set(operation, filtered);
      } else {
        this.metrics.delete(operation);
      }
    }
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): string {
    const metrics = this.getMetrics();
    const timestamp = new Date().toISOString();

    // Format as Prometheus-style metrics
    const lines: string[] = [];

    for (const metric of metrics) {
      const labels = `operation="${metric.operation}"`;
      lines.push(`# HELP operation_duration_seconds Operation duration in seconds`);
      lines.push(`# TYPE operation_duration_seconds summary`);
      lines.push(`operation_duration_seconds_count{${labels}} ${metric.count}`);
      lines.push(`operation_duration_seconds_sum{${labels}} ${(metric.avgDuration * metric.count) / 1000}`);
      lines.push(`operation_duration_seconds{quantile="0.5",${labels}} ${metric.p50 / 1000}`);
      lines.push(`operation_duration_seconds{quantile="0.95",${labels}} ${metric.p95 / 1000}`);
      lines.push(`operation_duration_seconds{quantile="0.99",${labels}} ${metric.p99 / 1000}`);
      lines.push(`operation_success_rate{${labels}} ${metric.successRate / 100}`);
      lines.push(`operation_error_rate{${labels}} ${metric.errorRate / 100}`);
      lines.push(`operation_throughput{${labels}} ${metric.throughput}`);
    }

    return lines.join('\n');
  }

  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  private startAggregation(): void {
    // Clean old metrics every minute
    this.aggregationInterval = setInterval(() => {
      this.cleanOldMetrics();

      // Log summary metrics
      const snapshot = this.getSnapshot();
      if (snapshot.aggregated.length > 0) {
        logger.info('Performance metrics summary', {
          operationTypes: snapshot.operationTypes,
          totalOperations: snapshot.totalOperations,
          topSlowOperations: snapshot.aggregated
            .sort((a, b) => b.p95 - a.p95)
            .slice(0, 5)
            .map(m => ({
              operation: m.operation,
              p95: `${m.p95.toFixed(2)}ms`,
              errorRate: `${m.errorRate.toFixed(2)}%`
            }))
        });
      }
    }, this.AGGREGATION_WINDOW);
  }

  destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }
  }
}

// Export singleton instance
export const performanceTracker = PerformanceTracker.getInstance();

// Convenience functions
export function trackPerformance(operationName: string) {
  return performanceTracker.startOperation(operationName);
}

export async function trackAsync<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceTracker.trackAsync(operationName, operation, metadata);
}

export function getPerformanceMetrics(operationName?: string) {
  return performanceTracker.getMetrics(operationName);
}

export function getPerformanceSnapshot() {
  return performanceTracker.getSnapshot();
}