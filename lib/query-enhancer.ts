/**
 * Query Enhancement System
 * Improves search relevance through query understanding, expansion, and intent detection
 */

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

export class QueryEnhancer {
  // Domain-specific synonym mappings
  private static readonly SYNONYM_MAP: Record<string, string[]> = {
    // Automotive/parts domain
    'motor': ['engine', 'drive', 'power unit', 'motor unit'],
    'broken': ['faulty', 'damaged', 'not working', 'defective', 'malfunctioning', 'failed'],
    'install': ['setup', 'mount', 'fit', 'attach', 'installation', 'fitting'],
    'warranty': ['guarantee', 'coverage', 'protection', 'warrantee'],
    'replace': ['replacement', 'substitute', 'swap', 'change'],
    'part': ['component', 'spare', 'piece', 'item'],
    'manual': ['guide', 'instructions', 'documentation', 'handbook'],
    'fix': ['repair', 'mend', 'resolve', 'troubleshoot'],
    
    // E-commerce terms
    'cheap': ['affordable', 'budget', 'economical', 'inexpensive', 'low cost'],
    'expensive': ['premium', 'high-end', 'costly', 'luxury'],
    'buy': ['purchase', 'order', 'get', 'acquire'],
    'price': ['cost', 'pricing', 'rate', 'fee'],
    'ship': ['shipping', 'delivery', 'dispatch', 'send'],
    'return': ['refund', 'exchange', 'send back', 'RMA'],
    
    // Technical terms
    'volt': ['voltage', 'V', 'volts'],
    'amp': ['ampere', 'amperage', 'A', 'amps', 'current'],
    'watt': ['watts', 'W', 'power', 'wattage'],
    'RPM': ['revolutions', 'speed', 'rotation'],
    'HP': ['horsepower', 'horse power', 'bhp'],
    
    // Common misspellings and variations
    'catalogue': ['catalog'],
    'colour': ['color'],
    'tyre': ['tire'],
    'aluminium': ['aluminum']
  };

  // Intent detection patterns
  private static readonly INTENT_PATTERNS = {
    informational: [
      /^(what|how|why|when|where|who|which)/i,
      /\b(guide|tutorial|manual|instructions|documentation)\b/i,
      /\b(information|info|details|specs|specifications)\b/i
    ],
    transactional: [
      /\b(buy|purchase|order|price|cost|cheap|expensive|deal|discount|sale)\b/i,
      /\b(cart|checkout|payment|shipping|delivery)\b/i,
      /\$\d+|\£\d+|€\d+/
    ],
    navigational: [
      /\b(contact|support|about|home|login|account|profile)\b/i,
      /\b(page|site|website|portal)\b/i
    ],
    troubleshooting: [
      /\b(problem|issue|error|broken|not working|fix|repair|troubleshoot)\b/i,
      /\b(won't|can't|unable|failed|failure)\b/i,
      /\b(help|support|assist)\b/i
    ],
    comparison: [
      /\b(vs|versus|compare|comparison|difference|better|best)\b/i,
      /\b(alternative|instead|similar|like)\b/i
    ]
  };

  // Common typos and corrections
  private static readonly SPELLING_CORRECTIONS: Record<string, string> = {
    'moter': 'motor',
    'engin': 'engine',
    'waranty': 'warranty',
    'instalation': 'installation',
    'replacment': 'replacement',
    'maintainance': 'maintenance',
    'recieve': 'receive',
    'guage': 'gauge',
    'cataloge': 'catalogue',
    'seperate': 'separate'
  };

  /**
   * Enhance a search query with expansion, synonyms, and understanding
   */
  static async enhance(query: string): Promise<EnhancedQuery> {
    const normalized = this.normalizeQuery(query);
    const intent = this.detectIntent(query);
    const expandedTerms = this.expandQuery(normalized);
    const synonyms = this.findSynonyms(normalized);
    const entities = this.extractEntities(normalized);
    const spellingCorrections = this.correctSpelling(normalized);
    const relatedQueries = this.generateRelatedQueries(normalized, intent);
    const confidence = this.calculateConfidence(normalized, entities);

    return {
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
  }

  /**
   * Normalize query for processing
   */
  private static normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s\-\$£€]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Detect user intent from query
   */
  private static detectIntent(query: string): QueryIntent {
    const scores: Record<QueryIntent, number> = {
      informational: 0,
      transactional: 0,
      navigational: 0,
      troubleshooting: 0,
      comparison: 0
    };

    // Check each pattern and score
    for (const [intent, patterns] of Object.entries(this.INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          scores[intent as QueryIntent] += 1;
        }
      }
    }

    // Return intent with highest score, default to informational
    let maxIntent: QueryIntent = 'informational';
    let maxScore = 0;
    
    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxIntent = intent as QueryIntent;
      }
    }

    return maxIntent;
  }

  /**
   * Expand query with related terms
   */
  private static expandQuery(query: string): string[] {
    const words = query.split(' ');
    const expanded = new Set<string>();

    for (const word of words) {
      // Add original word
      expanded.add(word);

      // Add common variations
      if (word.endsWith('s')) {
        expanded.add(word.slice(0, -1)); // Remove plural
      } else {
        expanded.add(word + 's'); // Add plural
      }

      // Add hyphenated variations for part numbers
      if (/^[a-z]+\d+$/i.test(word)) {
        // Add hyphen between letters and numbers
        const match = word.match(/^([a-z]+)(\d+)$/i);
        if (match) {
          expanded.add(`${match[1]}-${match[2]}`);
        }
      }

      // Add common prefixes/suffixes
      if (word.length > 4) {
        expanded.add('re' + word); // repair, replace, etc.
        expanded.add(word + 'ing'); // installing, working, etc.
        expanded.add(word + 'ed'); // installed, worked, etc.
      }
    }

    return Array.from(expanded);
  }

  /**
   * Find synonyms for query terms
   */
  private static findSynonyms(query: string): Map<string, string[]> {
    const synonyms = new Map<string, string[]>();
    const words = query.split(' ');

    for (const word of words) {
      // Check direct match
      if (this.SYNONYM_MAP[word]) {
        synonyms.set(word, this.SYNONYM_MAP[word]);
      }

      // Check if word is a synonym of something else
      for (const [key, syns] of Object.entries(this.SYNONYM_MAP)) {
        if (syns.includes(word)) {
          synonyms.set(word, [key, ...syns.filter(s => s !== word)]);
        }
      }
    }

    return synonyms;
  }

  /**
   * Extract entities from query
   */
  private static extractEntities(query: string): EnhancedQuery['entities'] {
    const entities: EnhancedQuery['entities'] = {
      products: [],
      brands: [],
      skus: [],
      issues: [],
      actions: []
    };

    // SKU patterns
    const skuPattern = /\b([A-Z]{2,}[\-\/]?[\d]{2,}[\w\-]*)\b/gi;
    const skuMatches = query.match(skuPattern);
    if (skuMatches) {
      entities.skus = skuMatches.map(s => s.toUpperCase());
    }

    // Common automotive brands
    const brands = ['bosch', 'makita', 'dewalt', 'milwaukee', 'ryobi', 'ford', 'toyota', 'honda', 'bmw', 'mercedes'];
    for (const brand of brands) {
      if (query.includes(brand)) {
        entities.brands.push(brand.charAt(0).toUpperCase() + brand.slice(1));
      }
    }

    // Product types
    const products = ['motor', 'engine', 'battery', 'filter', 'pump', 'sensor', 'belt', 'brake', 'clutch'];
    for (const product of products) {
      if (query.includes(product)) {
        entities.products.push(product);
      }
    }

    // Common issues
    const issues = ['broken', 'not working', 'failed', 'error', 'problem', 'issue', 'damaged', 'worn'];
    for (const issue of issues) {
      if (query.includes(issue)) {
        entities.issues.push(issue);
      }
    }

    // Actions
    const actions = ['install', 'replace', 'repair', 'fix', 'troubleshoot', 'maintain', 'upgrade'];
    for (const action of actions) {
      if (query.includes(action)) {
        entities.actions.push(action);
      }
    }

    return entities;
  }

  /**
   * Correct common spelling mistakes
   */
  private static correctSpelling(query: string): Map<string, string> {
    const corrections = new Map<string, string>();
    const words = query.split(' ');

    for (const word of words) {
      // Check exact match
      if (this.SPELLING_CORRECTIONS[word]) {
        corrections.set(word, this.SPELLING_CORRECTIONS[word]);
      }

      // Check for common patterns
      // Double letters that should be single
      const doubleLetterFixed = word.replace(/([^aeiou])\1{2,}/g, '$1$1');
      if (doubleLetterFixed !== word && this.SPELLING_CORRECTIONS[doubleLetterFixed]) {
        corrections.set(word, this.SPELLING_CORRECTIONS[doubleLetterFixed]);
      }
    }

    return corrections;
  }

  /**
   * Generate related queries
   */
  private static generateRelatedQueries(query: string, intent: QueryIntent): string[] {
    const related: string[] = [];

    switch (intent) {
      case 'troubleshooting':
        related.push(`how to fix ${query}`);
        related.push(`${query} troubleshooting guide`);
        related.push(`common ${query} problems`);
        break;
      
      case 'transactional':
        related.push(`buy ${query}`);
        related.push(`${query} price`);
        related.push(`${query} in stock`);
        break;
      
      case 'informational':
        related.push(`${query} guide`);
        related.push(`${query} specifications`);
        related.push(`${query} manual`);
        break;
      
      case 'comparison':
        related.push(`${query} alternatives`);
        related.push(`best ${query}`);
        related.push(`${query} reviews`);
        break;
    }

    return related;
  }

  /**
   * Calculate confidence score for the query understanding
   */
  private static calculateConfidence(query: string, entities: EnhancedQuery['entities']): number {
    let score = 0.5; // Base score

    // Boost for recognized entities
    if (entities.skus.length > 0) score += 0.2;
    if (entities.brands.length > 0) score += 0.1;
    if (entities.products.length > 0) score += 0.1;

    // Boost for clear intent
    const words = query.split(' ');
    if (words.length >= 3) score += 0.1; // More context

    return Math.min(score, 1.0);
  }

  /**
   * Apply query enhancement to search
   */
  static applyToSearch(enhanced: EnhancedQuery): {
    searchTerms: string[];
    boostFields: Record<string, number>;
    filters: Record<string, any>;
  } {
    const searchTerms = [
      enhanced.normalized,
      ...enhanced.expanded_terms.slice(0, 5),
      ...Array.from(enhanced.synonyms.values()).flat().slice(0, 5)
    ];

    const boostFields: Record<string, number> = {
      exact_match: 2.0,
      sku_match: enhanced.entities.skus.length > 0 ? 1.8 : 1.0,
      title_match: 1.5,
      content_match: 1.0
    };

    const filters: Record<string, any> = {};
    
    // Add intent-based filters
    switch (enhanced.intent) {
      case 'transactional':
        filters.content_types = ['product'];
        filters.availability = ['in_stock'];
        break;
      case 'troubleshooting':
        filters.content_types = ['faq', 'documentation', 'support'];
        break;
      case 'informational':
        filters.content_types = ['documentation', 'blog', 'general'];
        break;
    }

    return { searchTerms, boostFields, filters };
  }
}