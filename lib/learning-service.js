/**
 * Learning Service
 * Builds domain knowledge during data ingestion, not during queries
 */

class LearningService {
  constructor(domain, supabase) {
    this.domain = domain;
    this.supabase = supabase;
    this.batchSize = 50;
    this.minConfidence = 0.3;
  }

  /**
   * Called during scraping/ingestion to learn from new products
   * This runs BEFORE users start querying
   */
  async learnFromNewProducts(products) {
    console.log(`[Learning] Processing ${products.length} products for domain: ${this.domain}`);
    
    const startTime = Date.now();
    const learningData = {
      brands: new Set(),
      categories: new Set(),
      synonyms: new Map(),
      termFrequency: new Map(),
      coOccurrence: new Map()
    };

    // Process all products
    for (const product of products) {
      this.analyzeProduct(product, learningData);
    }

    // Build synonym relationships
    const synonyms = this.buildSynonyms(learningData.coOccurrence, products.length);
    
    // Prepare configuration
    const config = {
      domain: this.domain,
      synonyms: Object.fromEntries(synonyms),
      learned_brands: Array.from(learningData.brands),
      learned_categories: Array.from(learningData.categories),
      common_patterns: this.extractPatterns(learningData.termFrequency),
      total_products_analyzed: products.length,
      last_learning_run: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to database
    await this.saveConfiguration(config);
    
    const duration = Date.now() - startTime;
    console.log(`[Learning] Completed in ${duration}ms`);
    console.log(`[Learning] Learned: ${config.learned_brands.length} brands, ${Object.keys(config.synonyms).length} synonyms`);
    
    return config;
  }

  /**
   * Incremental learning from a single new product
   * Called when individual products are added
   */
  async learnFromSingleProduct(product) {
    // Get existing configuration
    const { data: existingConfig } = await this.supabase
      .from('query_enhancement_config')
      .select('*')
      .eq('domain', this.domain)
      .single();

    if (!existingConfig) {
      // First product for this domain - initialize
      return this.learnFromNewProducts([product]);
    }

    // Update incrementally
    const brands = new Set(existingConfig.learned_brands || []);
    const categories = new Set(existingConfig.learned_categories || []);
    
    // Extract from new product
    const productData = this.extractProductData(product);
    productData.brands.forEach(b => brands.add(b));
    productData.categories.forEach(c => categories.add(c));

    // Update configuration
    const updatedConfig = {
      ...existingConfig,
      learned_brands: Array.from(brands),
      learned_categories: Array.from(categories),
      total_products_analyzed: (existingConfig.total_products_analyzed || 0) + 1,
      updated_at: new Date().toISOString()
    };

    await this.saveConfiguration(updatedConfig);
    return updatedConfig;
  }

  /**
   * Analyze a single product
   */
  analyzeProduct(product, learningData) {
    const text = `${product.title || ''} ${product.content || ''}`.toLowerCase();
    const metadata = product.metadata || {};
    
    // Extract brands (capitalized words that repeat)
    const brandMatches = (product.title || '').match(/\b[A-Z][a-z]+\b/g);
    if (brandMatches) {
      brandMatches.forEach(brand => learningData.brands.add(brand));
    }
    
    // Extract categories
    if (metadata.category) {
      metadata.category.split(/[,>/]/).forEach(cat => {
        learningData.categories.add(cat.trim().toLowerCase());
      });
    }
    
    // Build term frequency
    const words = text.split(/\s+/).filter(w => w.length > 2);
    words.forEach(word => {
      learningData.termFrequency.set(word, 
        (learningData.termFrequency.get(word) || 0) + 1
      );
    });
    
    // Track co-occurrences
    const uniqueWords = [...new Set(words)];
    for (let i = 0; i < uniqueWords.length; i++) {
      for (let j = i + 1; j < Math.min(i + 10, uniqueWords.length); j++) {
        const pair = [uniqueWords[i], uniqueWords[j]].sort().join('|');
        learningData.coOccurrence.set(pair,
          (learningData.coOccurrence.get(pair) || 0) + 1
        );
      }
    }
  }

  /**
   * Build synonyms from co-occurrence data
   */
  buildSynonyms(coOccurrence, totalProducts) {
    const synonyms = new Map();
    const threshold = totalProducts * this.minConfidence;
    
    coOccurrence.forEach((count, pair) => {
      if (count > threshold) {
        const [word1, word2] = pair.split('|');
        
        // Check if likely synonyms (similar length, high co-occurrence)
        if (Math.abs(word1.length - word2.length) < 4 &&
            !word1.includes(word2) && 
            !word2.includes(word1)) {
          
          if (!synonyms.has(word1)) synonyms.set(word1, []);
          if (!synonyms.has(word2)) synonyms.set(word2, []);
          
          if (!synonyms.get(word1).includes(word2)) {
            synonyms.get(word1).push(word2);
          }
          if (!synonyms.get(word2).includes(word1)) {
            synonyms.get(word2).push(word1);
          }
        }
      }
    });
    
    return synonyms;
  }

  /**
   * Extract patterns from term frequency
   */
  extractPatterns(termFrequency) {
    const patterns = {};
    const sorted = Array.from(termFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100); // Top 100 terms
    
    sorted.forEach(([term, freq]) => {
      patterns[term] = freq;
    });
    
    return patterns;
  }

  /**
   * Extract data from a single product
   */
  extractProductData(product) {
    const brands = new Set();
    const categories = new Set();
    
    // Extract brands
    const brandMatches = (product.title || '').match(/\b[A-Z][a-z]+\b/g);
    if (brandMatches) {
      brandMatches.forEach(brand => brands.add(brand));
    }
    
    // Extract categories
    if (product.metadata?.category) {
      product.metadata.category.split(/[,>/]/).forEach(cat => {
        categories.add(cat.trim().toLowerCase());
      });
    }
    
    return { brands: Array.from(brands), categories: Array.from(categories) };
  }

  /**
   * Save configuration to database
   */
  async saveConfiguration(config) {
    const { error } = await this.supabase
      .from('query_enhancement_config')
      .upsert(config, { onConflict: 'domain' });
    
    if (error) {
      console.error('[Learning] Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Schedule periodic re-learning
   */
  static async schedulePeriodicLearning(domain, supabase) {
    // This would be called by a cron job or background worker
    console.log(`[Learning] Starting scheduled learning for domain: ${domain}`);
    
    // Get recent products
    const { data: products } = await supabase
      .from('scraped_pages')
      .select('title, content, metadata')
      .eq('domain', domain)
      .eq('type', 'product')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (products && products.length > 0) {
      const learner = new LearningService(domain, supabase);
      await learner.learnFromNewProducts(products);
    }
  }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LearningService };
}