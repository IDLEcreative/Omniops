/**
 * Analytics Engine
 *
 * Comprehensive analytics system for conversation and session metrics:
 * - Response time calculation
 * - Engagement scoring
 * - Completion tracking
 * - Topic extraction
 * - Data export utilities
 *
 * Provides real-time and historical analytics for the dashboard.
 */

import { Message } from '@/types/database';
import {
  ConversationMetrics,
  ResponseTimeMetrics,
  EngagementMetrics,
  CompletionMetrics,
  TopicMetrics,
  AnalyticsDashboardData,
  AnalyticsOverview,
  DailyMetric,
  AnalyticsExportOptions,
} from '@/types/analytics';

// ============================================================================
// Response Time Analysis
// ============================================================================

export class ResponseTimeAnalyzer {
  /**
   * Calculate response time metrics from messages
   */
  public static calculate(messages: Message[]): ResponseTimeMetrics {
    const responseTimes: number[] = [];

    for (let i = 1; i < messages.length; i++) {
      const prevMessage = messages[i - 1];
      const currentMessage = messages[i];

      if (!prevMessage || !currentMessage) continue;

      // Calculate time between user message and assistant response
      if (prevMessage.role === 'user' && currentMessage.role === 'assistant') {
        const prevTime = new Date(prevMessage.created_at).getTime();
        const currentTime = new Date(currentMessage.created_at).getTime();
        const responseTimeMs = currentTime - prevTime;

        if (responseTimeMs > 0 && responseTimeMs < 300000) { // Cap at 5 minutes
          responseTimes.push(responseTimeMs);
        }
      }
    }

    if (responseTimes.length === 0) {
      return {
        average_ms: 0,
        median_ms: 0,
        p95_ms: 0,
        p99_ms: 0,
        slowest_ms: 0,
        fastest_ms: 0,
        total_responses: 0,
      };
    }

    const sorted = [...responseTimes].sort((a, b) => a - b);
    const sum = responseTimes.reduce((acc, time) => acc + time, 0);

    return {
      average_ms: Math.floor(sum / responseTimes.length),
      median_ms: Math.floor(sorted[Math.floor(sorted.length / 2)] ?? 0),
      p95_ms: Math.floor(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
      p99_ms: Math.floor(sorted[Math.floor(sorted.length * 0.99)] ?? 0),
      slowest_ms: Math.floor(sorted[sorted.length - 1] ?? 0),
      fastest_ms: Math.floor(sorted[0] ?? 0),
      total_responses: responseTimes.length,
    };
  }
}

// ============================================================================
// Engagement Analysis
// ============================================================================

export class EngagementAnalyzer {
  /**
   * Calculate engagement score (0-100) based on multiple factors
   */
  public static calculateScore(messages: Message[]): number {
    if (messages.length === 0) return 0;

    // Factors that contribute to engagement:
    // 1. Message count (more messages = more engagement)
    // 2. Message depth (longer messages = more engagement)
    // 3. Response consistency (regular back-and-forth)
    // 4. Time spent (within reasonable limits)

    const messageCountScore = Math.min(messages.length * 5, 30); // Max 30 points
    const avgMessageLength = this.calculateAverageMessageLength(messages);
    const lengthScore = Math.min(avgMessageLength / 10, 20); // Max 20 points
    const depthScore = Math.min(messages.length / 2, 25); // Max 25 points
    const consistencyScore = this.calculateConsistencyScore(messages); // Max 25 points

    return Math.min(Math.floor(messageCountScore + lengthScore + depthScore + consistencyScore), 100);
  }

  /**
   * Calculate full engagement metrics
   */
  public static calculate(messages: Message[]): EngagementMetrics {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const timeBetweenMessages = this.calculateAverageTimeBetween(messages);
    const quickReplies = this.countQuickReplies(messages);

    return {
      score: this.calculateScore(messages),
      total_messages: messages.length,
      user_messages: userMessages.length,
      assistant_messages: assistantMessages.length,
      average_message_length: Math.floor(this.calculateAverageMessageLength(messages)),
      conversation_depth: messages.length,
      time_between_messages_avg_seconds: Math.floor(timeBetweenMessages),
      quick_replies_used: quickReplies,
    };
  }

  private static calculateAverageMessageLength(messages: Message[]): number {
    if (messages.length === 0) return 0;
    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
    return totalLength / messages.length;
  }

  private static calculateConsistencyScore(messages: Message[]): number {
    if (messages.length < 2) return 0;

    let backAndForthCount = 0;
    for (let i = 1; i < messages.length; i++) {
      const curr = messages[i];
      const prev = messages[i - 1];
      if (curr && prev && curr.role !== prev.role) {
        backAndForthCount++;
      }
    }

    const consistencyRatio = backAndForthCount / (messages.length - 1);
    return Math.floor(consistencyRatio * 25);
  }

  private static calculateAverageTimeBetween(messages: Message[]): number {
    if (messages.length < 2) return 0;

    let totalTime = 0;
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];
      if (!prev || !curr) continue;
      const prevTime = new Date(prev.created_at).getTime();
      const currentTime = new Date(curr.created_at).getTime();
      totalTime += (currentTime - prevTime) / 1000;
    }

    return totalTime / (messages.length - 1);
  }

  private static countQuickReplies(messages: Message[]): number {
    let quickReplies = 0;

    for (let i = 1; i < messages.length; i++) {
      const prevTime = new Date(messages[i - 1].created_at).getTime();
      const currentTime = new Date(messages[i].created_at).getTime();
      const timeDiff = (currentTime - prevTime) / 1000;

      // Quick reply if response within 30 seconds
      if (timeDiff < 30 && messages[i].role === 'user') {
        quickReplies++;
      }
    }

    return quickReplies;
  }
}

// ============================================================================
// Completion Analysis
// ============================================================================

export class CompletionAnalyzer {
  /**
   * Determine if conversation was completed successfully
   */
  public static calculate(messages: Message[]): CompletionMetrics {
    if (messages.length === 0) {
      return {
        completed: false,
        completion_rate: 0,
        resolution_achieved: false,
      };
    }

    const lastMessage = messages[messages.length - 1];
    const isAssistantLast = lastMessage.role === 'assistant';

    // Heuristics for completion:
    // 1. Conversation has at least 3 messages
    // 2. Last message is from assistant (system responded)
    // 3. No long gap at the end (user didn't abandon)

    const hasMinimumMessages = messages.length >= 3;
    const hasGoodEnding = isAssistantLast;

    // Check for resolution keywords in last few messages
    const resolutionKeywords = ['thank', 'thanks', 'helped', 'resolved', 'perfect', 'great', 'appreciate'];
    const lastFewMessages = messages.slice(-3).map(m => m.content.toLowerCase());
    const hasResolutionKeyword = lastFewMessages.some(content =>
      resolutionKeywords.some(keyword => content.includes(keyword))
    );

    const completed = hasMinimumMessages && hasGoodEnding;
    const completionRate = completed ? 1.0 : messages.length >= 2 ? 0.5 : 0;

    return {
      completed,
      completion_rate: completionRate,
      abandonment_point: completed ? undefined : messages.length - 1,
      resolution_achieved: hasResolutionKeyword,
    };
  }
}

// ============================================================================
// Topic Extraction
// ============================================================================

export class TopicExtractor {
  /**
   * Extract topics and entities from conversation
   */
  public static extract(messages: Message[]): TopicMetrics {
    const allContent = messages.map(m => m.content.toLowerCase()).join(' ');

    // Extract product mentions from metadata
    const productMentions: string[] = [];
    const orderMentions: string[] = [];

    messages.forEach(message => {
      if (message.metadata?.products) {
        message.metadata.products.forEach(product => {
          if (!productMentions.includes(product.toString())) {
            productMentions.push(product.toString());
          }
        });
      }

      if (message.metadata?.orders) {
        message.metadata.orders.forEach(order => {
          if (!orderMentions.includes(order.toString())) {
            orderMentions.push(order.toString());
          }
        });
      }
    });

    // Categorize support topics
    const supportCategories = this.categorizeSupportTopics(allContent);

    // Extract primary topics (simplified keyword extraction)
    const primaryTopics = this.extractPrimaryTopics(allContent);

    return {
      primary_topics: primaryTopics,
      topic_distribution: this.calculateTopicDistribution(primaryTopics),
      product_mentions: productMentions,
      order_mentions: orderMentions,
      support_categories: supportCategories,
    };
  }

  private static extractPrimaryTopics(content: string): string[] {
    const keywords = [
      'order', 'shipping', 'delivery', 'return', 'refund', 'payment',
      'product', 'price', 'discount', 'coupon', 'account', 'login',
      'password', 'support', 'help', 'question', 'problem', 'issue'
    ];

    const found: string[] = [];
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        found.push(keyword);
      }
    });

    return found.slice(0, 5); // Top 5 topics
  }

  private static calculateTopicDistribution(topics: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    topics.forEach(topic => {
      distribution[topic] = (distribution[topic] || 0) + 1;
    });
    return distribution;
  }

  private static categorizeSupportTopics(content: string): string[] {
    const categories: string[] = [];

    if (content.includes('order') || content.includes('shipping')) {
      categories.push('Orders & Shipping');
    }
    if (content.includes('return') || content.includes('refund')) {
      categories.push('Returns & Refunds');
    }
    if (content.includes('payment') || content.includes('billing')) {
      categories.push('Payment & Billing');
    }
    if (content.includes('product') || content.includes('item')) {
      categories.push('Product Information');
    }
    if (content.includes('account') || content.includes('login')) {
      categories.push('Account Management');
    }

    return categories.length > 0 ? categories : ['General Support'];
  }
}

// ============================================================================
// Main Analytics Engine
// ============================================================================

export class AnalyticsEngine {
  /**
   * Calculate complete conversation metrics
   */
  public static calculateConversationMetrics(
    conversationId: string,
    sessionId: string,
    messages: Message[]
  ): ConversationMetrics {
    return {
      conversation_id: conversationId,
      session_id: sessionId,
      metrics: {
        response_times: ResponseTimeAnalyzer.calculate(messages),
        engagement: EngagementAnalyzer.calculate(messages),
        completion: CompletionAnalyzer.calculate(messages),
        topics: TopicExtractor.extract(messages),
      },
      calculated_at: new Date().toISOString(),
    };
  }

  /**
   * Calculate dashboard overview metrics
   */
  public static calculateOverview(
    conversations: Array<{ messages: Message[]; created_at: string }>,
    startDate: Date,
    endDate: Date
  ): AnalyticsOverview {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);

    // Calculate averages
    const allResponseTimes = conversations.map(conv =>
      ResponseTimeAnalyzer.calculate(conv.messages)
    );
    const avgResponseTime = allResponseTimes.reduce((sum, rt) => sum + rt.average_ms, 0) / totalConversations || 0;

    const avgMessagesPerConv = totalMessages / totalConversations || 0;

    const allEngagement = conversations.map(conv =>
      EngagementAnalyzer.calculate(conv.messages)
    );
    const avgEngagementScore = allEngagement.reduce((sum, eng) => sum + eng.score, 0) / totalConversations || 0;

    const allCompletion = conversations.map(conv =>
      CompletionAnalyzer.calculate(conv.messages)
    );
    const completionRate = allCompletion.filter(c => c.completed).length / totalConversations || 0;
    const resolutionRate = allCompletion.filter(c => c.resolution_achieved).length / totalConversations || 0;

    return {
      time_period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      totals: {
        conversations: totalConversations,
        sessions: 0, // To be filled by caller with session data
        messages: totalMessages,
        unique_users: 0, // To be filled by caller
      },
      averages: {
        response_time_ms: Math.floor(avgResponseTime),
        messages_per_conversation: Math.floor(avgMessagesPerConv),
        session_duration_seconds: 0, // To be filled by caller
        engagement_score: Math.floor(avgEngagementScore),
      },
      rates: {
        completion_rate: Math.round(completionRate * 100) / 100,
        resolution_rate: Math.round(resolutionRate * 100) / 100,
        satisfaction_score: 0, // To be filled by caller
      },
    };
  }

  /**
   * Calculate daily metrics for trends
   */
  public static calculateDailyMetrics(
    conversations: Array<{ messages: Message[]; created_at: string }>,
    startDate: Date,
    endDate: Date
  ): DailyMetric[] {
    const dailyMap = new Map<string, Array<{ messages: Message[] }>>();

    // Group conversations by date
    conversations.forEach(conv => {
      const date = new Date(conv.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)!.push(conv);
    });

    // Calculate metrics for each day
    const dailyMetrics: DailyMetric[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayConversations = dailyMap.get(dateStr) || [];

      const totalMessages = dayConversations.reduce((sum, conv) => sum + conv.messages.length, 0);

      const responseTimes = dayConversations.map(conv =>
        ResponseTimeAnalyzer.calculate(conv.messages)
      );
      const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt.average_ms, 0) / dayConversations.length || 0;

      const completions = dayConversations.map(conv =>
        CompletionAnalyzer.calculate(conv.messages)
      );
      const completionRate = completions.filter(c => c.completed).length / dayConversations.length || 0;

      dailyMetrics.push({
        date: dateStr,
        conversations: dayConversations.length,
        messages: totalMessages,
        avg_response_time_ms: Math.floor(avgResponseTime),
        completion_rate: Math.round(completionRate * 100) / 100,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyMetrics;
  }

  /**
   * Export analytics data in specified format
   */
  public static exportData(
    conversations: ConversationMetrics[],
    options: AnalyticsExportOptions
  ): string {
    if (options.format === 'json') {
      return JSON.stringify(conversations, null, 2);
    }

    if (options.format === 'csv') {
      return this.convertToCSV(conversations);
    }

    throw new Error(`Unsupported export format: ${options.format}`);
  }

  private static convertToCSV(conversations: ConversationMetrics[]): string {
    const headers = [
      'Conversation ID',
      'Session ID',
      'Calculated At',
      'Avg Response Time (ms)',
      'Engagement Score',
      'Completed',
      'Resolution Achieved',
      'Total Messages',
      'Primary Topics',
    ];

    const rows = conversations.map(conv => [
      conv.conversation_id,
      conv.session_id,
      conv.calculated_at,
      conv.metrics.response_times.average_ms,
      conv.metrics.engagement.score,
      conv.metrics.completion.completed,
      conv.metrics.completion.resolution_achieved,
      conv.metrics.engagement.total_messages,
      conv.metrics.topics.primary_topics.join('; '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}
