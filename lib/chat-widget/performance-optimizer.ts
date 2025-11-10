/**
 * Performance Optimizer for Chat Widget
 *
 * Main orchestrator for performance optimization features.
 * Provides unified interface to virtual scrolling, pagination,
 * memory management, DOM batching, and performance monitoring.
 *
 * Performance Targets:
 * - Message render: <16ms (60fps)
 * - Memory usage: <50MB for 500 messages
 * - Scroll performance: 60fps
 */

// Re-export all types and classes for backward compatibility
export type { PerformanceConfig } from './optimizer/config';
export { DEFAULT_PERFORMANCE_CONFIG } from './optimizer/config';

export type { VirtualScrollState } from './optimizer/virtual-scroll';
export { VirtualScrollManager } from './optimizer/virtual-scroll';

export type { PaginationState } from './optimizer/pagination';
export { MessagePaginator } from './optimizer/pagination';

export { MemoryManager } from './optimizer/memory';
export { DOMBatchManager } from './optimizer/dom-batch';
export { PerformanceMonitor } from './optimizer/monitor';

// Import for main class
import { PerformanceConfig, DEFAULT_PERFORMANCE_CONFIG } from './optimizer/config';
import { VirtualScrollManager } from './optimizer/virtual-scroll';
import { MessagePaginator } from './optimizer/pagination';
import { MemoryManager } from './optimizer/memory';
import { DOMBatchManager } from './optimizer/dom-batch';
import { PerformanceMonitor } from './optimizer/monitor';

/**
 * Main Performance Optimizer
 *
 * Orchestrates all performance optimization subsystems.
 * Provides unified interface and recommendations.
 */
export class PerformanceOptimizer {
  public virtualScroll: VirtualScrollManager;
  public paginator: MessagePaginator;
  public memory: MemoryManager;
  public domBatch: DOMBatchManager;
  public monitor: PerformanceMonitor;

  constructor(config?: Partial<PerformanceConfig>) {
    const fullConfig = {
      ...DEFAULT_PERFORMANCE_CONFIG,
      ...config,
    };

    this.virtualScroll = new VirtualScrollManager(fullConfig.virtualScrolling);
    this.paginator = new MessagePaginator(fullConfig.pagination);
    this.memory = new MemoryManager(fullConfig.memoryManagement);
    this.domBatch = new DOMBatchManager(fullConfig.batching);
    this.monitor = new PerformanceMonitor();
  }

  /**
   * Get optimization recommendations based on message count
   */
  public getRecommendations(messageCount: number): {
    useVirtualScroll: boolean;
    usePagination: boolean;
    useMemoryManagement: boolean;
    useDOMBatching: boolean;
  } {
    return {
      useVirtualScroll: this.virtualScroll.shouldEnable(messageCount),
      usePagination: this.paginator.shouldEnable(messageCount),
      useMemoryManagement: messageCount > 100,
      useDOMBatching: messageCount > 50,
    };
  }

  /**
   * Cleanup all resources
   */
  public destroy(): void {
    this.memory.clear();
    this.domBatch.cancel();
    this.monitor.clear();
  }
}
