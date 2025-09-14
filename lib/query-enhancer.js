/**
 * Generic Query Enhancer Module
 * Domain-agnostic query enhancement that learns from actual data
 * NO HARDCODED DOMAIN-SPECIFIC KNOWLEDGE
 */

class GenericQueryEnhancer {
  constructor() {
    // No hardcoded synonyms or mappings
    this.domainCache = new Map();
  }

  /**
   * Enhance query using learned patterns from the specific domain
   */
  async enhanceQuery(originalQuery, domain, supabase) {
    const enhanced = {
      original: originalQuery,
      normalized: originalQuery.toLowerCase().trim(),
      expanded: originalQuery,
      synonyms: [],
      suggestedTerms: [],
      confidence: 0.5,
      enhancements: []
    };

    if (!domain || !supabase) {
      // Return basic enhancement without domain knowledge
      return enhanced;
    }

    try {
      // Get domain-specific patterns from database
      const domainPatterns = await this.getDomainPatterns(domain, supabase);
      
      if (domainPatterns) {
        // Apply learned synonyms
        enhanced.synonyms = await this.applyLearnedSynonyms(
          enhanced.normalized, 
          domainPatterns.synonyms
        );
        
        // Apply learned patterns
        enhanced.suggestedTerms = await this.applyLearnedPatterns(
          enhanced.normalized,
          domainPatterns.patterns
        );
        
        // Build expanded query
        if (enhanced.synonyms.length > 0) {
          const expansions = [enhanced.normalized];
          enhanced.synonyms.forEach(syn => {
            expansions.push(syn.expansion);
          });
          enhanced.expanded = expansions.join(' OR ');
          enhanced.confidence += 0.2;
          enhanced.enhancements.push(`Applied ${enhanced.synonyms.length} learned variations`);
        }
        
        if (enhanced.suggestedTerms.length > 0) {
          enhanced.confidence += 0.15;
          enhanced.enhancements.push(`Found ${enhanced.suggestedTerms.length} related terms`);
        }
      }
    } catch (error) {
      console.error('Error enhancing query:', error);
    }

    // Cap confidence
    enhanced.confidence = Math.min(enhanced.confidence, 0.95);
    
    return enhanced;
  }

  /**
   * Get domain-specific patterns from database
   */
  async getDomainPatterns(domain, supabase) {
    // Check cache first
    if (this.domainCache.has(domain)) {
      const cached = this.domainCache.get(domain);
      if (cached.timestamp > Date.now() - 3600000) { // 1 hour cache
        return cached.data;
      }
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('query_enhancement_config')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error || !data) {
      // No configuration found - learn from products
      return await this.learnFromProducts(domain, supabase);
    }

    // Cache the result
    this.domainCache.set(domain, {
      data: data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * Learn patterns from actual product data
   */
  async learnFromProducts(domain, supabase) {
    const { data: products } = await supabase
      .from('scraped_pages')
      .select('title, content, metadata')
      .eq('domain', domain)
      .eq('type', 'product')
      .limit(50);

    if (!products || products.length === 0) {
      return null;
    }

    const patterns = {
      synonyms: {},
      patterns: {},
      termFrequency: {}
    };

    // Analyze products to find patterns
    const termFrequency = new Map();
    const coOccurrence = new Map();
    
    products.forEach(product => {
      const text = `${product.title || ''} ${product.content || ''}`.toLowerCase();
      const words = text.split(/\s+/).filter(w => w.length > 2);
      
      // Count term frequency
      words.forEach(word => {
        termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
      });
      
      // Track co-occurrences for synonym detection
      const uniqueWords = [...new Set(words)];
      for (let i = 0; i < uniqueWords.length; i++) {
        for (let j = i + 1; j < uniqueWords.length; j++) {
          const pair = [uniqueWords[i], uniqueWords[j]].sort().join('|');
          coOccurrence.set(pair, (coOccurrence.get(pair) || 0) + 1);
        }
      }
    });

    // Identify potential synonyms from co-occurrence
    coOccurrence.forEach((count, pair) => {
      if (count > products.length * 0.4) { // Appears together in 40%+ of products
        const [word1, word2] = pair.split('|');
        
        // Simple heuristic: similar length words that co-occur often might be related
        if (Math.abs(word1.length - word2.length) < 4) {
          if (!patterns.synonyms[word1]) {
            patterns.synonyms[word1] = [];
          }
          patterns.synonyms[word1].push(word2);
        }
      }
    });

    // Store high-frequency terms
    termFrequency.forEach((count, term) => {
      if (count > products.length * 0.2) { // Appears in 20%+ of products
        patterns.termFrequency[term] = count;
      }
    });

    // Save learned patterns
    await this.savePatterns(domain, patterns, supabase);
    
    return patterns;
  }

  /**
   * Apply learned synonyms to query
   */
  async applyLearnedSynonyms(query, synonyms) {
    if (!synonyms) return [];
    
    const applied = [];
    const words = query.split(/\s+/);
    
    words.forEach(word => {
      if (synonyms[word]) {
        synonyms[word].forEach(synonym => {
          applied.push({
            original: word,
            synonym: synonym,
            expansion: query.replace(word, synonym)
          });
        });
      }
    });
    
    return applied;
  }

  /**
   * Apply learned patterns to find related terms
   */
  async applyLearnedPatterns(query, patterns) {
    if (!patterns || !patterns.termFrequency) return [];
    
    const queryWords = query.split(/\s+/);
    const suggestions = new Set();
    
    // Find related high-frequency terms
    Object.keys(patterns.termFrequency).forEach(term => {
      queryWords.forEach(word => {
        // Simple relevance: terms that share substrings
        if (term.includes(word) || word.includes(term)) {
          if (term !== word) {
            suggestions.add(term);
          }
        }
      });
    });
    
    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Save learned patterns to database
   */
  async savePatterns(domain, patterns, supabase) {
    const config = {
      domain: domain,
      synonyms: patterns.synonyms || {},
      common_patterns: patterns.patterns || {},
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('query_enhancement_config')
      .upsert(config, { onConflict: 'domain' });
  }

  /**
   * Get suggestions without domain-specific knowledge
   */
  getSuggestions(query) {
    // Generic suggestions based on query structure only
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Suggest adding more context if query is too short
    if (query.split(/\s+/).length < 3) {
      suggestions.push({
        type: 'tip',
        label: 'Try adding more details:',
        items: ['Include brand name', 'Add product type', 'Specify your need']
      });
    }
    
    // Suggest quotes for exact matches
    if (!query.includes('"') && query.includes(' ')) {
      suggestions.push({
        type: 'tip', 
        label: 'For exact matches:',
        items: [`"${query}"`]
      });
    }
    
    return suggestions;
  }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QueryEnhancer: GenericQueryEnhancer };
}