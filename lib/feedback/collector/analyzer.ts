/**
 * Feedback Analyzer
 *
 * Utilities for analyzing and categorizing feedback data
 */

import { FeedbackType, type FeedbackData } from './types';

export class FeedbackAnalyzer {
  /**
   * Calculate Net Promoter Score (NPS)
   * NPS = % Promoters (9-10) - % Detractors (0-6)
   */
  static calculateNPS(scores: number[]): number {
    if (scores.length === 0) return 0;

    const promoters = scores.filter(s => s >= 9).length;
    const detractors = scores.filter(s => s <= 6).length;
    const total = scores.length;

    return Math.round(((promoters - detractors) / total) * 100);
  }

  /**
   * Calculate average satisfaction rating
   */
  static calculateAverageSatisfaction(ratings: number[]): number {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }

  /**
   * Categorize feedback sentiment
   */
  static categorizeSentiment(rating: number): 'negative' | 'neutral' | 'positive' {
    if (rating <= 2) return 'negative';
    if (rating === 3) return 'neutral';
    return 'positive';
  }

  /**
   * Extract common themes from feedback messages
   */
  static extractThemes(messages: string[]): Map<string, number> {
    const themes = new Map<string, number>();

    // Common keywords to track
    const keywords = [
      'slow', 'fast', 'helpful', 'confusing', 'easy', 'difficult',
      'bug', 'error', 'broken', 'great', 'terrible', 'love', 'hate',
      'missing', 'need', 'want', 'feature', 'improvement'
    ];

    for (const message of messages) {
      const lowerMessage = message.toLowerCase();
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          themes.set(keyword, (themes.get(keyword) || 0) + 1);
        }
      }
    }

    return themes;
  }

  /**
   * Identify urgent feedback requiring immediate attention
   */
  static isUrgent(feedback: FeedbackData): boolean {
    if (feedback.type === FeedbackType.BUG) return true;
    if (feedback.rating && feedback.rating <= 2) return true;
    if (feedback.npsScore !== undefined && feedback.npsScore <= 3) return true;

    // Check for urgent keywords
    const urgentKeywords = ['broken', 'crash', 'error', 'urgent', 'critical', 'can\'t'];
    const message = feedback.message?.toLowerCase() || '';
    return urgentKeywords.some(keyword => message.includes(keyword));
  }
}
