/**
 * Pattern Learning Logic
 */

import { createClient } from '@supabase/supabase-js';
import { NormalizedProduct } from '../product-normalizer';
import { ExtractedPattern, DomainPatterns } from './types';

export class PatternLearning {
  private static getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

    const client = createClient(url, key);
    return client;
  }

  private static get supabase() {
    return this.getSupabaseClient();
  }

  /**
   * Learn patterns from a successful extraction
   */
  static async learnFromExtraction(
    url: string,
    products: NormalizedProduct[],
    extractionData: {
      platform?: string;
      selectors?: Record<string, string>;
      extractionMethod?: string;
    }
  ): Promise<void> {
    try {
      const domain = new URL(url).hostname;
      const patterns: ExtractedPattern[] = [];

      // Analyze products to identify common patterns
      if (products.length > 0) {
        const sampleProduct = products[0];

        // Learn price patterns
        if (sampleProduct && sampleProduct.price) {
          patterns.push({
            selector: extractionData.selectors?.price || '.price',
            fieldType: 'price',
            confidence: 0.9,
            sampleValue: sampleProduct.price.formatted,
            extractionMethod: (extractionData.extractionMethod as any) || 'dom'
          });
        }

        // Learn name patterns
        if (sampleProduct && sampleProduct.name) {
          patterns.push({
            selector: extractionData.selectors?.name || 'h1, .product-title',
            fieldType: 'name',
            confidence: 0.85,
            sampleValue: sampleProduct.name,
            extractionMethod: (extractionData.extractionMethod as any) || 'dom'
          });
        }

        // Learn SKU patterns
        if (sampleProduct && sampleProduct.sku) {
          patterns.push({
            selector: extractionData.selectors?.sku || '.sku',
            fieldType: 'sku',
            confidence: 0.95,
            sampleValue: sampleProduct.sku,
            extractionMethod: (extractionData.extractionMethod as any) || 'dom'
          });
        }
      }

      // Skip saving if no patterns were learned
      if (patterns.length === 0) {
        return;
      }

      // Save or update patterns for this domain
      await this.saveDomainPatterns(domain, {
        domain,
        platform: extractionData.platform,
        patterns,
        lastUpdated: new Date().toISOString(),
        successRate: 1.0,
        totalExtractions: 1
      });
    } catch (error) {
      console.error('Failed to learn from extraction:', error);
    }
  }

  /**
   * Get saved patterns for a domain
   */
  static async getPatterns(url: string): Promise<DomainPatterns | null> {
    try {
      const domain = new URL(url).hostname;

      const { data, error } = await this.supabase
        .from('domain_patterns')
        .select('*')
        .eq('domain', domain)
        .single();

      if (error || !data) return null;

      return data as DomainPatterns;
    } catch (error) {
      console.error('Failed to get patterns:', error);
      return null;
    }
  }

  /**
   * Save domain patterns to database
   */
  private static async saveDomainPatterns(
    domain: string,
    patterns: DomainPatterns
  ): Promise<void> {
    const supa = this.supabase as any;
    const qb1 = supa.from('domain_patterns');
    const { data: existing } = await qb1
      .select('*')
      .eq('domain', domain)
      .single();

    if (existing) {
      const mergedPatterns = this.mergePatterns(
        existing.patterns || [],
        patterns.patterns
      );

      const qb2 = supa.from('domain_patterns');
      await qb2
        .update({
          patterns: mergedPatterns,
          platform: patterns.platform || existing.platform,
          lastUpdated: patterns.lastUpdated,
          successRate: (existing.successRate * existing.totalExtractions + patterns.successRate) /
                      (existing.totalExtractions + 1),
          totalExtractions: existing.totalExtractions + 1
        })
        .eq('domain', domain);
    } else {
      const qb3 = supa.from('domain_patterns');
      await qb3.insert(patterns);
    }
  }

  /**
   * Merge new patterns with existing ones, updating confidence
   */
  private static mergePatterns(
    existing: ExtractedPattern[],
    newPatterns: ExtractedPattern[]
  ): ExtractedPattern[] {
    const patternMap = new Map<string, ExtractedPattern>();

    for (const pattern of existing) {
      const key = `${pattern.fieldType}:${pattern.selector}`;
      patternMap.set(key, pattern);
    }

    for (const pattern of newPatterns) {
      const key = `${pattern.fieldType}:${pattern.selector}`;
      const existing = patternMap.get(key);

      if (existing) {
        existing.confidence = (existing.confidence * 0.7 + pattern.confidence * 0.3);
        existing.sampleValue = pattern.sampleValue || existing.sampleValue;
      } else {
        patternMap.set(key, pattern);
      }
    }

    return Array.from(patternMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }
}
