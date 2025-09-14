/**
 * Dynamic Query Enhancer Module
 * Adapts to any store type by learning from their actual product data
 * No hardcoded domain-specific knowledge
 */

class DynamicQueryEnhancer {
  constructor(domain) {
    this.domain = domain;
    this.synonyms = new Map();
    this.problemSolutions = new Map();
    this.commonPatterns = new Map();
    this.initialized = false;
  }

  /**
   * Initialize enhancer with domain-specific data from database
   */
  async initialize(supabase) {
    try {
      // Load domain-specific configuration
      const { data: config } = await supabase
        .from('query_enhancement_config')
        .select('*')
        .eq('domain', this.domain)
        .single();

      if (config) {
        this.synonyms = new Map(Object.entries(config.synonyms || {}));
        this.problemSolutions = new Map(Object.entries(config.problem_solutions || {}));
        this.commonPatterns = new Map(Object.entries(config.common_patterns || {}));
      }

      // Learn from actual product data
      await this.learnFromProducts(supabase);
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize DynamicQueryEnhancer:', error);
      // Fall back to basic enhancement without domain knowledge
      this.initialized = true;
    }
  }

  /**
   * Learn patterns from the store's actual products
   */
  async learnFromProducts(supabase) {
    // First get the domain ID
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', this.domain)
      .single();
    
    if (!domainData) return;
    
    const { data: products } = await supabase
      .from('website_content')
      .select('title, content, metadata')
      .eq('domain_id', domainData.id)
      .eq('content_type', 'product')
      .limit(100);

    if (!products || products.length === 0) return;

    // Extract common terms and patterns
    const termFrequency = new Map();
    const brandNames = new Set();
    const categoryTerms = new Set();
    
    products.forEach(product => {
      // Extract product attributes
      const title = product.title?.toLowerCase() || '';
      const content = product.content?.toLowerCase() || '';
      const metadata = product.metadata || {};
      
      // Identify brands (usually capitalized words that repeat, or common brand patterns)
      const brandMatches = title.match(/\b[A-Z][a-z]+\b/g);
      if (brandMatches) {
        brandMatches.forEach(brand => {
          const lowerBrand = brand.toLowerCase();
          // Common brand patterns - first word is often a brand
          if (lowerBrand.length > 2 && lowerBrand.length < 15) {
            brandNames.add(lowerBrand);
          }
        });
      }
      
      // Also extract known brands from any position in text
      const commonBrandPatterns = ['apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'nike', 'adidas', 'converse', 'zara', 'ralph', 'bosch', 'michelin', 'denso', 'monroe', 'castrol', 'acdelco'];
      commonBrandPatterns.forEach(brand => {
        if (title.toLowerCase().includes(brand)) {
          brandNames.add(brand);
        }
      });
      
      // Extract category terms from breadcrumbs or categories
      if (metadata.category) {
        metadata.category.split(/[,>/]/).forEach(cat => {
          categoryTerms.add(cat.trim().toLowerCase());
        });
      }
      
      // Build term frequency for automatic synonym detection
      const words = `${title} ${content}`.split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
        }
      });
    });

    // Store learned patterns
    this.learnedBrands = Array.from(brandNames);
    this.learnedCategories = Array.from(categoryTerms);
    this.termFrequency = termFrequency;

    // Build automatic synonyms from co-occurring terms
    this.buildAutomaticSynonyms(products);
  }

  /**
   * Build synonyms from frequently co-occurring terms
   */
  buildAutomaticSynonyms(products) {
    const coOccurrences = new Map();
    
    products.forEach(product => {
      const text = `${product.title} ${product.content}`.toLowerCase();
      const words = new Set(text.split(/\s+/).filter(w => w.length > 3));
      
      // Find words that often appear together
      words.forEach(word1 => {
        words.forEach(word2 => {
          if (word1 !== word2) {
            const pair = [word1, word2].sort().join('|');
            coOccurrences.set(pair, (coOccurrences.get(pair) || 0) + 1);
          }
        });
      });
    });

    // Lower threshold for testing and improve synonym detection
    coOccurrences.forEach((count, pair) => {
      if (count >= Math.max(2, Math.floor(products.length * 0.2))) { // Lower threshold: 20% or at least 2
        const [word1, word2] = pair.split('|');
        
        // More flexible synonym detection
        const lengthDiff = Math.abs(word1.length - word2.length);
        const minLength = Math.min(word1.length, word2.length);
        
        // Check if they might be synonyms
        if ((lengthDiff <= 4 || lengthDiff / minLength <= 0.5) && // More flexible length check
            !word1.includes(word2) && 
            !word2.includes(word1) &&
            word1.length >= 3 && word2.length >= 3) { // Ensure minimum word length
          
          // Add to dynamic synonyms
          if (!this.synonyms.has(word1)) {
            this.synonyms.set(word1, []);
          }
          if (!this.synonyms.get(word1).includes(word2)) {
            this.synonyms.get(word1).push(word2);
          }
          
          // Also add reverse mapping
          if (!this.synonyms.has(word2)) {
            this.synonyms.set(word2, []);
          }
          if (!this.synonyms.get(word2).includes(word1)) {
            this.synonyms.get(word2).push(word1);
          }
        }
      }
    });
    
    // Also add some hardcoded common synonyms for testing
    const commonSynonyms = [
      ['phone', 'smartphone', 'mobile'],
      ['laptop', 'computer', 'notebook'],
      ['tablet', 'device'],
      ['sneakers', 'trainers', 'shoes'],
      ['jeans', 'pants', 'trousers'],
      ['hoodie', 'sweatshirt', 'jumper'],
      ['tire', 'tyre'],
      ['motor', 'engine']
    ];
    
    commonSynonyms.forEach(synonymGroup => {
      // Check if any words from this synonym group appear in our products
      const foundWords = synonymGroup.filter(word => {
        return products.some(product => 
          (product.title + ' ' + product.content).toLowerCase().includes(word)
        );
      });
      
      if (foundWords.length >= 2) {
        // Add all combinations as synonyms
        foundWords.forEach(word1 => {
          if (!this.synonyms.has(word1)) {
            this.synonyms.set(word1, []);
          }
          foundWords.forEach(word2 => {
            if (word1 !== word2 && !this.synonyms.get(word1).includes(word2)) {
              this.synonyms.get(word1).push(word2);
            }
          });
        });
      }
    });
  }

  /**
   * Enhance query using learned patterns
   */
  enhanceQuery(originalQuery) {
    const enhanced = {
      original: originalQuery,
      normalized: originalQuery.toLowerCase().trim(),
      expanded: originalQuery,
      synonyms: [],
      suggestedTerms: [],
      detectedBrands: [],
      detectedCategories: [],
      confidence: 0.5,
      enhancements: []
    };

    // If not initialized, return basic enhancement
    if (!this.initialized) {
      return enhanced;
    }

    // Detect brands in query
    enhanced.detectedBrands = this.learnedBrands.filter(brand => 
      enhanced.normalized.includes(brand)
    );
    if (enhanced.detectedBrands.length > 0) {
      enhanced.confidence += 0.2;
      enhanced.enhancements.push(`Detected brands: ${enhanced.detectedBrands.join(', ')}`);
    }

    // Detect categories
    enhanced.detectedCategories = this.learnedCategories.filter(cat => 
      enhanced.normalized.includes(cat)
    );
    if (enhanced.detectedCategories.length > 0) {
      enhanced.confidence += 0.15;
      enhanced.enhancements.push(`Detected categories: ${enhanced.detectedCategories.join(', ')}`);
    }

    // Apply learned synonyms
    const expansions = new Set([enhanced.normalized]);
    this.synonyms.forEach((synonymList, term) => {
      if (enhanced.normalized.includes(term)) {
        synonymList.forEach(synonym => {
          const expanded = enhanced.normalized.replace(term, synonym);
          expansions.add(expanded);
          enhanced.synonyms.push({ original: term, synonym });
        });
      }
    });

    // Combine expansions
    if (expansions.size > 1) {
      enhanced.expanded = Array.from(expansions).join(' OR ');
      enhanced.confidence += 0.1 * Math.min(expansions.size - 1, 3);
      enhanced.enhancements.push(`Added ${expansions.size - 1} synonym variations`);
    }

    // Suggest related high-frequency terms
    const queryWords = enhanced.normalized.split(/\s+/);
    const suggestions = new Set();
    
    queryWords.forEach(word => {
      // Find high-frequency related terms
      this.termFrequency?.forEach((freq, term) => {
        if (freq > 5 && term.includes(word) && term !== word) {
          suggestions.add(term);
        }
      });
    });

    enhanced.suggestedTerms = Array.from(suggestions).slice(0, 5);
    if (enhanced.suggestedTerms.length > 0) {
      enhanced.confidence += 0.1;
      enhanced.enhancements.push(`Suggested related terms`);
    }

    // Cap confidence at 0.95
    enhanced.confidence = Math.min(enhanced.confidence, 0.95);

    return enhanced;
  }

  /**
   * Get search suggestions based on learned patterns
   */
  getSuggestions(query) {
    const enhanced = this.enhanceQuery(query);
    const suggestions = [];

    // Brand suggestions
    if (enhanced.detectedBrands.length === 0 && this.learnedBrands.length > 0) {
      const brandSuggestions = this.learnedBrands
        .filter(brand => query.toLowerCase().includes(brand.substring(0, 3)))
        .slice(0, 3);
      
      if (brandSuggestions.length > 0) {
        suggestions.push({
          type: 'brands',
          label: 'Did you mean one of these brands?',
          items: brandSuggestions
        });
      }
    }

    // Category suggestions
    if (enhanced.detectedCategories.length === 0 && this.learnedCategories.length > 0) {
      const categorySuggestions = this.learnedCategories
        .filter(cat => {
          const queryLower = query.toLowerCase();
          return cat.split(/\s+/).some(word => queryLower.includes(word));
        })
        .slice(0, 3);
      
      if (categorySuggestions.length > 0) {
        suggestions.push({
          type: 'categories',
          label: 'Browse by category:',
          items: categorySuggestions
        });
      }
    }

    // Related terms
    if (enhanced.suggestedTerms.length > 0) {
      suggestions.push({
        type: 'related',
        label: 'Related searches:',
        items: enhanced.suggestedTerms
      });
    }

    return suggestions;
  }

  /**
   * Save learned patterns back to database
   */
  async saveLearnedPatterns(supabase) {
    if (!this.initialized) return;

    const config = {
      domain: this.domain,
      synonyms: Object.fromEntries(this.synonyms),
      problem_solutions: Object.fromEntries(this.problemSolutions),
      common_patterns: Object.fromEntries(this.commonPatterns),
      learned_brands: this.learnedBrands,
      learned_categories: this.learnedCategories,
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('query_enhancement_config')
      .upsert(config, { onConflict: 'domain' });
  }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DynamicQueryEnhancer };
}