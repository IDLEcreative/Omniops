/**
 * Pattern Learning System
 * Learns and saves successful extraction patterns per domain
 * for improved future scraping performance
 */

import { createClient } from '@supabase/supabase-js';
import { NormalizedProduct } from './product-normalizer';

export interface ExtractedPattern {
  selector: string;
  attribute?: string;
  fieldType: 'name' | 'price' | 'image' | 'availability' | 'sku' | 'description' | 'variant' | 'specification';
  confidence: number;
  sampleValue?: string;
  extractionMethod: 'json-ld' | 'microdata' | 'dom' | 'regex';
}

export interface DomainPatterns {
  domain: string;
  platform?: string;
  patterns: ExtractedPattern[];
  productListSelectors?: string[];
  paginationSelectors?: {
    next?: string;
    total?: string;
    current?: string;
  };
  lastUpdated: string;
  successRate: number;
  totalExtractions: number;
}

export class PatternLearner {
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
      // Don't throw - pattern learning failure shouldn't break extraction
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
    // Check if patterns exist for this domain
    const supa = this.supabase as any;
    const qb1 = supa.from('domain_patterns');
    const { data: existing } = await qb1
      .select('*')
      .eq('domain', domain)
      .single();

    if (existing) {
      // Merge patterns and update statistics
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
      // Insert new patterns
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

    // Add existing patterns
    for (const pattern of existing) {
      const key = `${pattern.fieldType}:${pattern.selector}`;
      patternMap.set(key, pattern);
    }

    // Merge new patterns
    for (const pattern of newPatterns) {
      const key = `${pattern.fieldType}:${pattern.selector}`;
      const existing = patternMap.get(key);
      
      if (existing) {
        // Update confidence (weighted average)
        existing.confidence = (existing.confidence * 0.7 + pattern.confidence * 0.3);
        existing.sampleValue = pattern.sampleValue || existing.sampleValue;
      } else {
        patternMap.set(key, pattern);
      }
    }

    return Array.from(patternMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Apply learned patterns to speed up extraction
   */
  static async applyPatterns(
    url: string,
    selectorContext: any // CheerioAPI or wrapper
  ): Promise<Partial<NormalizedProduct> | null> {
    try {
      const patterns = await this.getPatterns(url);
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
        if (pattern.confidence < 0.7) continue; // Skip low-confidence patterns

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
            case 'price':
              // Price will be normalized by ProductNormalizer
              break;
            case 'sku':
              product.sku = value;
              break;
            case 'description':
              product.description = value;
              break;
            case 'availability':
              // Availability will be normalized
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
          // Pattern didn't work, reduce confidence
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
   * Analyze extraction success and update pattern confidence
   */
  static async updatePatternSuccess(
    url: string,
    success: boolean,
    usedPatterns?: string[]
  ): Promise<void> {
    const domain = new URL(url).hostname;
    const patterns = await this.getPatterns(url);
    
    if (!patterns) return;

    // Update overall success rate
    const newSuccessRate = (patterns.successRate * patterns.totalExtractions + 
                           (success ? 1 : 0)) / (patterns.totalExtractions + 1);

    // Update specific pattern confidence if provided
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

    await this.supabase
      .from('domain_patterns')
      .update({
        patterns: patterns.patterns,
        successRate: newSuccessRate,
        totalExtractions: patterns.totalExtractions + 1,
        lastUpdated: new Date().toISOString()
      })
      .eq('domain', domain);
  }

  /**
   * Get pattern recommendations for a new domain based on platform
   */
  static async getRecommendations(
    url: string,
    platform?: string
  ): Promise<ExtractedPattern[]> {
    if (!platform) return [];

    // Get patterns from similar platforms
    const { data } = await this.supabase
      .from('domain_patterns')
      .select('patterns')
      .eq('platform', platform)
      .order('successRate', { ascending: false })
      .limit(5);

    if (!data || data.length === 0) return [];

    // Aggregate and rank patterns
    const patternMap = new Map<string, ExtractedPattern>();
    
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
