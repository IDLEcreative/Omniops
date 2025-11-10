/**
 * DOM Update Batching Manager
 *
 * Batches multiple DOM updates into single requestAnimationFrame call.
 * Prevents layout thrashing and improves rendering performance.
 *
 * Performance Target: 60fps during rapid updates
 */

import { PerformanceConfig, DEFAULT_PERFORMANCE_CONFIG } from './config';

export class DOMBatchManager {
  private config: PerformanceConfig['batching'];
  private pendingUpdates: Array<() => void> = [];
  private rafId: number | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(config?: Partial<PerformanceConfig['batching']>) {
    this.config = {
      ...DEFAULT_PERFORMANCE_CONFIG.batching,
      ...config,
    };
  }

  /**
   * Schedule a DOM update to be batched
   */
  public scheduleUpdate(updateFn: () => void): void {
    this.pendingUpdates.push(updateFn);

    if (this.pendingUpdates.length >= this.config.batchSize) {
      this.flush();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.config.debounceMs);
    }
  }

  /**
   * Flush all pending updates
   */
  public flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      const updates = [...this.pendingUpdates];
      this.pendingUpdates = [];

      updates.forEach(updateFn => {
        try {
          updateFn();
        } catch (error) {
          console.error('[DOMBatch] Update error:', error);
        }
      });

      this.rafId = null;
    });
  }

  /**
   * Cancel all pending updates
   */
  public cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.pendingUpdates = [];
  }
}
