/**
 * Sentiment Analysis Utilities
 *
 * Purpose: Functions for calculating and aggregating sentiment across messages
 * in conversation threads.
 *
 * Last Updated: 2025-11-10
 */

/**
 * Calculate overall sentiment from multiple messages
 *
 * Uses majority voting to determine the dominant sentiment in a conversation.
 * In case of a tie, defaults to 'neutral'.
 *
 * @param sentiments - Array of sentiment strings from individual messages
 * @returns Overall sentiment (positive, negative, or neutral)
 *
 * @example
 * calculateOverallSentiment(['positive', 'positive', 'neutral']) // 'positive'
 * calculateOverallSentiment(['negative', 'positive', 'neutral']) // 'neutral'
 */
export function calculateOverallSentiment(sentiments: (string | undefined)[]): string {
  if (sentiments.length === 0) return 'neutral';

  const counts = {
    positive: 0,
    negative: 0,
    neutral: 0
  };

  for (const sentiment of sentiments) {
    if (sentiment === 'positive') counts.positive++;
    else if (sentiment === 'negative') counts.negative++;
    else counts.neutral++;
  }

  // Return the dominant sentiment
  if (counts.negative > counts.positive && counts.negative > counts.neutral) {
    return 'negative';
  } else if (counts.positive > counts.negative && counts.positive > counts.neutral) {
    return 'positive';
  } else {
    return 'neutral';
  }
}

/**
 * Get sentiment distribution statistics
 *
 * @param sentiments - Array of sentiment strings
 * @returns Object with counts for each sentiment type
 */
export function getSentimentDistribution(sentiments: (string | undefined)[]): {
  positive: number;
  negative: number;
  neutral: number;
} {
  const counts = {
    positive: 0,
    negative: 0,
    neutral: 0
  };

  for (const sentiment of sentiments) {
    if (sentiment === 'positive') counts.positive++;
    else if (sentiment === 'negative') counts.negative++;
    else counts.neutral++;
  }

  return counts;
}
