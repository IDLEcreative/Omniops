/**
 * Calculation utilities for Business Intelligence Analytics
 * Pure functions for metric calculations and data processing
 */

import type {
  ConversationData,
  MessageData,
  JourneyPath,
  DropOffPoint,
  UnansweredQuery,
  HourlyUsage,
  DailyUsage
} from './business-intelligence-types';

import {
  categorizeMessage,
  isConversionMessage,
  calculateTimeToConversion,
  extractTopics
} from './business-intelligence-helpers';

/**
 * Calculate customer journey metrics from conversations
 */
export function calculateJourneyMetrics(
  conversations: ConversationData[]
): {
  journeyPaths: Map<string, number>;
  dropOffs: Map<string, number>;
  totalSessions: number;
  conversions: number;
  totalMessages: number;
  totalTimeToConversion: number;
} {
  const journeyPaths = new Map<string, number>();
  const dropOffs = new Map<string, number>();
  let totalSessions = 0;
  let conversions = 0;
  let totalMessages = 0;
  let totalTimeToConversion = 0;

  for (const session of conversations) {
    const messages = session.messages || [];
    totalSessions++;
    totalMessages += messages.length;

    // Extract journey path
    const path = messages
      .filter(m => m.role === 'user')
      .map(m => categorizeMessage(m.content))
      .join(' → ');

    journeyPaths.set(path, (journeyPaths.get(path) || 0) + 1);

    // Check for conversion
    const hasConversion =
      session.metadata?.converted === true ||
      messages.some(m => isConversionMessage(m.content));

    if (hasConversion) {
      conversions++;
      const conversionTime = calculateTimeToConversion(messages);
      totalTimeToConversion += conversionTime;
    } else {
      const lastStage = categorizeMessage(
        messages[messages.length - 1]?.content || ''
      );
      dropOffs.set(lastStage, (dropOffs.get(lastStage) || 0) + 1);
    }
  }

  return {
    journeyPaths,
    dropOffs,
    totalSessions,
    conversions,
    totalMessages,
    totalTimeToConversion
  };
}

/**
 * Format journey paths for reporting
 */
export function formatJourneyPaths(
  journeyPaths: Map<string, number>,
  totalSessions: number
): JourneyPath[] {
  return Array.from(journeyPaths.entries())
    .map(([path, freq]) => ({
      path: path.split(' → '),
      frequency: freq,
      conversionRate: (freq / totalSessions) * 100
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
}

/**
 * Format drop-off points for reporting
 */
export function formatDropOffPoints(
  dropOffs: Map<string, number>,
  totalSessions: number
): DropOffPoint[] {
  return Array.from(dropOffs.entries())
    .map(([stage, count]) => ({
      stage,
      dropOffRate: (count / totalSessions) * 100,
      avgTimeSpent: 0,
      commonQueries: []
    }))
    .sort((a, b) => b.dropOffRate - a.dropOffRate);
}

/**
 * Analyze content gaps from messages
 */
export function analyzeContentGaps(
  messages: MessageData[],
  confidenceThreshold: number
): {
  queryFrequency: Map<string, number>;
  queryConfidence: Map<string, number[]>;
  topics: Map<string, number>;
} {
  const queryFrequency = new Map<string, number>();
  const queryConfidence = new Map<string, number[]>();
  const topics = new Map<string, number>();

  for (const message of messages) {
    const query = message.content.toLowerCase();
    const confidence = message.metadata?.confidence || 1;

    queryFrequency.set(query, (queryFrequency.get(query) || 0) + 1);

    if (confidence < confidenceThreshold) {
      const confidences = queryConfidence.get(query) || [];
      confidences.push(confidence);
      queryConfidence.set(query, confidences);

      // Extract topics
      const extractedTopics = extractTopics(query);
      for (const topic of extractedTopics) {
        topics.set(topic, (topics.get(topic) || 0) + 1);
      }
    }
  }

  return { queryFrequency, queryConfidence, topics };
}

/**
 * Format unanswered queries for reporting
 */
export function formatUnansweredQueries(
  queryFrequency: Map<string, number>,
  queryConfidence: Map<string, number[]>
): UnansweredQuery[] {
  return Array.from(queryConfidence.entries())
    .map(([query, confidences]) => ({
      query,
      frequency: queryFrequency.get(query) || 1,
      avgConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      lastAsked: new Date()
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);
}

/**
 * Calculate hourly and daily usage distributions
 */
export function calculateUsageDistributions(
  messages: MessageData[],
  days: number
): {
  hourlyDistribution: HourlyUsage[];
  dailyDistribution: DailyUsage[];
} {
  const hourlyData = new Map<number, number[]>();
  const dailyData = new Map<number, number[]>();

  for (const message of messages) {
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
      avgResponseTime: 0,
      errorRate: 0
    });
  }

  // Format daily distribution
  const dailyDistribution: DailyUsage[] = [];
  for (let day = 0; day < 7; day++) {
    const messages = dailyData.get(day) || [];
    dailyDistribution.push({
      dayOfWeek: day,
      avgSessions: messages.length / (days / 7),
      peakHour: 0,
      totalMessages: messages.length
    });
  }

  return { hourlyDistribution, dailyDistribution };
}

/**
 * Predict next peak usage time
 */
export function predictNextPeak(hourly: HourlyUsage[], daily: DailyUsage[]): Date {
  const peakHour = hourly.reduce((max, h) =>
    h.avgMessages > max.avgMessages ? h : max
  ).hour;

  const peakDay = daily.reduce((max, d) =>
    d.totalMessages > max.totalMessages ? d : max
  ).dayOfWeek;

  const now = new Date();
  const daysUntilPeak = (peakDay - now.getDay() + 7) % 7 || 7;
  const nextPeak = new Date(now);
  nextPeak.setDate(nextPeak.getDate() + daysUntilPeak);
  nextPeak.setHours(peakHour, 0, 0, 0);

  return nextPeak;
}

/**
 * Generate resource recommendation based on usage patterns
 */
export function generateResourceRecommendation(
  peakHours: { hour: number; load: number }[],
  quietHours: { hour: number; load: number }[],
  hourlyDistribution: HourlyUsage[]
): string {
  const peakLoad = peakHours[0]?.load || 0;
  const avgLoad = hourlyDistribution.reduce((sum, h) => sum + h.avgMessages, 0) / 24;

  if (peakLoad > avgLoad * 3) {
    return `Consider scaling resources during peak hours (${peakHours.map(p => `${p.hour}:00`).join(', ')}). ` +
      `Load is ${(peakLoad / avgLoad).toFixed(1)}x average during these times.`;
  }

  if (quietHours[0] && quietHours[0].load < avgLoad * 0.2) {
    return `Consider reducing resources during quiet hours (${quietHours.map(q => `${q.hour}:00`).join(', ')}). ` +
      `You could save costs with scheduled scaling.`;
  }

  return 'Load is relatively consistent. Current resource allocation appears optimal.';
}
