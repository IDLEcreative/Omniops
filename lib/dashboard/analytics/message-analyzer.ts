/**
 * Message analysis and metrics calculation
 */

import {
  normaliseContent,
  containsPhrase,
  detectLanguage,
  clamp,
} from './utilities';
import { classifySentiment, calculateDailySentiment } from './sentiment';
import { FAILED_SEARCH_PHRASES } from './constants';
import type {
  DashboardMessageRecord,
  MessageAnalytics,
  TopQueryStat,
  LanguageDistributionStat,
} from './types';

export function analyseMessages(
  messages: DashboardMessageRecord[],
  options: { days?: number } = {}
): MessageAnalytics {
  const { days = 7 } = options;

  if (!messages || messages.length === 0) {
    return {
      avgResponseTimeSeconds: 0,
      satisfactionScore: 3,
      resolutionRate: 85,
      topQueries: [],
      failedSearches: [],
      languageDistribution: [],
      totalMessages: 0,
      totalUserMessages: 0,
      avgMessagesPerDay: 0,
      positiveUserMessages: 0,
      negativeUserMessages: 0,
      dailySentiment: [],
    };
  }

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const responseTimes: number[] = [];
  const topQueryCounts = new Map<string, number>();
  const failedSearchesSet = new Set<string>();
  const languageCounts: Record<string, number> = {
    english: 0,
    spanish: 0,
    french: 0,
    german: 0,
    other: 0,
  };
  const sentimentByDate = new Map<
    string,
    { positive: number; negative: number; neutral: number; total: number }
  >();

  let lastUserMessageTime: number | null = null;
  let lastUserMessageContent: string | null = null;
  let totalUserMessages = 0;
  let positiveCount = 0;
  let negativeCount = 0;

  sortedMessages.forEach((message) => {
    const timestamp = new Date(message.created_at).getTime();
    if (!Number.isFinite(timestamp)) {
      return;
    }

    if (message.role === 'user') {
      totalUserMessages += 1;
      lastUserMessageTime = timestamp;
      lastUserMessageContent = message.content;

      const sentiment = classifySentiment(message.content);
      const dateKey = new Date(message.created_at).toISOString().slice(0, 10);
      const sentimentEntry =
        sentimentByDate.get(dateKey) ?? { positive: 0, negative: 0, neutral: 0, total: 0 };

      if (sentiment > 0) {
        positiveCount += 1;
        sentimentEntry.positive += 1;
      } else if (sentiment < 0) {
        negativeCount += 1;
        sentimentEntry.negative += 1;
      } else {
        sentimentEntry.neutral += 1;
      }
      sentimentEntry.total += 1;
      sentimentByDate.set(dateKey, sentimentEntry);

      const language = detectLanguage(message.content);
      languageCounts[language] = (languageCounts[language] || 0) + 1;
    }

    if (message.role === 'assistant') {
      if (lastUserMessageTime) {
        const responseTimeSeconds = (timestamp - lastUserMessageTime) / 1000;
        if (responseTimeSeconds > 0 && responseTimeSeconds <= 300) {
          responseTimes.push(responseTimeSeconds);
        }
      }

      if (lastUserMessageContent) {
        const assistantContent = normaliseContent(message.content);
        if (containsPhrase(assistantContent, FAILED_SEARCH_PHRASES)) {
          const query = lastUserMessageContent.trim().slice(0, 120);
          if (query.length > 0) {
            failedSearchesSet.add(query);
            const currentCount = topQueryCounts.get(query) ?? 0;
            topQueryCounts.set(query, currentCount + 1);
          }
        }
      }

      // Prevent pairing with multiple assistant replies for same user message
      lastUserMessageTime = null;
      lastUserMessageContent = null;
    }
  });

  const avgResponseTimeSeconds =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length
      : 0;

  const sentimentRatio =
    totalUserMessages > 0 ? (positiveCount - negativeCount) / totalUserMessages : 0;
  const satisfactionScore = clamp(3 + sentimentRatio * 2, 1, 5);
  const resolutionRate =
    totalUserMessages > 0
      ? clamp(((totalUserMessages - negativeCount) / totalUserMessages) * 100, 0, 100)
      : 85;

  const topQueries: TopQueryStat[] = Array.from(topQueryCounts.entries())
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .slice(0, 10)
    .map(([query, count]) => ({
      query,
      count,
      percentage:
        totalUserMessages > 0 ? Math.round((count / totalUserMessages) * 100) : 0,
    }));

  const totalLanguageMessages = Object.values(languageCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const languageDistribution: LanguageDistributionStat[] = Object.entries(languageCounts)
    .filter(([, count]) => count > 0)
    .map(([language, count]) => ({
      language: language.charAt(0).toUpperCase() + language.slice(1),
      count,
      percentage:
        totalLanguageMessages > 0 ? Math.round((count / totalLanguageMessages) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  if (languageDistribution.length === 0) {
    languageDistribution.push({
      language: 'English',
      count: 0,
      percentage: 0,
    });
  }

  const avgMessagesPerDay =
    days > 0 ? Math.round((sortedMessages.length / days) * 10) / 10 : sortedMessages.length;

  return {
    avgResponseTimeSeconds: parseFloat(avgResponseTimeSeconds.toFixed(2)),
    satisfactionScore: parseFloat(satisfactionScore.toFixed(2)),
    resolutionRate: parseFloat(resolutionRate.toFixed(2)),
    topQueries,
    failedSearches: Array.from(failedSearchesSet).slice(0, 5),
    languageDistribution,
    totalMessages: sortedMessages.length,
    totalUserMessages,
    avgMessagesPerDay,
    positiveUserMessages: positiveCount,
    negativeUserMessages: negativeCount,
    dailySentiment: calculateDailySentiment(sentimentByDate),
  };
}
