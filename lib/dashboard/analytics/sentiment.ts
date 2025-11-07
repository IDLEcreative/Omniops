/**
 * Sentiment analysis utilities
 *
 * Supports both keyword-based and AI-powered sentiment analysis.
 * Use ENABLE_AI_SENTIMENT=true to enable OpenAI-based analysis.
 */

import { POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS } from './constants';
import { normaliseContent, containsPhrase, clamp } from './utilities';
import type { DailySentimentStat, SentimentResult } from './types';
import {
  analyzeSentimentWithAI,
  sentimentToScore,
  type AISentimentResult,
} from '@/lib/analytics/sentiment-ai';
import { logCostSummary } from '@/lib/analytics/cost-tracker';

// Feature flag for AI sentiment analysis
const AI_SENTIMENT_ENABLED = process.env.ENABLE_AI_SENTIMENT === 'true';

// Log feature status on first load
if (typeof window === 'undefined') {
  console.log(
    `[Sentiment] AI sentiment analysis: ${AI_SENTIMENT_ENABLED ? 'ENABLED' : 'DISABLED (using keyword-based)'}`
  );
}

/**
 * Classify sentiment using keyword-based analysis (fallback method)
 *
 * @param content - Message content to analyze
 * @returns Sentiment score: -1 (negative), 0 (neutral), 1 (positive)
 */
export const classifySentimentKeyword = (content: string): -1 | 0 | 1 => {
  const normalised = normaliseContent(content);

  const isPositive = containsPhrase(normalised, POSITIVE_KEYWORDS);
  const isNegative = containsPhrase(normalised, NEGATIVE_KEYWORDS);

  if (isPositive && !isNegative) return 1;
  if (isNegative && !isPositive) return -1;
  if (isPositive && isNegative) return 0; // conflicting signals
  return 0;
};

/**
 * Classify sentiment using the configured method (AI or keyword-based)
 *
 * This is an async wrapper that:
 * - Uses AI sentiment analysis if ENABLE_AI_SENTIMENT=true
 * - Falls back to keyword-based if AI fails or is disabled
 * - Returns enhanced result with confidence score (if AI is used)
 *
 * @param content - Message content to analyze
 * @returns Sentiment result with score and optional confidence
 */
export async function classifySentimentAsync(
  content: string
): Promise<SentimentResult> {
  if (!AI_SENTIMENT_ENABLED) {
    const score = classifySentimentKeyword(content);
    return { score, confidence: null };
  }

  try {
    const aiResult = await analyzeSentimentWithAI(content);
    if (aiResult) {
      return {
        score: sentimentToScore(aiResult),
        confidence: aiResult.confidence,
      };
    }
  } catch (error) {
    console.error('[Sentiment] AI analysis failed, falling back to keyword:', error);
  }

  // Fallback to keyword-based
  const score = classifySentimentKeyword(content);
  return { score, confidence: null };
}

/**
 * Synchronous sentiment classification (legacy compatibility)
 *
 * Always uses keyword-based analysis for synchronous use cases.
 * For AI analysis, use classifySentimentAsync instead.
 *
 * @param content - Message content to analyze
 * @returns Sentiment score: -1 (negative), 0 (neutral), 1 (positive)
 */
export const classifySentiment = (content: string): -1 | 0 | 1 => {
  return classifySentimentKeyword(content);
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
