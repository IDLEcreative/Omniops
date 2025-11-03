/**
 * Phase 3 Enhancements Integration Tests
 *
 * Tests for:
 * - Tab synchronization
 * - Performance optimization
 * - Session tracking
 * - Analytics engine
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TabSyncManager } from '@/lib/chat-widget/tab-sync';
import {
  PerformanceOptimizer,
  VirtualScrollManager,
  MessagePaginator,
  MemoryManager,
} from '@/lib/chat-widget/performance-optimizer';
import { SessionTracker } from '@/lib/analytics/session-tracker';
import {
  AnalyticsEngine,
  ResponseTimeAnalyzer,
  EngagementAnalyzer,
  CompletionAnalyzer,
  TopicExtractor,
} from '@/lib/analytics/analytics-engine';
import { Message } from '@/types/database';

// ============================================================================
// Mock Data
// ============================================================================

const createMockMessage = (
  id: string,
  role: 'user' | 'assistant',
  content: string,
  createdAt: Date = new Date()
): Message => ({
  id,
  conversation_id: 'conv-1',
  role,
  content,
  created_at: createdAt.toISOString(),
});

const createMockConversation = (messageCount: number): Message[] => {
  const messages: Message[] = [];
  const baseTime = new Date('2025-01-01T10:00:00Z');

  for (let i = 0; i < messageCount; i++) {
    const role = i % 2 === 0 ? 'user' : 'assistant';
    const time = new Date(baseTime.getTime() + i * 2000); // 2 seconds apart
    messages.push(
      createMockMessage(
        `msg-${i}`,
        role,
        `Message ${i} from ${role}`,
        time
      )
    );
  }

  return messages;
};

// ============================================================================
// Tab Synchronization Tests
// ============================================================================

describe('TabSyncManager', () => {
  let tabSync: TabSyncManager;

  beforeEach(() => {
    // Mock BroadcastChannel if not available in test environment
    if (typeof BroadcastChannel === 'undefined') {
      (global as any).BroadcastChannel = class {
        onmessage: ((event: MessageEvent) => void) | null = null;
        postMessage = jest.fn();
        close = jest.fn();
      };
    }

    tabSync = new TabSyncManager('test-channel');
  });

  afterEach(() => {
    tabSync.destroy();
  });

  it('should generate unique tab ID', () => {
    const tabId = tabSync.getTabId();
    expect(tabId).toMatch(/^tab-\d+-[a-z0-9]+$/);
  });

  it('should send sync messages', () => {
    const payload = {
      conversation_id: 'conv-1',
      message: {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Test message',
        created_at: new Date().toISOString(),
      },
    };

    expect(() => {
      tabSync.send('NEW_MESSAGE', payload);
    }).not.toThrow();
  });

  it('should allow subscribing to messages', () => {
    const listener = jest.fn();
    const unsubscribe = tabSync.subscribe(listener);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should return current tab state', () => {
    const state = tabSync.getTabState();

    expect(state).toHaveProperty('tab_id');
    expect(state).toHaveProperty('is_active');
    expect(state).toHaveProperty('has_focus');
    expect(state).toHaveProperty('conversation_open');
    expect(state).toHaveProperty('last_activity');
  });

  it('should handle BroadcastChannel support check', () => {
    const hasSupport = tabSync.hasBroadcastChannelSupport();
    expect(typeof hasSupport).toBe('boolean');
  });
});

// ============================================================================
// Performance Optimization Tests
// ============================================================================

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

// ============================================================================
// Session Tracking Tests
// ============================================================================

describe('SessionTracker', () => {
  let sessionTracker: SessionTracker;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    sessionTracker = new SessionTracker('example.com');
  });

  afterEach(() => {
    sessionTracker.endSession();
  });

  it('should generate session ID', () => {
    const sessionId = sessionTracker.getSessionId();
    expect(sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
  });

  it('should track page views', () => {
    sessionTracker.trackPageView('https://example.com/page1', 'Page 1');
    const metadata = sessionTracker.getMetadata();

    expect(metadata.page_views.length).toBe(2); // Initial + tracked
    expect(metadata.total_pages).toBe(2);
  });

  it('should link conversations', () => {
    sessionTracker.linkConversation('conv-1');
    sessionTracker.linkConversation('conv-2');

    const metadata = sessionTracker.getMetadata();
    expect(metadata.conversation_ids).toContain('conv-1');
    expect(metadata.conversation_ids).toContain('conv-2');
  });

  it('should calculate session metrics', () => {
    sessionTracker.trackInteraction();
    sessionTracker.trackScrollDepth(50);

    const metrics = sessionTracker.calculateMetrics();
    expect(metrics).toHaveProperty('duration_seconds');
    expect(metrics).toHaveProperty('page_views');
    expect(metrics).toHaveProperty('total_interactions');
  });

  it('should export session data', () => {
    const data = sessionTracker.exportData();

    expect(data).toHaveProperty('session_id');
    expect(data).toHaveProperty('domain');
    expect(data).toHaveProperty('start_time');
    expect(data).toHaveProperty('page_views');
    expect(data).toHaveProperty('browser_info');
  });
});

// ============================================================================
// Analytics Engine Tests
// ============================================================================

describe('AnalyticsEngine', () => {
  describe('ResponseTimeAnalyzer', () => {
    it('should calculate response time metrics', () => {
      const messages = createMockConversation(10);
      const metrics = ResponseTimeAnalyzer.calculate(messages);

      expect(metrics.total_responses).toBeGreaterThan(0);
      expect(metrics.average_ms).toBeGreaterThan(0);
      expect(metrics.median_ms).toBeGreaterThan(0);
      expect(metrics.fastest_ms).toBeLessThanOrEqual(metrics.slowest_ms);
    });

    it('should handle empty messages', () => {
      const metrics = ResponseTimeAnalyzer.calculate([]);

      expect(metrics.total_responses).toBe(0);
      expect(metrics.average_ms).toBe(0);
    });
  });

  describe('EngagementAnalyzer', () => {
    it('should calculate engagement score', () => {
      const messages = createMockConversation(20);
      const score = EngagementAnalyzer.calculateScore(messages);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate full engagement metrics', () => {
      const messages = createMockConversation(20);
      const metrics = EngagementAnalyzer.calculate(messages);

      expect(metrics.total_messages).toBe(20);
      expect(metrics.user_messages).toBe(10);
      expect(metrics.assistant_messages).toBe(10);
      expect(metrics.score).toBeGreaterThan(0);
    });

    it('should return 0 score for empty conversation', () => {
      const score = EngagementAnalyzer.calculateScore([]);
      expect(score).toBe(0);
    });
  });

  describe('CompletionAnalyzer', () => {
    it('should detect completed conversations', () => {
      const messages = createMockConversation(6); // Ends with assistant
      const metrics = CompletionAnalyzer.calculate(messages);

      expect(metrics.completed).toBe(true);
      expect(metrics.completion_rate).toBeGreaterThan(0);
    });

    it('should detect resolution keywords', () => {
      const messages = [
        createMockMessage('1', 'user', 'I need help'),
        createMockMessage('2', 'assistant', 'How can I help?'),
        createMockMessage('3', 'user', 'Thanks, that helped!'),
      ];

      const metrics = CompletionAnalyzer.calculate(messages);
      expect(metrics.resolution_achieved).toBe(true);
    });
  });

  describe('TopicExtractor', () => {
    it('should extract topics from messages', () => {
      const messages = [
        createMockMessage('1', 'user', 'I have a question about my order'),
        createMockMessage('2', 'assistant', 'I can help with your order'),
        createMockMessage('3', 'user', 'What about shipping?'),
      ];

      const topics = TopicExtractor.extract(messages);

      expect(topics.primary_topics).toContain('order');
      expect(topics.primary_topics).toContain('shipping');
      expect(topics.support_categories).toContain('Orders & Shipping');
    });

    it('should extract product mentions from metadata', () => {
      const messages = [
        {
          ...createMockMessage('1', 'user', 'Tell me about products'),
          metadata: { products: [123, 456] },
        },
      ];

      const topics = TopicExtractor.extract(messages);
      expect(topics.product_mentions).toContain('123');
      expect(topics.product_mentions).toContain('456');
    });
  });

  describe('AnalyticsEngine Integration', () => {
    it('should calculate complete conversation metrics', () => {
      const messages = createMockConversation(10);
      const metrics = AnalyticsEngine.calculateConversationMetrics(
        'conv-1',
        'session-1',
        messages
      );

      expect(metrics.conversation_id).toBe('conv-1');
      expect(metrics.session_id).toBe('session-1');
      expect(metrics.metrics.response_times).toBeDefined();
      expect(metrics.metrics.engagement).toBeDefined();
      expect(metrics.metrics.completion).toBeDefined();
      expect(metrics.metrics.topics).toBeDefined();
    });

    it('should calculate overview metrics', () => {
      const conversations = [
        { messages: createMockConversation(10), created_at: new Date().toISOString() },
        { messages: createMockConversation(15), created_at: new Date().toISOString() },
      ];

      const overview = AnalyticsEngine.calculateOverview(
        conversations,
        new Date('2025-01-01'),
        new Date('2025-01-07')
      );

      expect(overview.totals.conversations).toBe(2);
      expect(overview.totals.messages).toBe(25);
      expect(overview.averages.response_time_ms).toBeGreaterThan(0);
    });

    it('should calculate daily metrics', () => {
      const conversations = [
        { messages: createMockConversation(10), created_at: '2025-01-01T10:00:00Z' },
        { messages: createMockConversation(15), created_at: '2025-01-01T14:00:00Z' },
      ];

      const dailyMetrics = AnalyticsEngine.calculateDailyMetrics(
        conversations,
        new Date('2025-01-01'),
        new Date('2025-01-03')
      );

      expect(dailyMetrics.length).toBe(3); // 3 days
      expect(dailyMetrics[0].conversations).toBe(2);
      expect(dailyMetrics[0].messages).toBe(25);
    });

    it('should export data as JSON', () => {
      const messages = createMockConversation(5);
      const metrics = AnalyticsEngine.calculateConversationMetrics(
        'conv-1',
        'session-1',
        messages
      );

      const exported = AnalyticsEngine.exportData(
        [metrics],
        {
          format: 'json',
          date_range: { start: '2025-01-01', end: '2025-01-07' },
          include_metrics: {
            sessions: true,
            conversations: true,
            response_times: true,
            engagement: true,
            completion_rates: true,
            topics: true,
            sentiment: false,
          },
          grouping: 'daily',
        }
      );

      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should export data as CSV', () => {
      const messages = createMockConversation(5);
      const metrics = AnalyticsEngine.calculateConversationMetrics(
        'conv-1',
        'session-1',
        messages
      );

      const exported = AnalyticsEngine.exportData(
        [metrics],
        {
          format: 'csv',
          date_range: { start: '2025-01-01', end: '2025-01-07' },
          include_metrics: {
            sessions: true,
            conversations: true,
            response_times: true,
            engagement: true,
            completion_rates: true,
            topics: true,
            sentiment: false,
          },
          grouping: 'daily',
        }
      );

      expect(exported).toContain('Conversation ID');
      expect(exported).toContain('conv-1');
    });
  });
});
