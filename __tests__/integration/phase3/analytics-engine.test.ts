/**
 * Analytics Engine Tests
 *
 * Tests for response time analysis, engagement scoring, completion detection,
 * topic extraction, and comprehensive conversation metrics calculation.
 */

import { describe, it, expect } from '@jest/globals';
import {
  AnalyticsEngine,
  ResponseTimeAnalyzer,
  EngagementAnalyzer,
  CompletionAnalyzer,
  TopicExtractor,
} from '@/lib/analytics/analytics-engine';
import {
  createMockMessage,
  createMockConversation,
  createMockMessageWithMetadata,
} from '../../utils/phase3/test-data-builders';

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
        createMockMessageWithMetadata('1', 'user', 'Tell me about products', {
          products: [123, 456],
        }),
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
