/**
 * Scroll performance monitoring
 *
 * Handles frame timing collection and FPS measurement for scroll performance tracking.
 */

import { MetricStorage } from './storage';
import type { ScrollMetric } from './types';

export class ScrollMonitor {
  private isMonitoring = false;
  private lastFrameTime = 0;

  constructor(
    private storage: MetricStorage,
    private onMetricRecorded: (metric: ScrollMetric) => void
  ) {}

  /**
   * Start monitoring scroll performance
   */
  start(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    this.storage.frameTimings.length = 0; // Clear previous timings
    this.lastFrameTime = performance.now();

    const measureFrame = () => {
      if (!this.isMonitoring) return;

      const now = performance.now();
      const frameTime = now - this.lastFrameTime;
      this.storage.frameTimings.push(frameTime);
      this.lastFrameTime = now;

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  /**
   * Stop monitoring scroll performance and record metrics
   */
  stop(scrollHeight: number, messageCount: number): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // Calculate FPS metrics
    const avgFrameTime =
      this.storage.frameTimings.reduce((a, b) => a + b, 0) /
      (this.storage.frameTimings.length || 1);
    const fps = 1000 / avgFrameTime;
    const jankFrames = this.storage.frameTimings.filter((t) => t > 16).length;

    const metric: ScrollMetric = {
      fps,
      frameTime: avgFrameTime,
      jankFrames,
      timestamp: new Date(),
      scrollHeight,
      messageCount,
    };

    // Record metric via callback (which handles storage and alerts)
    this.onMetricRecorded(metric);

    // Reset for next measurement
    this.storage.frameTimings.length = 0;
  }

  isActive(): boolean {
    return this.isMonitoring;
  }
}
