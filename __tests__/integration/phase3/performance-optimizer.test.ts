/**
 * Performance Optimizer Tests
 *
 * Tests for virtual scrolling, message pagination, and memory management.
 * Covers all performance optimization components used in the chat widget.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  PerformanceOptimizer,
  VirtualScrollManager,
  MessagePaginator,
  MemoryManager,
} from '@/lib/chat-widget/performance-optimizer';
import { createMockMessage, createMockConversation } from '../../utils/phase3/test-data-builders';

describe('PerformanceOptimizer', () => {
  describe('VirtualScrollManager', () => {
    let virtualScroll: VirtualScrollManager;

    beforeEach(() => {
      virtualScroll = new VirtualScrollManager();
    });

    it('should calculate visible range correctly', () => {
      const range = virtualScroll.calculateVisibleRange(
        400, // scrollTop
        600, // containerHeight
        100  // totalItems
      );

      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeLessThanOrEqual(100);
      expect(range.end).toBeGreaterThan(range.start);
    });

    it('should calculate total height', () => {
      const height = virtualScroll.calculateTotalHeight(100);
      expect(height).toBeGreaterThan(0);
    });

    it('should calculate offset for first item', () => {
      const offset = virtualScroll.calculateOffset(10);
      expect(offset).toBeGreaterThan(0);
    });

    it('should enable virtual scrolling above threshold', () => {
      expect(virtualScroll.shouldEnable(50)).toBe(false);
      expect(virtualScroll.shouldEnable(150)).toBe(true);
    });
  });

  describe('MessagePaginator', () => {
    let paginator: MessagePaginator;
    const messages = createMockConversation(100);

    beforeEach(() => {
      paginator = new MessagePaginator();
      paginator.setMessages(messages);
    });

    it('should return initial messages', () => {
      const initial = paginator.getInitialMessages();
      expect(initial.length).toBeLessThanOrEqual(30);
    });

    it('should load more messages', () => {
      const initial = paginator.getInitialMessages();
      const more = paginator.loadMore(initial.length);
      expect(more.length).toBeGreaterThan(0);
    });

    it('should calculate pagination state', () => {
      const state = paginator.getState(30);
      expect(state).toHaveProperty('currentPage');
      expect(state).toHaveProperty('totalPages');
      expect(state).toHaveProperty('hasMore');
    });

    it('should enable pagination above threshold', () => {
      expect(paginator.shouldEnable(40)).toBe(false);
      expect(paginator.shouldEnable(60)).toBe(true);
    });
  });

  describe('MemoryManager', () => {
    let memoryManager: MemoryManager;

    beforeEach(() => {
      memoryManager = new MemoryManager();
    });

    it('should add and retrieve messages', () => {
      const message = createMockMessage('msg-1', 'user', 'Test');
      memoryManager.addMessage(message);

      const retrieved = memoryManager.getMessage('msg-1');
      expect(retrieved).toEqual(message);
    });

    it('should return memory estimate', () => {
      const messages = createMockConversation(10);
      messages.forEach(msg => memoryManager.addMessage(msg));

      const estimate = memoryManager.getMemoryEstimate();
      expect(estimate.messageCount).toBe(10);
      expect(estimate.messageCacheSizeMB).toBeGreaterThan(0);
    });

    it('should clear all messages', () => {
      const message = createMockMessage('msg-1', 'user', 'Test');
      memoryManager.addMessage(message);
      memoryManager.clear();

      const estimate = memoryManager.getMemoryEstimate();
      expect(estimate.messageCount).toBe(0);
    });
  });

  describe('PerformanceOptimizer Integration', () => {
    let optimizer: PerformanceOptimizer;

    beforeEach(() => {
      optimizer = new PerformanceOptimizer();
    });

    afterEach(() => {
      optimizer.destroy();
    });

    it('should provide optimization recommendations', () => {
      const recommendations = optimizer.getRecommendations(150);

      expect(recommendations.useVirtualScroll).toBe(true);
      expect(recommendations.usePagination).toBe(true);
      expect(recommendations.useMemoryManagement).toBe(true);
    });

    it('should handle performance monitoring', () => {
      optimizer.monitor.recordRenderTime(10);
      optimizer.monitor.recordScrollPerformance(60);
      optimizer.monitor.recordMemorySnapshot(30);

      const report = optimizer.monitor.getReport();
      expect(report.message_render_time_ms).toBe(10);
      expect(report.scroll_performance_fps).toBe(60);
      expect(report.memory_mb).toBe(30);
    });

    it('should check if performance targets are met', () => {
      optimizer.monitor.recordRenderTime(12);
      optimizer.monitor.recordScrollPerformance(58);
      optimizer.monitor.recordMemorySnapshot(40);

      const targets = optimizer.monitor.meetsTargets();
      expect(targets.renderTarget).toBe(true); // <16ms
      expect(targets.scrollTarget).toBe(true); // >55fps
      expect(targets.memoryTarget).toBe(true); // <50MB
    });
  });
});
