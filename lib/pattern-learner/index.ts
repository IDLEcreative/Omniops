/**
 * Pattern Learning System
 * Learns and saves successful extraction patterns per domain
 * for improved future scraping performance
 */

import { PatternLearning } from './learning';
import { PatternApplication } from './application';

export class PatternLearner {
  static learnFromExtraction = PatternLearning.learnFromExtraction.bind(PatternLearning);
  static getPatterns = PatternLearning.getPatterns.bind(PatternLearning);
  static applyPatterns = PatternApplication.applyPatterns.bind(PatternApplication);
  static getRecommendations = PatternApplication.getRecommendations.bind(PatternApplication);

  /**
   * Analyze extraction success and update pattern confidence
   */
  static async updatePatternSuccess(
    url: string,
    success: boolean,
    usedPatterns?: string[]
  ): Promise<void> {
    const domain = new URL(url).hostname;
    const patterns = await PatternLearning.getPatterns(url);

    if (!patterns) return;

    const newSuccessRate = (patterns.successRate * patterns.totalExtractions +
                           (success ? 1 : 0)) / (patterns.totalExtractions + 1);

    if (usedPatterns && usedPatterns.length > 0) {
      for (const pattern of patterns.patterns) {
        const key = `${pattern.fieldType}:${pattern.selector}`;
        if (usedPatterns.includes(key)) {
          pattern.confidence = success ?
            Math.min(1.0, pattern.confidence * 1.1) :
            pattern.confidence * 0.9;
        }
      }
    }

    const supabase = PatternLearning['getSupabaseClient']();
    await supabase
      .from('domain_patterns')
      .update({
        patterns: patterns.patterns,
        successRate: newSuccessRate,
        totalExtractions: patterns.totalExtractions + 1,
        lastUpdated: new Date().toISOString()
      })
      .eq('domain', domain);
  }
}

export type { ExtractedPattern, DomainPatterns } from './types';
