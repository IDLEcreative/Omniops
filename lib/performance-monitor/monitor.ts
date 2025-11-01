/**
 * Main Performance Monitor Class
 */

import { MetricsCollector } from './metrics';
import { PerformanceAnalyzer } from './analysis';
import type { PerformanceReport } from './types';

export class PerformanceMonitor {
  private collector: MetricsCollector;

  constructor() {
    this.collector = new MetricsCollector();
  }

  start(name: string, metadata?: Record<string, any>): void {
    this.collector.start(name, metadata);
  }

  end(name: string): number {
    return this.collector.end(name);
  }

  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return this.collector.measure(name, fn);
  }

  measureSync<T>(name: string, fn: () => T): T {
    return this.collector.measureSync(name, fn);
  }

  getReport(): PerformanceReport {
    return PerformanceAnalyzer.generateReport(
      this.collector.getCompletedMetrics(),
      this.collector.getPendingMetrics()
    );
  }

  clear(): void {
    this.collector.clear();
  }

  logSummary(): void {
    const report = this.getReport();
    PerformanceAnalyzer.logSummary(report);
  }
}
