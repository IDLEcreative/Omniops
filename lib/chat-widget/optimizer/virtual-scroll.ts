/**
 * Virtual Scrolling Manager
 *
 * Implements virtual scrolling for efficient rendering of large message lists.
 * Only renders messages visible in the viewport plus an overscan buffer.
 *
 * Performance Target: 60fps scrolling for 500+ messages
 */

import { PerformanceConfig, DEFAULT_PERFORMANCE_CONFIG } from './config';

export interface VirtualScrollState {
  scrollTop: number;
  containerHeight: number;
  totalItems: number;
  visibleRange: {
    start: number;
    end: number;
  };
}

export class VirtualScrollManager {
  private config: PerformanceConfig['virtualScrolling'];

  constructor(config?: Partial<PerformanceConfig['virtualScrolling']>) {
    this.config = {
      ...DEFAULT_PERFORMANCE_CONFIG.virtualScrolling,
      ...config,
    };
  }

  /**
   * Calculate visible range of messages based on scroll position
   */
  public calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    totalItems: number
  ): { start: number; end: number } {
    const { itemHeight, overscan } = this.config;

    // Calculate visible items
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

    // Add overscan buffer
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(totalItems, visibleEnd + overscan);

    return { start, end };
  }

  /**
   * Calculate total scroll height
   */
  public calculateTotalHeight(totalItems: number): number {
    return totalItems * this.config.itemHeight;
  }

  /**
   * Calculate offset for first visible item
   */
  public calculateOffset(startIndex: number): number {
    return startIndex * this.config.itemHeight;
  }

  /**
   * Check if virtual scrolling should be enabled
   */
  public shouldEnable(messageCount: number): boolean {
    return this.config.enabled && messageCount >= this.config.threshold;
  }
}
