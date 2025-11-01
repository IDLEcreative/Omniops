/**
 * Business Intelligence Analytics - Main Orchestrator
 * Coordinates all BI analysis operations
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/types/supabase';

// Type imports
import type {
  TimeRange,
  CustomerJourneyMetrics,
  ContentGapAnalysis,
  PeakUsagePattern,
  ConversionFunnel
} from './business-intelligence-types';

// Query imports
import {
  fetchConversationsWithMessages,
  fetchUserMessages,
  fetchMessagesForUsageAnalysis
} from './business-intelligence-queries';

// Calculator imports
import {
  calculateJourneyMetrics,
  formatJourneyPaths,
  formatDropOffPoints,
  analyzeContentGaps,
  formatUnansweredQueries,
  calculateUsageDistributions,
  predictNextPeak,
  generateResourceRecommendation
} from './business-intelligence-calculators';

// Helper imports
import { generateContentSuggestions } from './business-intelligence-helpers';

// Report imports
import {
  trackFunnelProgression,
  buildFunnelStages,
  identifyBottlenecks
} from './business-intelligence-reports';

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
    if (timeRange.start >= timeRange.end) {
      logger.warn('Invalid date range provided', { domain, timeRange });
      return this.getEmptyJourneyMetrics();
    }

    try {
      const sessions = await fetchConversationsWithMessages(domain, timeRange, this.supabase);

      const {
        journeyPaths,
        dropOffs,
        totalSessions,
        conversions,
        totalMessages,
        totalTimeToConversion
      } = calculateJourneyMetrics(sessions);

      const commonPaths = formatJourneyPaths(journeyPaths, totalSessions);
      const dropOffPoints = formatDropOffPoints(dropOffs, totalSessions);

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
      return this.getEmptyJourneyMetrics();
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
    if (timeRange.start >= timeRange.end) {
      logger.warn('Invalid date range provided', { domain, timeRange });
      return this.getEmptyContentGapAnalysis();
    }

    try {
      const messages = await fetchUserMessages(domain, timeRange, 1000, this.supabase);

      const { queryFrequency, queryConfidence, topics } = analyzeContentGaps(
        messages,
        confidenceThreshold
      );

      const unansweredQueries = formatUnansweredQueries(queryFrequency, queryConfidence);

      const lowConfidenceTopics = Array.from(topics.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([topic]) => topic);

      const suggestedContent = generateContentSuggestions(
        unansweredQueries,
        lowConfidenceTopics
      );

      const totalQueries = messages.length;
      const answeredQueries = messages.filter(m =>
        (m.metadata?.confidence || 1) >= confidenceThreshold
      ).length;
      const coverageScore = (answeredQueries / Math.max(totalQueries, 1)) * 100;

      return {
        unansweredQueries,
        lowConfidenceTopics,
        suggestedContent,
        coverageScore
      };
    } catch (error) {
      logger.error('Failed to analyze content gaps', error);
      return this.getEmptyContentGapAnalysis();
    }
  }

  /**
   * Analyze peak usage patterns
   */
  async analyzePeakUsage(
    domain: string,
    timeRange: TimeRange
  ): Promise<PeakUsagePattern> {
    if (timeRange.start >= timeRange.end) {
      logger.warn('Invalid date range provided', { domain, timeRange });
      return this.getEmptyPeakUsagePattern();
    }

    try {
      const messages = await fetchMessagesForUsageAnalysis(domain, timeRange, this.supabase);

      const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));

      const { hourlyDistribution, dailyDistribution } = calculateUsageDistributions(messages, days);

      const sortedHours = hourlyDistribution
        .map((h, idx) => ({ hour: idx, load: h.avgMessages }))
        .sort((a, b) => b.load - a.load);

      const peakHours = sortedHours.slice(0, 3);
      const quietHours = sortedHours.slice(-3).reverse();

      const predictedNextPeak = predictNextPeak(hourlyDistribution, dailyDistribution);

      const resourceRecommendation = generateResourceRecommendation(
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
      return this.getEmptyPeakUsagePattern();
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
    if (timeRange.start >= timeRange.end) {
      logger.warn('Invalid date range provided', { domain, timeRange });
      return this.getEmptyConversionFunnel();
    }

    try {
      const conversations = await fetchConversationsWithMessages(domain, timeRange, this.supabase);

      const stagesDefinition = funnelDefinition || [
        'Visit',
        'Product Inquiry',
        'Add to Cart',
        'Checkout',
        'Purchase'
      ];

      const { stageCounts, stageCompletions, stageDurations } = trackFunnelProgression(
        conversations,
        stagesDefinition
      );

      const stages = buildFunnelStages(
        stagesDefinition,
        stageCounts,
        stageCompletions,
        stageDurations,
        conversations
      );

      const bottlenecks = identifyBottlenecks(stages);

      const totalSessions = conversations.length;
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
      return this.getEmptyConversionFunnel();
    }
  }

  // Empty state helpers
  private getEmptyJourneyMetrics = (): CustomerJourneyMetrics => ({
    conversionRate: 0, avgSessionsBeforeConversion: 0, avgMessagesPerSession: 0,
    commonPaths: [], dropOffPoints: [], timeToConversion: 0
  });

  private getEmptyContentGapAnalysis = (): ContentGapAnalysis => ({
    unansweredQueries: [], lowConfidenceTopics: [], suggestedContent: [], coverageScore: 0
  });

  private getEmptyPeakUsagePattern = (): PeakUsagePattern => ({
    hourlyDistribution: [], dailyDistribution: [], peakHours: [], quietHours: [],
    predictedNextPeak: new Date(), resourceRecommendation: 'Invalid date range provided'
  });

  private getEmptyConversionFunnel = (): ConversionFunnel => ({
    stages: [], overallConversionRate: 0, avgTimeInFunnel: 0, bottlenecks: []
  });
}

// Export singleton instance
export const businessIntelligence = BusinessIntelligence.getInstance();

// Re-export types for convenience
export * from './business-intelligence-types';
