/**
 * Performance Monitor
 *
 * Tracks and reports performance metrics for the chat widget.
 * Monitors render times, scroll performance, and memory usage.
 *
 * Targets: <16ms render, >55fps scroll, <50MB memory
 */

import { PerformanceMetrics } from '@/types/analytics';

export class PerformanceMonitor {
  private metrics: {
    renderTimes: number[];
    scrollPerformance: number[];
    memorySnapshots: number[];
  } = {
    renderTimes: [],
    scrollPerformance: [],
    memorySnapshots: [],
  };

  /**
   * Record message render time
   */
  public recordRenderTime(timeMs: number): void {
    this.metrics.renderTimes.push(timeMs);
    // Keep last 100 measurements
    if (this.metrics.renderTimes.length > 100) {
      this.metrics.renderTimes.shift();
    }
  }

  /**
   * Record scroll performance (fps)
   */
  public recordScrollPerformance(fps: number): void {
    this.metrics.scrollPerformance.push(fps);
    if (this.metrics.scrollPerformance.length > 100) {
      this.metrics.scrollPerformance.shift();
    }
  }

  /**
   * Record memory snapshot
   */
  public recordMemorySnapshot(memoryMB: number): void {
    this.metrics.memorySnapshots.push(memoryMB);
    if (this.metrics.memorySnapshots.length > 50) {
      this.metrics.memorySnapshots.shift();
    }
  }

  /**
   * Get performance report
   */
  public getReport(): PerformanceMetrics['metrics']['render_performance'] & { memory_mb: number } {
    const avgRenderTime = this.average(this.metrics.renderTimes);
    const avgScrollFps = this.average(this.metrics.scrollPerformance);
    const avgMemory = this.average(this.metrics.memorySnapshots);

    return {
      message_render_time_ms: avgRenderTime,
      scroll_performance_fps: avgScrollFps,
      dom_nodes: 0, // To be filled by caller
      rerender_count: this.metrics.renderTimes.length,
      virtual_scroll_enabled: false, // To be filled by caller
      memory_mb: avgMemory,
    };
  }

  /**
   * Check if performance targets are met
   */
  public meetsTargets(): {
    renderTarget: boolean; // <16ms
    scrollTarget: boolean; // >55fps
    memoryTarget: boolean; // <50MB
  } {
    const report = this.getReport();

    return {
      renderTarget: report.message_render_time_ms < 16,
      scrollTarget: report.scroll_performance_fps > 55,
      memoryTarget: report.memory_mb < 50,
    };
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Clear all metrics
   */
  public clear(): void {
    this.metrics.renderTimes = [];
    this.metrics.scrollPerformance = [];
    this.metrics.memorySnapshots = [];
  }
}
