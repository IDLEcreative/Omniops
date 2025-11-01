/**
 * Pattern Application Logic
 */

import { NormalizedProduct } from '../product-normalizer';
import { DomainPatterns } from './types';
import { PatternLearning } from './learning';

export class PatternApplication {
  /**
   * Apply learned patterns to speed up extraction
   */
  static async applyPatterns(
    url: string,
    selectorContext: any
  ): Promise<Partial<NormalizedProduct> | null> {
    try {
      const patterns = await PatternLearning.getPatterns(url);
      if (!patterns || patterns.patterns.length === 0) return null;

      const product: Partial<NormalizedProduct> = {};
      const query =
        typeof selectorContext === 'function'
          ? selectorContext
          : typeof selectorContext?.query === 'function'
            ? selectorContext.query.bind(selectorContext)
            : typeof selectorContext?.$ === 'function'
              ? selectorContext.$.bind(selectorContext)
              : null;

      if (typeof query !== 'function') {
        console.warn('PatternLearner.applyPatterns received invalid selector context. Skipping learned patterns.');
        return null;
      }

      // Apply high-confidence patterns
      for (const pattern of patterns.patterns) {
        if (pattern.confidence < 0.7) continue;

        try {
          const element = query(pattern.selector);
          if (!element.length) continue;

          const value = pattern.attribute ?
            element.attr(pattern.attribute) :
            element.text().trim();

          if (!value) continue;

          switch (pattern.fieldType) {
            case 'name':
              product.name = value;
              break;
            case 'sku':
              product.sku = value;
              break;
            case 'description':
              product.description = value;
              break;
            case 'image':
              product.images = [{
                url: value,
                isMain: true,
                position: 0
              }];
              break;
          }
        } catch (error) {
          pattern.confidence *= 0.9;
        }
      }

      return Object.keys(product).length > 0 ? product : null;
    } catch (error) {
      console.error('Failed to apply patterns:', error);
      return null;
    }
  }

  /**
   * Get pattern recommendations for a new domain based on platform
   */
  static async getRecommendations(
    url: string,
    platform?: string
  ): Promise<any[]> {
    if (!platform) return [];

    const supabase = PatternLearning['getSupabaseClient']();
    const { data } = await supabase
      .from('domain_patterns')
      .select('patterns')
      .eq('platform', platform)
      .order('successRate', { ascending: false })
      .limit(5);

    if (!data || data.length === 0) return [];

    const patternMap = new Map();

    for (const row of data) {
      for (const pattern of row.patterns || []) {
        const key = `${pattern.fieldType}:${pattern.selector}`;
        const existing = patternMap.get(key);

        if (existing) {
          existing.confidence = Math.max(existing.confidence, pattern.confidence);
        } else {
          patternMap.set(key, { ...pattern, confidence: pattern.confidence * 0.8 });
        }
      }
    }

    return Array.from(patternMap.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }
}
