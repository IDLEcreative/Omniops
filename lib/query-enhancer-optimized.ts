/**
 * Optimized Query Enhancement System
 * Performance improvements based on profiling results
 */

import { LRUCache } from 'lru-cache';

export type QueryIntent = 'informational' | 'transactional' | 'navigational' | 'troubleshooting' | 'comparison';

export interface EnhancedQuery {
  original: string;
  normalized: string;
  intent: QueryIntent;
  expanded_terms: string[];
  synonyms: Map<string, string[]>;
  entities: {
    products: string[];
    brands: string[];
    skus: string[];
    issues: string[];
    actions: string[];
  };
  spelling_corrections: Map<string, string>;
  related_queries: string[];
  confidence_score: number;
}

export class QueryEnhancerOptimized {
  // Performance optimization: Pre-compiled regex patterns
  private static readonly COMPILED_PATTERNS = {
    sku: /\b([A-Z]{2,}[\-\/]?[\d]{2,}[\w\-]*)\b/gi,
    cleanup: /[^\w\s\-\$£€]/g,
    whitespace: /\s+/g,
    plural: /s$/,
    alphaNum: /^[a-z]+\d+$/i,
    alphaNumSplit: /^([a-z]+)(\d+)$/i,
    sentenceEnd: /[.!?]$/
  };

  // Performance optimization: LRU cache for enhanced queries
  private static queryCache = new LRUCache<string, EnhancedQuery>({
    max: 1000, // Max 1000 queries
    ttl: 1000 * 60 * 60, // 1 hour TTL
    updateAgeOnGet: true
  });

  // Performance optimization: Limit synonym expansions
  private static readonly MAX_SYNONYMS = 10;
  private static readonly MAX_EXPANDED_TERMS = 15;
  private static readonly MAX_RELATED_QUERIES = 3;

  // Performance optimization: Use Map for O(1) lookups
  private static readonly SYNONYM_MAP = new Map([
    ['motor', ['engine', 'drive', 'power unit']],
    ['broken', ['faulty', 'damaged', 'not working', 'defective']],
    ['install', ['setup', 'mount', 'fit', 'installation']],
    ['warranty', ['guarantee', 'coverage', 'protection']],
    ['replace', ['replacement', 'substitute', 'swap']],
    ['part', ['component', 'spare', 'piece']],
    ['manual', ['guide', 'instructions', 'documentation']],
    ['fix', ['repair', 'mend', 'resolve']],
    ['cheap', ['affordable', 'budget', 'inexpensive']],
    ['expensive', ['premium', 'high-end', 'costly']],
    ['buy', ['purchase', 'order', 'acquire']],
    ['price', ['cost', 'pricing', 'rate']],
    ['ship', ['shipping', 'delivery', 'dispatch']],
    ['return', ['refund', 'exchange', 'RMA']]
  ]);

  // Performance optimization: Pre-built reverse synonym map
  private static readonly REVERSE_SYNONYMS = QueryEnhancerOptimized.buildReverseSynonyms();

  // Performance optimization: Use Sets for O(1) lookups
  private static readonly BRANDS = new Set(['bosch', 'makita', 'dewalt', 'milwaukee', 'ryobi', 'ford', 'toyota', 'honda', 'bmw', 'mercedes']);
  private static readonly PRODUCTS = new Set(['motor', 'engine', 'battery', 'filter', 'pump', 'sensor', 'belt', 'brake', 'clutch']);
  private static readonly ISSUES = new Set(['broken', 'not working', 'failed', 'error', 'problem', 'issue', 'damaged', 'worn']);
  private static readonly ACTIONS = new Set(['install', 'replace', 'repair', 'fix', 'troubleshoot', 'maintain', 'upgrade']);

  private static buildReverseSynonyms(): Map<string, string> {
    const reverse = new Map<string, string>();
    QueryEnhancerOptimized.SYNONYM_MAP.forEach((synonyms, key) => {
      synonyms.forEach(syn => reverse.set(syn, key));
    });
    return reverse;
  }

  /**
   * Enhanced query with caching and optimizations
   */
  static async enhance(query: string): Promise<EnhancedQuery> {
    // Check cache first
    const cached = this.queryCache.get(query);
    if (cached) {
      return cached;
    }

    const normalized = this.normalizeQuery(query);
    
    // Parallel processing for independent operations
    const [intent, expandedTerms, synonyms, entities, spellingCorrections] = await Promise.all([
      Promise.resolve(this.detectIntent(query)),
      Promise.resolve(this.expandQuery(normalized)),
      Promise.resolve(this.findSynonyms(normalized)),
      Promise.resolve(this.extractEntities(normalized)),
      Promise.resolve(this.correctSpelling(normalized))
    ]);

    const relatedQueries = this.generateRelatedQueries(normalized, intent);
    const confidence = this.calculateConfidence(normalized, entities);

    const enhanced: EnhancedQuery = {
      original: query,
      normalized,
      intent,
      expanded_terms: expandedTerms,
      synonyms,
      entities,
      spelling_corrections: spellingCorrections,
      related_queries: relatedQueries,
      confidence_score: confidence
    };

    // Cache the result
    this.queryCache.set(query, enhanced);

    return enhanced;
  }

  private static normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(this.COMPILED_PATTERNS.cleanup, ' ')
      .replace(this.COMPILED_PATTERNS.whitespace, ' ')
      .trim();
  }

  private static detectIntent(query: string): QueryIntent {
    const q = query.toLowerCase();
    
    // Fast intent detection with early returns
    if (/^(what|how|why|when|where|who|which)/i.test(q)) return 'informational';
    if (/\b(buy|purchase|order|price|cost|\$|£|€)/i.test(q)) return 'transactional';
    if (/\b(problem|issue|error|broken|fix|repair)/i.test(q)) return 'troubleshooting';
    if (/\b(vs|versus|compare|comparison|better|best)/i.test(q)) return 'comparison';
    if (/\b(contact|support|about|home|login)/i.test(q)) return 'navigational';
    
    return 'informational';
  }

  private static expandQuery(query: string): string[] {
    const words = query.split(' ');
    const expanded = new Set<string>();
    let count = 0;

    for (const word of words) {
      if (count >= this.MAX_EXPANDED_TERMS) break;
      
      expanded.add(word);
      count++;

      // Limited variations
      if (count < this.MAX_EXPANDED_TERMS) {
        if (this.COMPILED_PATTERNS.plural.test(word)) {
          expanded.add(word.slice(0, -1));
          count++;
        } else if (word.length > 3) {
          expanded.add(word + 's');
          count++;
        }
      }

      // Part number variations (limited)
      if (count < this.MAX_EXPANDED_TERMS && this.COMPILED_PATTERNS.alphaNum.test(word)) {
        const match = word.match(this.COMPILED_PATTERNS.alphaNumSplit);
        if (match) {
          expanded.add(`${match[1]}-${match[2]}`);
          count++;
        }
      }
    }

    return Array.from(expanded).slice(0, this.MAX_EXPANDED_TERMS);
  }

  private static findSynonyms(query: string): Map<string, string[]> {
    const synonyms = new Map<string, string[]>();
    const words = query.split(' ');
    let synonymCount = 0;

    for (const word of words) {
      if (synonymCount >= this.MAX_SYNONYMS) break;

      // Check direct match
      const directSyns = this.SYNONYM_MAP.get(word);
      if (directSyns) {
        synonyms.set(word, directSyns.slice(0, 3)); // Limit to 3 synonyms per word
        synonymCount += 3;
        continue;
      }

      // Check reverse lookup (limited)
      const reverseKey = this.REVERSE_SYNONYMS.get(word);
      if (reverseKey && synonymCount < this.MAX_SYNONYMS) {
        const syns = this.SYNONYM_MAP.get(reverseKey);
        if (syns) {
          synonyms.set(word, [reverseKey, ...syns.filter(s => s !== word).slice(0, 2)]);
          synonymCount += 3;
        }
      }
    }

    return synonyms;
  }

  private static extractEntities(query: string): EnhancedQuery['entities'] {
    const entities: EnhancedQuery['entities'] = {
      products: [],
      brands: [],
      skus: [],
      issues: [],
      actions: []
    };

    // SKU extraction (limited to 5)
    const skuMatches = query.match(this.COMPILED_PATTERNS.sku);
    if (skuMatches) {
      entities.skus = skuMatches.slice(0, 5).map(s => s.toUpperCase());
    }

    // Fast entity extraction using Sets
    const words = query.split(' ');
    for (const word of words) {
      const lower = word.toLowerCase();
      
      if (this.BRANDS.has(lower) && entities.brands.length < 3) {
        entities.brands.push(lower.charAt(0).toUpperCase() + lower.slice(1));
      }
      if (this.PRODUCTS.has(lower) && entities.products.length < 5) {
        entities.products.push(lower);
      }
      if (this.ISSUES.has(lower) && entities.issues.length < 3) {
        entities.issues.push(lower);
      }
      if (this.ACTIONS.has(lower) && entities.actions.length < 3) {
        entities.actions.push(lower);
      }
    }

    return entities;
  }

  private static correctSpelling(query: string): Map<string, string> {
    // Simplified spelling correction - could be enhanced with a proper dictionary
    const corrections = new Map<string, string>();
    const commonTypos: Record<string, string> = {
      'moter': 'motor',
      'engin': 'engine',
      'waranty': 'warranty',
      'instalation': 'installation',
      'replacment': 'replacement'
    };

    const words = query.split(' ');
    for (const word of words) {
      if (commonTypos[word]) {
        corrections.set(word, commonTypos[word]);
      }
    }

    return corrections;
  }

  private static generateRelatedQueries(query: string, intent: QueryIntent): string[] {
    const related: string[] = [];
    
    // Limit to 3 related queries
    switch (intent) {
      case 'troubleshooting':
        related.push(`how to fix ${query}`.slice(0, 50));
        break;
      case 'transactional':
        related.push(`${query} price`.slice(0, 50));
        break;
      case 'informational':
        related.push(`${query} guide`.slice(0, 50));
        break;
    }

    return related.slice(0, this.MAX_RELATED_QUERIES);
  }

  private static calculateConfidence(query: string, entities: EnhancedQuery['entities']): number {
    let score = 0.5;
    
    // Simplified scoring
    if (entities.skus.length > 0) score += 0.2;
    if (entities.brands.length > 0) score += 0.1;
    if (entities.products.length > 0) score += 0.1;
    if (query.split(' ').length >= 3) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Clear the query cache
   */
  static clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.queryCache.size,
      hits: 0, // Would need to track this
      misses: 0 // Would need to track this
    };
  }
}