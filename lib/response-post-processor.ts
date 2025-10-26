/**
 * Response Post-Processor
 * Ensures products are always presented in AI responses when found in context
 */

interface ContextChunk {
  content: string;
  url: string;
  title: string;
  similarity: number;
}

interface PostProcessOptions {
  forceProductPresentation?: boolean;
  maxProductsToAppend?: number;
  appendStrategy?: 'natural' | 'list' | 'subtle';
}

export class ResponsePostProcessor {
  /**
   * Check if response mentions any products from context
   */
  private static responseContainsProducts(response: string, products: ContextChunk[]): boolean {
    const responseLower = response.toLowerCase();
    
    return products.some(product => {
      // Check if product title or URL is mentioned
      const titleWords = product.title.toLowerCase().split(/\s+/);
      const keyWords = titleWords.filter(w => w.length > 4); // Skip short words
      
      // Check for product name mentions
      const hasProductName = keyWords.some(word => responseLower.includes(word));
      
      // Check for product URL mentions
      const hasProductUrl = product.url && response.includes(product.url);
      
      // Check for SKU if present in content
      const skuMatch = product.content.match(/SKU:\s*([A-Z0-9-]+)/i);
      const hasSku = skuMatch && skuMatch[1] && responseLower.includes(skuMatch[1].toLowerCase());
      
      return hasProductName || hasProductUrl || hasSku;
    });
  }

  /**
   * Detect if query is vague and needs product injection
   */
  private static isVagueQuery(query: string): boolean {
    const vaguePatterns = [
      /^(it'?s?\s+)?for\s+\w+$/i,  // "for agriculture", "its for farming"
      /^what\s+.*\s+do\s+you\s+have/i,  // "what tippers do you have"
      /^(show|list|display)\s+(me\s+)?(your|the)\s+/i,  // "show me your..."
      /^(any|some)\s+\w+\s+for\s+/i,  // "any tippers for..."
      /^(yes|yeah|yep|sure|ok)[\s,.]*(that|those|these)/i,  // confirmations
    ];
    
    return vaguePatterns.some(pattern => pattern.test(query.trim()));
  }

  /**
   * Extract high-confidence products from context
   */
  private static getHighConfidenceProducts(
    chunks: ContextChunk[], 
    maxProducts: number = 3
  ): ContextChunk[] {
    // Filter for actual products (not category pages)
    const products = chunks.filter(chunk => {
      const isProduct = chunk.url?.includes('/product/') || 
                       chunk.title?.toLowerCase().includes('sku') ||
                       chunk.content?.includes('£');
      const hasHighConfidence = chunk.similarity > 0.5;
      return isProduct && hasHighConfidence;
    });
    
    // Sort by similarity and return top N
    return products
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxProducts);
  }

  /**
   * Generate natural product appendix
   */
  private static generateProductAppendix(
    products: ContextChunk[], 
    strategy: 'natural' | 'list' | 'subtle' = 'natural'
  ): string {
    if (products.length === 0) return '';
    
    switch (strategy) {
      case 'natural':
        return this.generateNaturalAppendix(products);
      case 'list':
        return this.generateListAppendix(products);
      case 'subtle':
        return this.generateSubtleAppendix(products);
      default:
        return this.generateNaturalAppendix(products);
    }
  }

  /**
   * Natural conversational appendix
   */
  private static generateNaturalAppendix(products: ContextChunk[]): string {
    let appendix = '\n\nBased on what you mentioned, these products might be particularly relevant:\n\n';

    // Get brand suffix from environment (e.g., "Thompson's eParts")
    const brandSuffix = process.env.NEXT_PUBLIC_COMPANY_NAME || '';
    const brandPattern = brandSuffix ? new RegExp(` - ${brandSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'i') : null;

    products.forEach((product, index) => {
      // Extract key info from product
      let title = product.title.trim();
      if (brandPattern) {
        title = title.replace(brandPattern, '').trim();
      }
      
      // Try to extract a brief description
      let description = '';
      const descMatch = product.content.match(/Description:\s*([^.]+)\./i);
      if (descMatch) {
        description = ` - ${descMatch[1]}`;
      } else if (product.content.length > 50) {
        // Use first sentence of content
        const firstSentence = product.content.split('.')[0];
        if (firstSentence && firstSentence.length < 150) {
          description = ` - ${firstSentence}`;
        }
      }
      
      appendix += `• [${title}](${product.url})${description}\n\n`;
    });
    
    return appendix;
  }

  /**
   * Simple list appendix
   */
  private static generateListAppendix(products: ContextChunk[]): string {
    let appendix = '\n\nRelevant products for your needs:\n\n';

    // Get brand suffix from environment (e.g., "Thompson's eParts")
    const brandSuffix = process.env.NEXT_PUBLIC_COMPANY_NAME || '';
    const brandPattern = brandSuffix ? new RegExp(` - ${brandSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'i') : null;

    products.forEach(product => {
      let title = product.title.trim();
      if (brandPattern) {
        title = title.replace(brandPattern, '').trim();
      }
      appendix += `• [${title}](${product.url})\n`;
    });

    return appendix + '\n';
  }

  /**
   * Subtle appendix (brief mention)
   */
  private static generateSubtleAppendix(products: ContextChunk[]): string {
    const product = products[0]; // Just mention the top one
    if (!product) return '';

    // Get brand suffix from environment (e.g., "Thompson's eParts")
    const brandSuffix = process.env.NEXT_PUBLIC_COMPANY_NAME || '';
    const brandPattern = brandSuffix ? new RegExp(` - ${brandSuffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'i') : null;

    let title = product.title.trim();
    if (brandPattern) {
      title = title.replace(brandPattern, '').trim();
    }

    return `\n\nYou might also want to check out our [${title}](${product.url}) which could be suitable for your needs.\n`;
  }

  /**
   * Main post-processing function
   */
  static processResponse(
    aiResponse: string,
    userQuery: string,
    contextChunks: ContextChunk[],
    options: PostProcessOptions = {}
  ): { 
    processed: string; 
    wasModified: boolean; 
    appendedProducts: number;
  } {
    const {
      forceProductPresentation = true,
      maxProductsToAppend = 3,
      appendStrategy = 'natural'
    } = options;
    
    // If no context chunks, return original
    if (!contextChunks || contextChunks.length === 0) {
      return {
        processed: aiResponse,
        wasModified: false,
        appendedProducts: 0
      };
    }
    
    // Get high-confidence products
    const relevantProducts = this.getHighConfidenceProducts(contextChunks, maxProductsToAppend);
    
    // If no products found, return original
    if (relevantProducts.length === 0) {
      return {
        processed: aiResponse,
        wasModified: false,
        appendedProducts: 0
      };
    }
    
    // Check if response already contains products
    const hasProducts = this.responseContainsProducts(aiResponse, relevantProducts);
    
    // If products are mentioned or query isn't vague, return original
    if (hasProducts && !forceProductPresentation) {
      return {
        processed: aiResponse,
        wasModified: false,
        appendedProducts: 0
      };
    }
    
    // Check if this is a vague query that needs product injection
    const needsInjection = this.isVagueQuery(userQuery) || forceProductPresentation;
    
    if (!hasProducts && needsInjection) {
      // Generate and append product information
      const appendix = this.generateProductAppendix(relevantProducts, appendStrategy);
      
      // Smart insertion point - before any "contact us" or "browse category" mentions
      let processed = aiResponse;
      
      const contactPattern = /(please contact|contact our|browse our|view our|check our|visit our)/i;
      const contactMatch = processed.match(contactPattern);
      
      if (contactMatch && contactMatch.index) {
        // Insert before the contact/browse suggestion
        processed = processed.slice(0, contactMatch.index) + 
                   appendix + '\n' +
                   processed.slice(contactMatch.index);
      } else {
        // Append at the end
        processed = aiResponse + appendix;
      }
      
      console.log('[Post-Processor] Appended', relevantProducts.length, 'products to response');
      
      return {
        processed,
        wasModified: true,
        appendedProducts: relevantProducts.length
      };
    }
    
    return {
      processed: aiResponse,
      wasModified: false,
      appendedProducts: 0
    };
  }

  /**
   * Debug function to analyze why products weren't shown
   */
  static analyzeResponse(
    aiResponse: string,
    userQuery: string,
    contextChunks: ContextChunk[]
  ): {
    queryIsVague: boolean;
    productsInContext: number;
    highConfidenceProducts: number;
    responseContainsProducts: boolean;
    shouldHaveAppended: boolean;
  } {
    const relevantProducts = this.getHighConfidenceProducts(contextChunks);
    const hasProducts = this.responseContainsProducts(aiResponse, relevantProducts);
    const isVague = this.isVagueQuery(userQuery);
    
    return {
      queryIsVague: isVague,
      productsInContext: contextChunks.filter(c => c.url?.includes('/product/')).length,
      highConfidenceProducts: relevantProducts.length,
      responseContainsProducts: hasProducts,
      shouldHaveAppended: isVague && !hasProducts && relevantProducts.length > 0
    };
  }
}

export default ResponsePostProcessor;