/**
 * Advanced Business Intelligence Analytics
 * Provides deep insights into customer behavior and system performance
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface CustomerJourneyMetrics {
  avgSessionsBeforeConversion: number;
  avgMessagesPerSession: number;
  commonPaths: JourneyPath[];
  dropOffPoints: DropOffPoint[];
  conversionRate: number;
  timeToConversion: number; // minutes
}

export interface JourneyPath {
  path: string[];
  frequency: number;
  conversionRate: number;
}

export interface DropOffPoint {
  stage: string;
  dropOffRate: number;
  avgTimeSpent: number;
  commonQueries: string[];
}

export interface ContentGapAnalysis {
  unansweredQueries: UnansweredQuery[];
  lowConfidenceTopics: string[];
  suggestedContent: ContentSuggestion[];
  coverageScore: number; // 0-100
}

export interface UnansweredQuery {
  query: string;
  frequency: number;
  avgConfidence: number;
  lastAsked: Date;
}

export interface ContentSuggestion {
  topic: string;
  demandScore: number;
  suggestedType: 'faq' | 'guide' | 'product_info';
  relatedQueries: string[];
}

export interface PeakUsagePattern {
  hourlyDistribution: HourlyUsage[];
  dailyDistribution: DailyUsage[];
  peakHours: { hour: number; load: number }[];
  quietHours: { hour: number; load: number }[];
  predictedNextPeak: Date;
  resourceRecommendation: string;
}

export interface HourlyUsage {
  hour: number;
  avgMessages: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface DailyUsage {
  dayOfWeek: number;
  avgSessions: number;
  peakHour: number;
  totalMessages: number;
}

export interface ConversionFunnel {
  stages: FunnelStage[];
  overallConversionRate: number;
  avgTimeInFunnel: number; // minutes
  bottlenecks: Bottleneck[];
}

export interface FunnelStage {
  name: string;
  enteredCount: number;
  completedCount: number;
  conversionRate: number;
  avgDuration: number;
  dropOffReasons: string[];
}

export interface Bottleneck {
  stage: string;
  severity: 'high' | 'medium' | 'low';
  impact: number; // potential conversion increase if fixed
  recommendation: string;
}

export class BusinessIntelligence {
  private static instance: BusinessIntelligence;

  constructor(private supabase?: SupabaseClient) {}

  static getInstance(): BusinessIntelligence {
    if (!BusinessIntelligence.instance) {
      BusinessIntelligence.instance = new BusinessIntelligence();
    }
    return BusinessIntelligence.instance;
  }

  /**
   * Analyze customer journey patterns
   */
  async analyzeCustomerJourney(
    domain: string,
    timeRange: TimeRange
  ): Promise<CustomerJourneyMetrics> {
    // Validate date range
    if (timeRange.start >= timeRange.end) {
      logger.warn('Invalid date range provided', { domain, timeRange });
      return {
        conversionRate: 0,
        avgSessionsBeforeConversion: 0,
        avgMessagesPerSession: 0,
        commonPaths: [],
        dropOffPoints: [],
        timeToConversion: 0
      };
    }

    const supabase = this.supabase || await createServiceRoleClient();

    if (!supabase) {
      throw new Error('Database client unavailable');
    }

    try {
      // Get all sessions with their messages
      let query = supabase
        .from('conversations')
        .select(`
          id,
          session_id,
          created_at,
          metadata,
          messages (
            id,
            content,
            role,
            created_at
          )
        `)
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString());

      if (domain !== 'all') {
        query = query.eq('domain', domain);
      }

      const { data: sessions, error } = await query;

      if (error) {
        logger.error('Failed to analyze customer journey', error);
        return {
          conversionRate: 0,
          avgSessionsBeforeConversion: 0,
          avgMessagesPerSession: 0,
          commonPaths: [],
          dropOffPoints: [],
          timeToConversion: 0
        };
      }

      // Analyze journey patterns
      const journeyPaths = new Map<string, number>();
      const dropOffs = new Map<string, number>();
      let totalSessions = 0;
      let conversions = 0;
      let totalMessages = 0;
      let totalTimeToConversion = 0;

      for (const session of sessions || []) {
        const messages = session.messages || [];
        totalSessions++;
        totalMessages += messages.length;

        // Extract journey path
        const path = messages
          .filter(m => m.role === 'user')
          .map(m => this.categorizeMessage(m.content))
          .join(' → ');

        journeyPaths.set(path, (journeyPaths.get(path) || 0) + 1);

        // Check for conversion (metadata flag OR conversion keywords in messages)
        const hasConversion =
          session.metadata?.converted === true ||
          messages.some(m => this.isConversionMessage(m.content));

        if (hasConversion) {
          conversions++;
          const conversionTime = this.calculateTimeToConversion(messages);
          totalTimeToConversion += conversionTime;
        } else {
          const lastStage = this.categorizeMessage(
            messages[messages.length - 1]?.content || ''
          );
          dropOffs.set(lastStage, (dropOffs.get(lastStage) || 0) + 1);
        }
      }

      // Format results
      const commonPaths = Array.from(journeyPaths.entries())
        .map(([path, freq]) => ({
          path: path.split(' → '),
          frequency: freq,
          conversionRate: (freq / totalSessions) * 100
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      const dropOffPoints = Array.from(dropOffs.entries())
        .map(([stage, count]) => ({
          stage,
          dropOffRate: (count / totalSessions) * 100,
          avgTimeSpent: 0, // Would need more detailed tracking
          commonQueries: [] // Would need to extract from messages
        }))
        .sort((a, b) => b.dropOffRate - a.dropOffRate);

      return {
        avgSessionsBeforeConversion: conversions > 0 ? totalSessions / conversions : 0,
        avgMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
        commonPaths,
        dropOffPoints,
        conversionRate: totalSessions > 0 ? (conversions / totalSessions) * 100 : 0,
        timeToConversion: conversions > 0 ? totalTimeToConversion / conversions : 0
      };
    } catch (error) {
      logger.error('Failed to analyze customer journey', error);
      return {
        conversionRate: 0,
        avgSessionsBeforeConversion: 0,
        avgMessagesPerSession: 0,
        commonPaths: [],
        dropOffPoints: [],
        timeToConversion: 0
      };
    }
  }

  /**
   * Identify content gaps in knowledge base
   */
  async analyzeContentGaps(
    domain: string,
    timeRange: TimeRange,
    confidenceThreshold: number = 0.7
  ): Promise<ContentGapAnalysis> {
    // Validate date range
    if (timeRange.start >= timeRange.end) {
      logger.warn('Invalid date range provided', { domain, timeRange });
      return {
        unansweredQueries: [],
        lowConfidenceTopics: [],
        suggestedContent: [],
        coverageScore: 0
      };
    }

    const supabase = this.supabase || await createServiceRoleClient();

    if (!supabase) {
      throw new Error('Database client unavailable');
    }

    try {
      // Get messages with low confidence or no results
      let query = supabase
        .from('messages')
        .select(`
          content,
          metadata,
          created_at
        `)
        .eq('role', 'user')
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (domain !== 'all') {
        query = query.eq('domain', domain);
      }

      const { data: messages, error } = await query;

      if (error) {
        logger.error('Failed to analyze content gaps', error);
        return {
          unansweredQueries: [],
          lowConfidenceTopics: [],
          suggestedContent: [],
          coverageScore: 0
        };
      }

      // Analyze unanswered queries
      const queryFrequency = new Map<string, number>();
      const queryConfidence = new Map<string, number[]>();
      const topics = new Map<string, number>();

      for (const message of messages || []) {
        const query = message.content.toLowerCase();
        const confidence = message.metadata?.confidence || 1;

        queryFrequency.set(query, (queryFrequency.get(query) || 0) + 1);

        if (confidence < confidenceThreshold) {
          const confidences = queryConfidence.get(query) || [];
          confidences.push(confidence);
          queryConfidence.set(query, confidences);

          // Extract topics
          const extractedTopics = this.extractTopics(query);
          for (const topic of extractedTopics) {
            topics.set(topic, (topics.get(topic) || 0) + 1);
          }
        }
      }

      // Format unanswered queries
      const unansweredQueries = Array.from(queryConfidence.entries())
        .map(([query, confidences]) => ({
          query,
          frequency: queryFrequency.get(query) || 1,
          avgConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
          lastAsked: new Date() // Would need actual timestamp
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 20);

      // Identify low confidence topics
      const lowConfidenceTopics = Array.from(topics.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([topic]) => topic);

      // Generate content suggestions
      const suggestedContent = this.generateContentSuggestions(
        unansweredQueries,
        lowConfidenceTopics
      );

      // Calculate coverage score
      const totalQueries = messages?.length || 0;
      const answeredQueries = messages?.filter(m =>
        (m.metadata?.confidence || 1) >= confidenceThreshold
      ).length || 0;
      const coverageScore = (answeredQueries / Math.max(totalQueries, 1)) * 100;

      return {
        unansweredQueries,
        lowConfidenceTopics,
        suggestedContent,
        coverageScore
      };
    } catch (error) {
      logger.error('Failed to analyze content gaps', error);
      return {
        unansweredQueries: [],
        lowConfidenceTopics: [],
        suggestedContent: [],
        coverageScore: 0
      };
    }
  }

  /**
   * Analyze peak usage patterns
   */
  async analyzePeakUsage(
    domain: string,
    timeRange: TimeRange
  ): Promise<PeakUsagePattern> {
    // Validate date range
    if (timeRange.start >= timeRange.end) {
      logger.warn('Invalid date range provided', { domain, timeRange });
      return {
        hourlyDistribution: [],
        dailyDistribution: [],
        peakHours: [],
        quietHours: [],
        predictedNextPeak: new Date(),
        resourceRecommendation: 'Invalid date range provided'
      };
    }

    const supabase = this.supabase || await createServiceRoleClient();

    if (!supabase) {
      throw new Error('Database client unavailable');
    }

    // Calculate number of days for averaging
    const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));

    try {
      // Get message distribution
      let query = supabase
        .from('messages')
        .select(`
          created_at,
          metadata
        `)
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString())
        .order('created_at', { ascending: true });

      if (domain !== 'all') {
        query = query.eq('domain', domain);
      }

      const { data: messages, error } = await query;

      if (error) {
        logger.error('Failed to analyze peak usage', error);
        return {
          hourlyDistribution: [],
          dailyDistribution: [],
          peakHours: [],
          quietHours: [],
          predictedNextPeak: new Date(),
          resourceRecommendation: 'Error analyzing usage patterns'
        };
      }

      // Analyze hourly distribution
      const hourlyData = new Map<number, number[]>();
      const dailyData = new Map<number, number[]>();

      for (const message of messages || []) {
        const date = new Date(message.created_at);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();

        const hourlyMessages = hourlyData.get(hour) || [];
        hourlyMessages.push(1);
        hourlyData.set(hour, hourlyMessages);

        const dailyMessages = dailyData.get(dayOfWeek) || [];
        dailyMessages.push(1);
        dailyData.set(dayOfWeek, dailyMessages);
      }

      // Format hourly distribution
      const hourlyDistribution: HourlyUsage[] = [];
      for (let hour = 0; hour < 24; hour++) {
        const messages = hourlyData.get(hour) || [];
        hourlyDistribution.push({
          hour,
          avgMessages: messages.length / days,
          avgResponseTime: 0, // Would need actual response time data
          errorRate: 0 // Would need error tracking
        });
      }

      // Format daily distribution
      const dailyDistribution: DailyUsage[] = [];
      for (let day = 0; day < 7; day++) {
        const messages = dailyData.get(day) || [];
        dailyDistribution.push({
          dayOfWeek: day,
          avgSessions: messages.length / (days / 7),
          peakHour: this.findPeakHour(messages),
          totalMessages: messages.length
        });
      }

      // Identify peak and quiet hours
      const sortedHours = hourlyDistribution
        .map((h, idx) => ({ hour: idx, load: h.avgMessages }))
        .sort((a, b) => b.load - a.load);

      const peakHours = sortedHours.slice(0, 3);
      const quietHours = sortedHours.slice(-3).reverse();

      // Predict next peak (simple prediction based on patterns)
      const predictedNextPeak = this.predictNextPeak(hourlyDistribution, dailyDistribution);

      // Generate resource recommendation
      const resourceRecommendation = this.generateResourceRecommendation(
        peakHours,
        quietHours,
        hourlyDistribution
      );

      return {
        hourlyDistribution,
        dailyDistribution,
        peakHours,
        quietHours,
        predictedNextPeak,
        resourceRecommendation
      };
    } catch (error) {
      logger.error('Failed to analyze peak usage', error);
      return {
        hourlyDistribution: [],
        dailyDistribution: [],
        peakHours: [],
        quietHours: [],
        predictedNextPeak: new Date(),
        resourceRecommendation: 'Error analyzing usage patterns'
      };
    }
  }

  /**
   * Analyze conversion funnel
   */
  async analyzeConversionFunnel(
    domain: string,
    timeRange: TimeRange,
    funnelDefinition?: string[]
  ): Promise<ConversionFunnel> {
    // Validate date range
    if (timeRange.start >= timeRange.end) {
      logger.warn('Invalid date range provided', { domain, timeRange });
      return {
        stages: [],
        overallConversionRate: 0,
        avgTimeInFunnel: 0,
        bottlenecks: []
      };
    }

    const supabase = this.supabase || await createServiceRoleClient();

    if (!supabase) {
      throw new Error('Database client unavailable');
    }

    try {
      // Get all conversations and messages
      let query = supabase
        .from('conversations')
        .select(`
          id,
          session_id,
          created_at,
          metadata,
          messages (
            id,
            content,
            role,
            created_at
          )
        `)
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString());

      if (domain !== 'all') {
        query = query.eq('domain', domain);
      }

      const { data: conversations, error } = await query;

      if (error) {
        logger.error('Failed to analyze conversion funnel', error);
        return {
          stages: [],
          overallConversionRate: 0,
          avgTimeInFunnel: 0,
          bottlenecks: []
        };
      }

      // Default funnel stages based on common user actions
      const stages_definition = funnelDefinition || [
        'Visit',
        'Product Inquiry',
        'Add to Cart',
        'Checkout',
        'Purchase'
      ];

      // Track progression through stages
      const stageCounts = new Map<string, number>();
      const stageCompletions = new Map<string, number>();
      const stageDurations = new Map<string, number[]>();
      const totalSessions = conversations?.length || 0;

      // Initialize stage tracking
      for (const stageName of stages_definition) {
        stageCounts.set(stageName, 0);
        stageCompletions.set(stageName, 0);
        stageDurations.set(stageName, []);
      }

      // Analyze each conversation
      for (const conversation of conversations || []) {
        const messages = conversation.messages || [];
        if (messages.length === 0) continue;

        // Every session starts with 'Visit'
        stageCounts.set('Visit', (stageCounts.get('Visit') || 0) + 1);

        const userMessages = messages.filter(m => m.role === 'user');
        let currentStageIndex = 0;
        let stageStartTime = new Date(messages[0]!.created_at);

        // Categorize messages to determine stage progression
        for (const message of userMessages) {
          const category = this.categorizeMessageForFunnel(message.content);
          const stageIndex = this.getStageIndexForCategory(category, stages_definition);

          // Track stage entry
          if (stageIndex >= 0 && stageIndex < stages_definition.length) {
            const stageName = stages_definition[stageIndex]!;
            stageCounts.set(stageName, (stageCounts.get(stageName) || 0) + 1);

            // Calculate duration in previous stage
            if (currentStageIndex < stageIndex) {
              const prevStageName = stages_definition[currentStageIndex]!;
              const duration = (new Date(message.created_at).getTime() - stageStartTime.getTime()) / 1000; // seconds
              const durations = stageDurations.get(prevStageName) || [];
              durations.push(duration);
              stageDurations.set(prevStageName, durations);

              // Mark previous stage as completed
              stageCompletions.set(prevStageName, (stageCompletions.get(prevStageName) || 0) + 1);

              currentStageIndex = stageIndex;
              stageStartTime = new Date(message.created_at);
            }
          }
        }
      }

      // Build stage metrics
      const stages: FunnelStage[] = stages_definition.map((stageName, index) => {
        const entered = stageCounts.get(stageName) || 0;
        const completed = stageCompletions.get(stageName) || 0;
        const durations = stageDurations.get(stageName) || [];
        const avgDuration = durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0;

        return {
          name: stageName,
          enteredCount: entered,
          completedCount: completed,
          conversionRate: entered > 0 ? (completed / entered) : 0,
          avgDuration,
          dropOffReasons: this.analyzeDropOffReasons(stageName, conversations || [])
        };
      });

      // Identify bottlenecks
      const bottlenecks: Bottleneck[] = stages
        .filter(s => s.conversionRate < 0.5 && s.enteredCount > 0)
        .map(s => ({
          stage: s.name,
          severity: (s.conversionRate < 0.3 ? 'high' : s.conversionRate < 0.5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          impact: (1 - s.conversionRate) * s.enteredCount,
          recommendation: `Improve ${s.name} stage - ${Math.round((1 - s.conversionRate) * 100)}% drop-off rate detected`
        }))
        .sort((a, b) => b.impact - a.impact);

      // Calculate overall metrics
      const finalStage = stages[stages.length - 1];
      const overallConversionRate = totalSessions > 0
        ? (finalStage?.completedCount || 0) / totalSessions
        : 0;

      const avgTimeInFunnel = stages.reduce((sum, s) => sum + s.avgDuration, 0);

      return {
        stages,
        overallConversionRate,
        avgTimeInFunnel,
        bottlenecks
      };
    } catch (error) {
      logger.error('Failed to analyze conversion funnel', error);
      return {
        stages: [],
        overallConversionRate: 0,
        avgTimeInFunnel: 0,
        bottlenecks: []
      };
    }
  }

  // Helper methods
  private categorizeMessage(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('order') || lower.includes('track')) return 'order_inquiry';
    if (lower.includes('price') || lower.includes('cost')) return 'price_inquiry';
    if (lower.includes('product') || lower.includes('item')) return 'product_inquiry';
    if (lower.includes('help') || lower.includes('support')) return 'support_request';
    if (lower.includes('contact') || lower.includes('email')) return 'contact_request';
    return 'general_inquiry';
  }

  private isConversionMessage(content: string): boolean {
    const conversionKeywords = ['order', 'buy', 'purchase', 'contact', 'email', 'phone'];
    return conversionKeywords.some(keyword =>
      content.toLowerCase().includes(keyword)
    );
  }

  private calculateTimeToConversion(messages: any[]): number {
    if (messages.length < 2) return 0;
    const first = new Date(messages[0].created_at);
    const last = new Date(messages[messages.length - 1].created_at);
    return (last.getTime() - first.getTime()) / 60000; // minutes
  }

  private extractTopics(query: string): string[] {
    // Simple topic extraction - would use NLP in production
    const words = query.split(/\s+/);
    return words.filter(w => w.length > 4);
  }

  private generateContentSuggestions(
    unansweredQueries: UnansweredQuery[],
    topics: string[]
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];

    // Group similar queries
    const topicGroups = new Map<string, string[]>();
    for (const query of unansweredQueries) {
      const topic = topics.find(t => query.query.includes(t)) || 'general';
      const group = topicGroups.get(topic) || [];
      group.push(query.query);
      topicGroups.set(topic, group);
    }

    // Generate suggestions
    for (const [topic, queries] of topicGroups.entries()) {
      suggestions.push({
        topic,
        demandScore: queries.length * 10,
        suggestedType: this.determineSuggestedType(queries),
        relatedQueries: queries.slice(0, 5)
      });
    }

    return suggestions.sort((a, b) => b.demandScore - a.demandScore).slice(0, 10);
  }

  private determineSuggestedType(queries: string[]): 'faq' | 'guide' | 'product_info' {
    const faqKeywords = ['what', 'how', 'why', 'when', 'where'];
    const guideKeywords = ['setup', 'install', 'configure', 'use'];
    const productKeywords = ['product', 'item', 'price', 'stock'];

    const text = queries.join(' ').toLowerCase();

    if (guideKeywords.some(k => text.includes(k))) return 'guide';
    if (productKeywords.some(k => text.includes(k))) return 'product_info';
    return 'faq';
  }

  private findPeakHour(messages: number[]): number {
    // Simple implementation - would need actual hour data
    return Math.floor(Math.random() * 24);
  }

  private predictNextPeak(hourly: HourlyUsage[], daily: DailyUsage[]): Date {
    // Find the most common peak hour
    const peakHour = hourly.reduce((max, h) =>
      h.avgMessages > max.avgMessages ? h : max
    ).hour;

    // Find the busiest day
    const peakDay = daily.reduce((max, d) =>
      d.totalMessages > max.totalMessages ? d : max
    ).dayOfWeek;

    // Calculate next occurrence
    const now = new Date();
    const daysUntilPeak = (peakDay - now.getDay() + 7) % 7 || 7;
    const nextPeak = new Date(now);
    nextPeak.setDate(nextPeak.getDate() + daysUntilPeak);
    nextPeak.setHours(peakHour, 0, 0, 0);

    return nextPeak;
  }

  private generateResourceRecommendation(
    peakHours: any[],
    quietHours: any[],
    hourlyDistribution: HourlyUsage[]
  ): string {
    const peakLoad = peakHours[0]?.load || 0;
    const avgLoad = hourlyDistribution.reduce((sum, h) => sum + h.avgMessages, 0) / 24;

    if (peakLoad > avgLoad * 3) {
      return `Consider scaling resources during peak hours (${peakHours.map(p => `${p.hour}:00`).join(', ')}). ` +
        `Load is ${(peakLoad / avgLoad).toFixed(1)}x average during these times.`;
    }

    if (quietHours[0]?.load < avgLoad * 0.2) {
      return `Consider reducing resources during quiet hours (${quietHours.map(q => `${q.hour}:00`).join(', ')}). ` +
        `You could save costs with scheduled scaling.`;
    }

    return 'Load is relatively consistent. Current resource allocation appears optimal.';
  }

  private categorizeMessageForFunnel(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('checkout') || lower.includes('purchase') || lower.includes('buy')) {
      return 'checkout';
    }
    if (lower.includes('cart') || lower.includes('add to cart')) {
      return 'cart';
    }
    if (lower.includes('product') || lower.includes('show') || lower.includes('browse')) {
      return 'product';
    }
    return 'visit';
  }

  private getStageIndexForCategory(category: string, stages: string[]): number {
    const categoryToStage: { [key: string]: string } = {
      'visit': 'Visit',
      'product': 'Product Inquiry',
      'cart': 'Add to Cart',
      'checkout': 'Checkout'
    };

    const stageName = categoryToStage[category];
    if (!stageName) return 0;

    return stages.indexOf(stageName);
  }

  private analyzeDropOffReasons(stageName: string, conversations: any[]): string[] {
    // Simple drop-off reason analysis based on stage
    const reasons: { [key: string]: string[] } = {
      'Visit': ['No engagement', 'Quick exit'],
      'Product Inquiry': ['No relevant products', 'Unclear response'],
      'Add to Cart': ['Price concerns', 'Out of stock'],
      'Checkout': ['Payment issues', 'Shipping concerns'],
      'Purchase': ['Technical error', 'Changed mind']
    };

    return reasons[stageName] || ['Unknown'];
  }
}

// Export singleton instance
export const businessIntelligence = BusinessIntelligence.getInstance();