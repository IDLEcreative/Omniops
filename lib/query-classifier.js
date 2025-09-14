/**
 * Generic Query Classifier Module
 * Domain-agnostic query intent detection and routing
 * NO HARDCODED DOMAIN-SPECIFIC KNOWLEDGE
 */

class GenericQueryClassifier {
  /**
   * Main classification method
   * Analyzes query and returns intent information
   */
  static async classifyQuery(query, domain, supabase) {
    const normalized = query.toLowerCase().trim();
    
    // Get domain configuration if available
    let domainConfig = null;
    if (domain && supabase) {
      try {
        const { data } = await supabase
          .from('query_enhancement_config')
          .select('learned_brands, learned_categories')
          .eq('domain', domain)
          .single();
        domainConfig = data;
      } catch (e) {
        // No domain config available
      }
    }
    
    const classification = {
      originalQuery: query,
      normalizedQuery: normalized,
      
      // Query characteristics (domain-agnostic)
      type: this.detectQueryType(normalized),
      
      // Pattern detections
      sku: this.detectSKU(query),
      brand: domainConfig ? this.detectLearnedBrand(normalized, domainConfig.learned_brands) : null,
      priceIntent: this.detectPriceIntent(normalized),
      availabilityIntent: this.detectAvailabilityIntent(normalized),
      
      // Query structure analysis
      isNaturalLanguage: this.isNaturalLanguage(normalized),
      hasComparison: this.hasComparison(normalized),
      hasQuestion: this.hasQuestion(normalized),
      
      // Extracted features
      entities: this.extractEntities(query),
      
      // Routing recommendation
      route: null,
      
      // Confidence score
      confidence: 0
    };
    
    // Determine routing strategy
    classification.route = this.determineRouting(classification);
    
    // Calculate confidence
    classification.confidence = this.calculateConfidence(classification);
    
    return classification;
  }
  
  /**
   * Detect query type based on structure, not content
   */
  static detectQueryType(query) {
    // Check for support/help queries
    if (/^(how|why|what|when|where|can|should|is|does)/i.test(query)) {
      return 'question';
    }
    
    // Check for SKU/part number patterns
    if (this.detectSKU(query)) {
      return 'sku_lookup';
    }
    
    // Check for price queries
    if (this.detectPriceIntent(query)) {
      return 'price_query';
    }
    
    // Check for navigation
    if (/^(show|list|browse|view|find)/i.test(query)) {
      return 'browse';
    }
    
    // Default to search
    return 'search';
  }
  
  /**
   * Detect SKU/part number patterns (domain-agnostic)
   */
  static detectSKU(query) {
    // Common SKU patterns across all domains
    const skuPatterns = [
      // Pattern: SKU/part/model/item followed by identifier - capture the identifier
      /\b(?:SKU|sku|part|model|item)\s+(?:number\s+)?([A-Z0-9][-A-Z0-9]*)/i,
      
      // Pattern: Letter-Number combinations (WP1234, AB123-XY)
      /\b[A-Z]{2,4}[-]?\d{3,}(?:[-][A-Z0-9]+)?\b/i,
      
      // Pattern: Mixed alphanumeric 6+ chars (ABC123XY, SM-G991B)
      /\b[A-Z0-9]{2,}[-][A-Z0-9]{2,}\b/i,
      
      // Pattern: Long alphanumeric sequences (A1B2C3D4E5F6)
      /\b[A-Z0-9]{8,}\b/i,
      
      // Pattern: Single letter + 2+ digits + optional chars (A12B34, V12)
      /\b[A-Z]\d{2,}[A-Z0-9]*\b/i,
      
      // Pattern: Hyphenated number sequences (12-34-567)
      /\b\d+-\d+-\d+\b/,
      
      // Pattern: Pure numeric 5+ digits (but exclude common non-SKU patterns)
      /\b\d{5,}\b/
    ];
    
    for (const pattern of skuPatterns) {
      const match = query.match(pattern);
      if (match) {
        // For patterns with capture groups, return the captured SKU
        if (match[1]) {
          return match[1];
        }
        
        // Skip patterns that look like years, versions, or common numbers
        const candidate = match[0];
        
        // Skip if it looks like a year
        if (/^\d{4}$/.test(candidate) && parseInt(candidate) >= 1900 && parseInt(candidate) <= 2030) {
          continue;
        }
        
        // Skip if it looks like a version number starting with V
        if (/^V\d+(\.\d+)*$/i.test(candidate)) {
          continue;
        }
        
        return candidate;
      }
    }
    
    return null;
  }
  
  /**
   * Detect brand from learned patterns
   */
  static detectLearnedBrand(query, learnedBrands) {
    if (!learnedBrands || learnedBrands.length === 0) return null;
    
    for (const brand of learnedBrands) {
      if (query.includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    return null;
  }
  
  /**
   * Detect price intent (universal across domains)
   */
  static detectPriceIntent(query) {
    const pricePatterns = [
      /[\$€£]\d+/,                               // $50, €100, £75
      /\d+\s*(dollar|usd|eur|euro|gbp|pound)/i, // 50 dollars, 100 euros
      /(price|cost|cheap|expensive|budget|affordable)/i,
      /(under|below|above|over|less than|more than)\s*[\$€£]?\d+/i,
      /(discount|sale|deal|clearance|bargain)/i
    ];
    
    return pricePatterns.some(pattern => pattern.test(query));
  }
  
  /**
   * Detect availability intent
   */
  static detectAvailabilityIntent(query) {
    const availabilityPatterns = [
      /in\s+stock/i,
      /available|availability/i,
      /out\s+of\s+stock/i,
      /ship|shipping|delivery/i,
      /ready\s+to/i,
      /backorder|discontinued/i
    ];
    
    return availabilityPatterns.some(pattern => pattern.test(query));
  }
  
  /**
   * Check if query is natural language
   */
  static isNaturalLanguage(query) {
    // Has multiple words and reads like a sentence
    const words = query.split(/\s+/);
    if (words.length < 4) return false; // Require at least 4 words for natural language
    
    // Contains common natural language markers
    const naturalPatterns = [
      /\b(I|my|our|the|this|that|these|those)\b/i,
      /\b(is|are|was|were|been|being)\b/i,
      /\b(have|has|had|having)\b/i,
      /\b(will|would|could|should|might|can)\b/i,
      /\b(not|n't|with|for|from|about)\b/i,
      /\b(help|find|looking|need|want)\b/i
    ];
    
    const matchCount = naturalPatterns.filter(p => p.test(query)).length;
    return matchCount >= 2;
  }
  
  /**
   * Detect comparison intent
   */
  static hasComparison(query) {
    const comparisonPatterns = [
      /\b(vs|versus|compare|comparison|difference|between)\b/i,
      /\b(better|worse|best|worst)\b/i,
      /\b(cheaper|more expensive|faster|slower)\b/i,
      /\b(or|alternative|instead|rather)\b/i
    ];
    
    return comparisonPatterns.some(pattern => pattern.test(query));
  }
  
  /**
   * Check if query is a question
   */
  static hasQuestion(query) {
    return /\?$/.test(query) || /^(what|how|why|when|where|who|which|can|should|is|does|do|will)/i.test(query);
  }
  
  /**
   * Extract entities from query (generic)
   */
  static extractEntities(query) {
    const entities = {
      numbers: [],
      urls: [],
      emails: [],
      quoted: []
    };
    
    // Extract numbers
    const numbers = query.match(/\b\d+(\.\d+)?\b/g);
    if (numbers) entities.numbers = numbers;
    
    // Extract URLs
    const urls = query.match(/https?:\/\/[^\s]+/gi);
    if (urls) entities.urls = urls;
    
    // Extract emails
    const emails = query.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi);
    if (emails) entities.emails = emails;
    
    // Extract quoted strings
    const quoted = query.match(/"[^"]+"/g);
    if (quoted) entities.quoted = quoted.map(q => q.replace(/"/g, ''));
    
    return entities;
  }
  
  /**
   * Determine routing strategy
   */
  static determineRouting(classification) {
    // SKU lookup - direct SQL
    if (classification.sku) {
      return 'sql_direct';
    }
    
    // Price or availability queries - SQL with filters
    if (classification.priceIntent || classification.availabilityIntent) {
      return 'sql_filtered';
    }
    
    // Questions - knowledge base
    if (classification.type === 'question') {
      return 'knowledge_base';
    }
    
    // Natural language - semantic search
    if (classification.isNaturalLanguage) {
      return 'semantic_search';
    }
    
    // Default to hybrid search
    return 'hybrid_search';
  }
  
  /**
   * Calculate confidence score
   */
  static calculateConfidence(classification) {
    let confidence = 0.5;
    
    // Strong signals
    if (classification.sku) confidence += 0.3;
    if (classification.entities.quoted.length > 0) confidence += 0.2;
    
    // Medium signals
    if (classification.brand) confidence += 0.15;
    if (classification.priceIntent) confidence += 0.15;
    if (classification.availabilityIntent) confidence += 0.15;
    
    // Weak signals
    if (classification.entities.numbers.length > 0) confidence += 0.1;
    if (classification.isNaturalLanguage) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }
  
  /**
   * Get intent summary
   */
  static getIntentSummary(classification) {
    const intents = [];
    
    if (classification.sku) intents.push('SKU lookup');
    if (classification.brand) intents.push('Brand search');
    if (classification.priceIntent) intents.push('Price inquiry');
    if (classification.availabilityIntent) intents.push('Stock check');
    if (classification.hasComparison) intents.push('Comparison');
    if (classification.hasQuestion) intents.push('Question');
    
    return intents.length > 0 ? intents : ['General search'];
  }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QueryClassifier: GenericQueryClassifier };
}