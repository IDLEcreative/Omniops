/**
 * Cache Statistics Tracking
 */

import type { CacheStats } from './types';

export class StatsTracker {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    avgTimeSaved: 0,
    totalTimeSaved: 0
  };

  recordHit(timeSaved: number): void {
    this.stats.hits++;
    // Assume API would have taken 20-60 seconds
    const estimatedApiTime = 30000; // 30 seconds average
    this.stats.totalTimeSaved += estimatedApiTime;
    this.stats.avgTimeSaved = this.stats.totalTimeSaved / this.stats.hits;
    this.updateHitRate();
  }

  recordMiss(): void {
    this.stats.misses++;
    this.updateHitRate();
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  getStats(memoryCacheSize: number): CacheStats & {
    memoryCacheSize: number;
    estimatedTimeSavedMinutes: number;
    successRate: string;
  } {
    return {
      ...this.stats,
      memoryCacheSize,
      estimatedTimeSavedMinutes: Math.round(this.stats.totalTimeSaved / 60000),
      successRate: `${(this.stats.hitRate * 100).toFixed(1)}%`
    };
  }
}
