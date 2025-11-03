/**
 * Performance Optimizer for Chat Widget
 *
 * Provides optimization strategies for handling large conversations (500+ messages):
 * - Virtual scrolling implementation
 * - Message pagination
 * - Memory management
 * - DOM update batching
 * - Lazy loading utilities
 *
 * Performance Targets:
 * - Message render: <16ms (60fps)
 * - Memory usage: <50MB for 500 messages
 * - Scroll performance: 60fps
 */

import { Message } from '@/types/database';
import { PerformanceMetrics } from '@/types/analytics';

// ============================================================================
// Configuration
// ============================================================================

export interface PerformanceConfig {
  virtualScrolling: {
    enabled: boolean;
    itemHeight: number; // Fixed height per message in pixels
    overscan: number; // Number of items to render outside viewport
    threshold: number; // Enable after N messages
  };
  pagination: {
    enabled: boolean;
    pageSize: number;
    initialLoad: number;
    threshold: number; // Enable after N messages
  };
  memoryManagement: {
    enabled: boolean;
    maxMessagesInMemory: number;
    cleanupThreshold: number;
  };
  batching: {
    enabled: boolean;
    batchSize: number;
    debounceMs: number;
  };
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  virtualScrolling: {
    enabled: true,
    itemHeight: 80, // Approximate message height
    overscan: 5,
    threshold: 100, // Enable for 100+ messages
  },
  pagination: {
    enabled: true,
    pageSize: 50,
    initialLoad: 30,
    threshold: 50,
  },
  memoryManagement: {
    enabled: true,
    maxMessagesInMemory: 500,
    cleanupThreshold: 600,
  },
  batching: {
    enabled: true,
    batchSize: 10,
    debounceMs: 100,
  },
};

// ============================================================================
// Virtual Scrolling
// ============================================================================

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

// ============================================================================
// Message Pagination
// ============================================================================

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  loadedMessages: number;
  hasMore: boolean;
}

export class MessagePaginator {
  private config: PerformanceConfig['pagination'];
  private allMessages: Message[] = [];
  private loadedPages: Set<number> = new Set();

  constructor(config?: Partial<PerformanceConfig['pagination']>) {
    this.config = {
      ...DEFAULT_PERFORMANCE_CONFIG.pagination,
      ...config,
    };
  }

  /**
   * Initialize with all messages
   */
  public setMessages(messages: Message[]): void {
    this.allMessages = messages;
    this.loadedPages.clear();
    this.loadedPages.add(0); // First page always loaded
  }

  /**
   * Get initial messages to display
   */
  public getInitialMessages(): Message[] {
    if (!this.config.enabled || this.allMessages.length < this.config.threshold) {
      return this.allMessages;
    }

    return this.allMessages.slice(-this.config.initialLoad);
  }

  /**
   * Load more messages (older messages)
   */
  public loadMore(currentCount: number): Message[] {
    const { pageSize } = this.config;
    const totalMessages = this.allMessages.length;

    if (currentCount >= totalMessages) {
      return [];
    }

    const startIndex = Math.max(0, totalMessages - currentCount - pageSize);
    const endIndex = totalMessages - currentCount;

    const page = Math.floor(currentCount / pageSize);
    this.loadedPages.add(page);

    return this.allMessages.slice(startIndex, endIndex);
  }

  /**
   * Get pagination state
   */
  public getState(currentMessageCount: number): PaginationState {
    const totalMessages = this.allMessages.length;
    const { pageSize } = this.config;

    return {
      currentPage: Math.floor(currentMessageCount / pageSize),
      totalPages: Math.ceil(totalMessages / pageSize),
      loadedMessages: currentMessageCount,
      hasMore: currentMessageCount < totalMessages,
    };
  }

  /**
   * Check if pagination should be enabled
   */
  public shouldEnable(messageCount: number): boolean {
    return this.config.enabled && messageCount >= this.config.threshold;
  }
}

// ============================================================================
// Memory Management
// ============================================================================

export class MemoryManager {
  private config: PerformanceConfig['memoryManagement'];
  private messageCache: Map<string, Message> = new Map();
  private accessOrder: string[] = [];

  constructor(config?: Partial<PerformanceConfig['memoryManagement']>) {
    this.config = {
      ...DEFAULT_PERFORMANCE_CONFIG.memoryManagement,
      ...config,
    };
  }

  /**
   * Add message to cache
   */
  public addMessage(message: Message): void {
    const { id } = message;

    // Update access order
    this.accessOrder = this.accessOrder.filter(msgId => msgId !== id);
    this.accessOrder.push(id);

    // Add to cache
    this.messageCache.set(id, message);

    // Cleanup if over threshold
    if (this.messageCache.size >= this.config.cleanupThreshold) {
      this.cleanup();
    }
  }

  /**
   * Get message from cache
   */
  public getMessage(id: string): Message | undefined {
    const message = this.messageCache.get(id);

    if (message) {
      // Update access order (LRU)
      this.accessOrder = this.accessOrder.filter(msgId => msgId !== id);
      this.accessOrder.push(id);
    }

    return message;
  }

  /**
   * Cleanup old messages (LRU eviction)
   */
  private cleanup(): void {
    const { maxMessagesInMemory } = this.config;
    const toRemove = this.messageCache.size - maxMessagesInMemory;

    if (toRemove <= 0) return;

    // Remove least recently used messages
    const idsToRemove = this.accessOrder.slice(0, toRemove);
    idsToRemove.forEach(id => {
      this.messageCache.delete(id);
    });

    this.accessOrder = this.accessOrder.slice(toRemove);
  }

  /**
   * Get current memory usage estimate
   */
  public getMemoryEstimate(): {
    messageCacheSizeMB: number;
    messageCount: number;
    avgMessageSizeKB: number;
  } {
    const messageCount = this.messageCache.size;

    // Estimate: ~1KB per message on average
    const totalSizeKB = messageCount * 1;
    const totalSizeMB = totalSizeKB / 1024;

    return {
      messageCacheSizeMB: totalSizeMB,
      messageCount,
      avgMessageSizeKB: messageCount > 0 ? totalSizeKB / messageCount : 0,
    };
  }

  /**
   * Clear all cached messages
   */
  public clear(): void {
    this.messageCache.clear();
    this.accessOrder = [];
  }
}

// ============================================================================
// DOM Update Batching
// ============================================================================

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

// ============================================================================
// Performance Monitoring
// ============================================================================

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

// ============================================================================
// Main Performance Optimizer
// ============================================================================

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
