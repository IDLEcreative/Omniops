/**
 * Sentiment analysis utilities
 */

import { POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS } from './constants';
import { normaliseContent, containsPhrase, clamp } from './utilities';
import type { DailySentimentStat } from './types';

export const classifySentiment = (content: string): -1 | 0 | 1 => {
  const normalised = normaliseContent(content);

  const isPositive = containsPhrase(normalised, POSITIVE_KEYWORDS);
  const isNegative = containsPhrase(normalised, NEGATIVE_KEYWORDS);

  if (isPositive && !isNegative) return 1;
  if (isNegative && !isPositive) return -1;
  if (isPositive && isNegative) return 0; // conflicting signals
  return 0;
};

export const calculateDailySentiment = (
  sentimentByDate: Map<
    string,
    { positive: number; negative: number; neutral: number; total: number }
  >
): DailySentimentStat[] => {
  const entries: DailySentimentStat[] = [];

  for (const [date, counts] of sentimentByDate.entries()) {
    const denominator = counts.total || 1;
    const sentimentScore = clamp(
      3 + ((counts.positive - counts.negative) / denominator) * 2,
      1,
      5
    );

    entries.push({
      date,
      positive: counts.positive,
      negative: counts.negative,
      neutral: counts.neutral,
      total: counts.total,
      satisfactionScore: parseFloat(sentimentScore.toFixed(2)),
    });
  }

  // Sort ascending by date for charting
  return entries.sort((a, b) => a.date.localeCompare(b.date));
};
