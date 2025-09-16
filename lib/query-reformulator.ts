/**
 * Query Reformulator
 * Intelligently combines current message with conversation context
 * to create more effective search queries
 */

interface Message {
  role: string;
  content: string;
}

interface ReformulatedQuery {
  original: string;
  reformulated: string;
  confidence: number;
  strategy: 'direct' | 'contextual' | 'continuation' | 'clarification';
  context?: string[];
}

export class QueryReformulator {
  // Patterns that indicate continuation from previous context
  private static CONTINUATION_PATTERNS = [
    /^(it'?s?\s+for|its?\s+for)\s+/i,
    /^(yes,?\s+)?for\s+/i,
    /^(i\s+need\s+it\s+for|we\s+need\s+it\s+for)\s+/i,
    /^(that'?s?\s+for|thats?\s+for)\s+/i,
    /^(specifically\s+for|especially\s+for)\s+/i,
    /^(mainly\s+for|mostly\s+for)\s+/i,
    /^(the\s+one\s+for|one\s+for)\s+/i,
    /^(something\s+for)\s+/i,
  ];

  // Patterns that reference previous mentions
  private static REFERENCE_PATTERNS = [
    /^(that|those|these|this)\s+(one|product|item)/i,
    /^(the\s+)?(first|second|third|last)\s+one/i,
    /^(yes|yeah|yep|sure|ok|okay)[\s,.]*(that'?s?\s+)?(it|one|correct|right)/i,
    /^(exactly|precisely|correct)/i,
  ];

  // Question patterns that need context
  private static QUESTION_PATTERNS = [
    /^(do\s+you\s+have|have\s+you\s+got)\s+(any|some)?\s*$/i,
    /^(what\s+about|how\s+about)\s*$/i,
    /^(any\s+other|anything\s+else)\s*$/i,
    /^(what\s+)?(options|choices|alternatives)\s*$/i,
  ];

  /**
   * Extract key entities from a message
   */
  private static extractEntities(message: string): {
    products: string[];
    categories: string[];
    specifications: string[];
    useCases: string[];
  } {
    const entities = {
      products: [] as string[],
      categories: [] as string[],
      specifications: [] as string[],
      useCases: [] as string[]
    };

    // Product patterns
    const productPatterns = [
      /\b(tipper|dumper|trailer|pump|valve|motor|sheeting|flip|roller)\b/gi,
      /\b[A-Z]{2,}[\d-]+[A-Z]?\b/g, // SKU patterns
    ];

    // Category patterns
    const categoryPatterns = [
      /\b(agricultural?|farming?|construction|hydraulic|electric|manual)\b/gi,
      /\b(equipment|machinery|parts?|systems?|accessories)\b/gi,
    ];

    // Specification patterns
    const specPatterns = [
      /\b\d+\s*(mm|cm|m|kg|ton|hp|volt|amp|bar|psi|gpm|lpm)\b/gi,
      /\b(heavy[\s-]duty|light[\s-]weight|commercial|industrial)\b/gi,
    ];

    // Use case patterns
    const useCasePatterns = [
      /\b(for\s+[\w\s]+ing)\b/gi,
      /\b(used\s+for|suitable\s+for|designed\s+for)\s+[\w\s]+/gi,
    ];

    // Extract entities
    productPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) entities.products.push(...matches.map(m => m.toLowerCase()));
    });

    categoryPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) entities.categories.push(...matches.map(m => m.toLowerCase()));
    });

    specPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) entities.specifications.push(...matches.map(m => m.toLowerCase()));
    });

    useCasePatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) entities.useCases.push(...matches.map(m => m.toLowerCase()));
    });

    // Deduplicate
    entities.products = [...new Set(entities.products)];
    entities.categories = [...new Set(entities.categories)];
    entities.specifications = [...new Set(entities.specifications)];
    entities.useCases = [...new Set(entities.useCases)];

    return entities;
  }

  /**
   * Determine if message is a continuation
   */
  private static isContinuation(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    return this.CONTINUATION_PATTERNS.some(pattern => pattern.test(lowerMessage)) ||
           this.REFERENCE_PATTERNS.some(pattern => pattern.test(lowerMessage)) ||
           this.QUESTION_PATTERNS.some(pattern => pattern.test(lowerMessage));
  }

  /**
   * Merge entities from multiple messages
   */
  private static mergeEntities(...entitySets: ReturnType<typeof QueryReformulator.extractEntities>[]): ReturnType<typeof QueryReformulator.extractEntities> {
    const merged = {
      products: [] as string[],
      categories: [] as string[],
      specifications: [] as string[],
      useCases: [] as string[]
    };

    entitySets.forEach(entities => {
      merged.products.push(...entities.products);
      merged.categories.push(...entities.categories);
      merged.specifications.push(...entities.specifications);
      merged.useCases.push(...entities.useCases);
    });

    // Deduplicate
    merged.products = [...new Set(merged.products)];
    merged.categories = [...new Set(merged.categories)];
    merged.specifications = [...new Set(merged.specifications)];
    merged.useCases = [...new Set(merged.useCases)];

    return merged;
  }

  /**
   * Clean continuation phrases from message
   */
  private static cleanContinuationPhrase(message: string): string {
    let cleaned = message;
    
    // Remove continuation phrases
    this.CONTINUATION_PATTERNS.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned.trim();
  }

  /**
   * Reformulate query based on conversation context
   */
  static reformulate(
    currentMessage: string,
    conversationHistory: Message[] = []
  ): ReformulatedQuery {
    // Default: return original if no history
    if (conversationHistory.length === 0) {
      return {
        original: currentMessage,
        reformulated: currentMessage,
        confidence: 1.0,
        strategy: 'direct'
      };
    }

    // Get last few user messages for context
    const recentUserMessages = conversationHistory
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => m.content);

    // Check if current message is a continuation
    const isContinuation = this.isContinuation(currentMessage);

    if (isContinuation) {
      // Extract entities from current message
      const currentClean = this.cleanContinuationPhrase(currentMessage);
      const currentEntities = this.extractEntities(currentClean);

      // Extract entities from recent messages
      const historyEntities = recentUserMessages.map(msg => this.extractEntities(msg));
      
      // Merge all entities
      const allEntities = this.mergeEntities(currentEntities, ...historyEntities);

      // Build reformulated query
      const parts: string[] = [];

      // Add products first (most specific)
      if (allEntities.products.length > 0) {
        parts.push(allEntities.products.join(' '));
      }

      // Add current message content (cleaned)
      if (currentClean) {
        parts.push(currentClean);
      }

      // Add categories if no products mentioned
      if (allEntities.products.length === 0 && allEntities.categories.length > 0) {
        parts.push(allEntities.categories.join(' '));
      }

      // Add specifications if relevant
      if (allEntities.specifications.length > 0) {
        parts.push(allEntities.specifications.join(' '));
      }

      const reformulated = parts.join(' ').trim();

      // Calculate confidence based on entity matches
      const confidence = Math.min(
        0.5 + (allEntities.products.length * 0.2) + 
        (allEntities.categories.length * 0.1) +
        (allEntities.specifications.length * 0.1),
        1.0
      );

      console.log('[Query Reformulator] Continuation detected');
      console.log(`  Original: "${currentMessage}"`);
      console.log(`  Reformulated: "${reformulated}"`);
      console.log(`  Extracted entities:`, allEntities);

      return {
        original: currentMessage,
        reformulated: reformulated || currentMessage,
        confidence,
        strategy: 'continuation',
        context: recentUserMessages
      };
    }

    // Check if message references previous context
    const hasReference = this.REFERENCE_PATTERNS.some(p => p.test(currentMessage.toLowerCase()));
    
    if (hasReference && recentUserMessages.length > 0) {
      // Get entities from last message
      const lastMessage = recentUserMessages[recentUserMessages.length - 1];
      const lastEntities = this.extractEntities(lastMessage);
      const currentEntities = this.extractEntities(currentMessage);
      
      // Merge entities
      const merged = this.mergeEntities(lastEntities, currentEntities);
      
      // Build query from merged entities
      const parts: string[] = [];
      if (merged.products.length > 0) {
        parts.push(merged.products.join(' '));
      }
      parts.push(currentMessage);
      
      const reformulated = parts.join(' ').trim();

      console.log('[Query Reformulator] Reference detected');
      console.log(`  Original: "${currentMessage}"`);
      console.log(`  Reformulated: "${reformulated}"`);

      return {
        original: currentMessage,
        reformulated,
        confidence: 0.7,
        strategy: 'contextual',
        context: [lastMessage]
      };
    }

    // No reformulation needed - direct query
    return {
      original: currentMessage,
      reformulated: currentMessage,
      confidence: 1.0,
      strategy: 'direct'
    };
  }

  /**
   * Generate multiple query variations for better coverage
   */
  static generateVariations(query: string): string[] {
    const variations = [query];
    const entities = this.extractEntities(query);

    // Add product-focused variation
    if (entities.products.length > 0) {
      variations.push(entities.products.join(' '));
    }

    // Add category-focused variation
    if (entities.categories.length > 0) {
      const categoryQuery = `${entities.categories.join(' ')} ${entities.products.join(' ')}`.trim();
      if (categoryQuery !== query) {
        variations.push(categoryQuery);
      }
    }

    // Add use-case focused variation
    if (entities.useCases.length > 0) {
      const useCaseQuery = `${entities.products.join(' ')} ${entities.useCases.join(' ')}`.trim();
      if (useCaseQuery !== query) {
        variations.push(useCaseQuery);
      }
    }

    return [...new Set(variations)]; // Deduplicate
  }
}

export default QueryReformulator;