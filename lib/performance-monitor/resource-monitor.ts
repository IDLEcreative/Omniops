/**
 * Resource Usage Monitoring
 */

import type { MemorySnapshot, MemoryTrends } from './types';

export class ResourceMonitor {
  private memorySnapshots: MemorySnapshot[] = [];
  private maxSnapshots: number = 100;

  takeSnapshot(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      this.memorySnapshots.push({
        timestamp: Date.now(),
        usage,
      });

      // Limit snapshots
      if (this.memorySnapshots.length > this.maxSnapshots) {
        this.memorySnapshots.shift();
      }
    }
  }

  getMemoryTrends(): MemoryTrends | null {
    if (this.memorySnapshots.length === 0) return null;

    const lastSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
    if (!lastSnapshot) return null;
    const current = lastSnapshot.usage;

    const heapUsed = this.memorySnapshots.map(s => s.usage.heapUsed);
    const average = heapUsed.reduce((a, b) => a + b, 0) / heapUsed.length;
    const peak = Math.max(...heapUsed);

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.memorySnapshots.length > 10) {
      const recent = heapUsed.slice(-10);
      const older = heapUsed.slice(-20, -10);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
    }

    return {
      current,
      average: { heapUsed: average },
      peak: { heapUsed: peak },
      trend,
    };
  }

  checkForLeaks(): string[] {
    const warnings: string[] = [];
    const trends = this.getMemoryTrends();

    if (!trends) return warnings;

    // Check if memory is consistently increasing
    if (trends.trend === 'increasing' && trends.current.heapUsed > 100 * 1024 * 1024) {
      warnings.push('Potential memory leak detected: heap usage consistently increasing');
    }

    // Check if approaching heap limit
    if (trends.current.heapUsed / trends.current.heapTotal > 0.9) {
      warnings.push('Warning: Heap usage above 90% of total heap size');
    }

    return warnings;
  }

  clearSnapshots(): void {
    this.memorySnapshots = [];
  }
}
