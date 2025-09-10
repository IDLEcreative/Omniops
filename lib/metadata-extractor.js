/**
 * JavaScript version of MetadataExtractor for use in scraper-worker.js
 * This is a simplified version compatible with Node.js require()
 */

class MetadataExtractor {
  static async extractEnhancedMetadata(
    chunkText,
    fullContent,
    url,
    title,
    chunkPosition,
    totalChunks,
    htmlContent = null
  ) {
    // Content classification
    const contentType = this.classifyContent(chunkText, url);
    
    // Extract various metadata fields
    const metadata = {
      // Content classification
      content_type: contentType,
      content_subtype: this.detectContentSubtype(chunkText, contentType),
      
      // Semantic analysis
      keywords: this.extractKeywords(chunkText),
      entities: this.extractEntities(chunkText),
      
      // Position metadata
      position_weight: 1 - (chunkPosition / totalChunks),
      chunk_index: chunkPosition,
      total_chunks: totalChunks,
      
      // Quality metrics
      semantic_density: this.calculateSemanticDensity(chunkText),
      readability_score: this.calculateReadability(chunkText),
      
      // Commerce specific
      price_range: this.extractPriceInfo(chunkText),
      
      // Technical metadata
      has_code: /```|<code>|\bfunction\b|\bclass\b|\bconst\b|\bvar\b/.test(chunkText),
      has_numbers: /\d+/.test(chunkText),
      
      // Content indicators
      has_questions: /\?/.test(chunkText),
      has_lists: /^\s*[-*•]\s+/m.test(chunkText) || /^\s*\d+\.\s+/m.test(chunkText),
      
      // Contact information
      contact_info: this.extractContactInfo(chunkText),
      
      // Q&A pairs
      qa_pairs: this.extractQAPairs(chunkText),
      
      // Language detection
      language: this.detectLanguage(chunkText),
      
      // Timestamps
      extracted_at: new Date().toISOString(),
      
      // URL components
      url_path: new URL(url).pathname,
      url_depth: new URL(url).pathname.split('/').filter(Boolean).length
    };
    
    return metadata;
  }
  
  static classifyContent(text, url = '') {
    const lowerText = text.toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    // Check URL patterns first
    if (/product|item|sku|shop|store/.test(lowerUrl)) return 'product';
    if (/faq|help|support/.test(lowerUrl)) return 'faq';
    if (/doc|guide|manual|tutorial/.test(lowerUrl)) return 'documentation';
    if (/blog|article|news|post/.test(lowerUrl)) return 'blog';
    if (/contact|about/.test(lowerUrl)) return 'support';
    
    // Check content patterns
    if (/\$\d+|\d+\.\d{2}|price|add to cart|buy now|in stock/.test(lowerText)) {
      return 'product';
    }
    if (/frequently asked|common questions|q:|a:/.test(lowerText)) {
      return 'faq';
    }
    if (/step \d+|install|configure|setup|how to/.test(lowerText)) {
      return 'documentation';
    }
    if (/posted on|by.*on|comments|share this/.test(lowerText)) {
      return 'blog';
    }
    if (/contact us|email us|call us|support@|help@/.test(lowerText)) {
      return 'support';
    }
    
    return 'general';
  }
  
  static detectContentSubtype(text, contentType) {
    const lowerText = text.toLowerCase();
    
    switch(contentType) {
      case 'product':
        if (/specifications|specs|dimensions/.test(lowerText)) return 'specifications';
        if (/review|rating|customer/.test(lowerText)) return 'reviews';
        if (/description|overview|features/.test(lowerText)) return 'description';
        break;
      case 'documentation':
        if (/installation|setup/.test(lowerText)) return 'installation';
        if (/troubleshoot|problem|issue|error/.test(lowerText)) return 'troubleshooting';
        if (/api|endpoint|request|response/.test(lowerText)) return 'api';
        break;
      case 'faq':
        if (/shipping|delivery|returns/.test(lowerText)) return 'shipping';
        if (/payment|billing|refund/.test(lowerText)) return 'payment';
        if (/technical|support/.test(lowerText)) return 'technical';
        break;
    }
    
    return null;
  }
  
  static extractKeywords(text) {
    // Simple keyword extraction - find important terms
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);
    
    // Count frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Get top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  static extractEntities(text) {
    const entities = {
      skus: [],
      brands: [],
      products: []
    };
    
    // SKU patterns
    const skuPattern = /\b[A-Z]{2,4}[-_]?\d{3,6}\b/g;
    const skus = text.match(skuPattern);
    if (skus) entities.skus = [...new Set(skus)];
    
    // Brand detection (simple heuristic - capitalized words)
    const brandPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g;
    const potentialBrands = text.match(brandPattern);
    if (potentialBrands) {
      entities.brands = [...new Set(potentialBrands)]
        .filter(b => b.length > 3)
        .slice(0, 5);
    }
    
    // Product names (look for patterns like "Model X", "Series Y")
    const productPattern = /(?:Model|Series|Version|Type)\s+[A-Z0-9]+/gi;
    const products = text.match(productPattern);
    if (products) entities.products = [...new Set(products)];
    
    return entities;
  }
  
  static calculateSemanticDensity(text) {
    // Ratio of meaningful words to total words
    const words = text.split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const meaningfulWords = words.filter(w => !stopWords.has(w.toLowerCase()) && w.length > 2);
    
    return words.length > 0 ? meaningfulWords.length / words.length : 0;
  }
  
  static calculateReadability(text) {
    // Simple readability score based on sentence and word length
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const words = text.split(/\s+/);
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    
    // Lower average sentence length = better readability
    if (avgSentenceLength < 10) return 1.0;
    if (avgSentenceLength < 15) return 0.8;
    if (avgSentenceLength < 20) return 0.6;
    if (avgSentenceLength < 25) return 0.4;
    return 0.2;
  }
  
  static extractPriceInfo(text) {
    // Extract price ranges - support multiple currencies
    const pricePatterns = [
      { pattern: /£(\d+(?:[.,]\d{2})?)/g, currency: 'GBP' },
      { pattern: /\$(\d+(?:[.,]\d{2})?)/g, currency: 'USD' },
      { pattern: /€(\d+(?:[.,]\d{2})?)/g, currency: 'EUR' },
      { pattern: /(?:USD|GBP|EUR)\s*(\d+(?:[.,]\d{2})?)/gi, currency: 'multi' }
    ];
    
    const prices = [];
    let detectedCurrency = null;
    
    for (const { pattern, currency } of pricePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const price = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(price)) {
          prices.push(price);
          if (!detectedCurrency) detectedCurrency = currency;
        }
      }
      if (prices.length > 0) break; // Stop after finding prices in one currency
    }
    
    if (prices.length === 0) return null;
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: detectedCurrency || 'UNKNOWN',
      count: prices.length
    };
  }
  
  static extractContactInfo(text) {
    const info = {};
    
    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails && emails.length > 0) {
      info.email = emails[0];
    }
    
    // Phone pattern (US format)
    const phonePattern = /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g;
    const phones = text.match(phonePattern);
    if (phones && phones.length > 0) {
      info.phone = phones[0];
    }
    
    // Address pattern (simplified)
    const addressPattern = /\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/gi;
    const addresses = text.match(addressPattern);
    if (addresses && addresses.length > 0) {
      info.address = addresses[0];
    }
    
    return Object.keys(info).length > 0 ? info : undefined;
  }
  
  static extractQAPairs(text) {
    const pairs = [];
    
    // Pattern 1: Q: ... A: ...
    const qaPattern1 = /Q:\s*([^A]+)\s*A:\s*([^Q]+)/gi;
    let match;
    while ((match = qaPattern1.exec(text)) !== null) {
      pairs.push({
        question: match[1].trim(),
        answer: match[2].trim()
      });
    }
    
    // Pattern 2: Question sentences followed by answers
    const lines = text.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].endsWith('?')) {
        // Next non-empty line might be the answer
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim()) {
            if (!lines[j].endsWith('?')) {
              pairs.push({
                question: lines[i].trim(),
                answer: lines[j].trim()
              });
            }
            break;
          }
        }
      }
    }
    
    return pairs.slice(0, 5); // Limit to 5 Q&A pairs
  }
  
  static detectLanguage(text) {
    // Very simple language detection based on common words
    const english = /\b(the|is|are|was|were|have|has|had|will|would|can|could)\b/gi;
    const spanish = /\b(el|la|los|las|es|son|está|están)\b/gi;
    const french = /\b(le|la|les|est|sont|avec|dans|pour)\b/gi;
    const german = /\b(der|die|das|ist|sind|haben|werden)\b/gi;
    
    const counts = {
      en: (text.match(english) || []).length,
      es: (text.match(spanish) || []).length,
      fr: (text.match(french) || []).length,
      de: (text.match(german) || []).length
    };
    
    const maxLang = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b);
    return maxLang[1] > 2 ? maxLang[0] : 'en'; // Default to English
  }
}

module.exports = { MetadataExtractor };