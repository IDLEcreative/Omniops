/**
 * Performance Metrics Collection
 */

import type { PerformanceMetric, PerformanceThresholds } from './types';

export class MetricsCollector {
  private metrics: Map<string, PerformanceMetric>;
  private completedMetrics: PerformanceMetric[];
  private thresholds: PerformanceThresholds;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.metrics = new Map();
    this.completedMetrics = [];
    this.thresholds = {
      slow: thresholds?.slow || 1000,
      verySlow: thresholds?.verySlow || 5000,
      critical: thresholds?.critical || 10000,
    };
  }

  start(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  end(name: string): number {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[PerformanceMonitor] No metric found for: ${name}`);
      return 0;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.completedMetrics.push(metric);
    this.metrics.delete(name);

    // Log slow operations
    if (metric.duration > this.thresholds.slow) {
      const severity = metric.duration > this.thresholds.critical ? 'CRITICAL' :
                      metric.duration > this.thresholds.verySlow ? 'VERY SLOW' : 'SLOW';
      console.warn(`[PerformanceMonitor] ${severity}: ${name} took ${metric.duration.toFixed(2)}ms`);
    }

    return metric.duration;
  }

  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      return await fn();
    } finally {
      this.end(name);
    }
  }

  measureSync<T>(name: string, fn: () => T): T {
    this.start(name);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }

  getCompletedMetrics(): PerformanceMetric[] {
    return [...this.completedMetrics];
  }

  getPendingMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }
}
