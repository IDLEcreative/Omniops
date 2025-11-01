/**
 * Query Reformulator
 * Intelligently combines current message with conversation context
 * to create more effective search queries
 */

import { Message, ReformulatedQuery, Entities } from './types';
import { CONTINUATION_PATTERNS, REFERENCE_PATTERNS, QUESTION_PATTERNS } from './patterns';
import { extractEntities, mergeEntities } from './entity-extractor';

export class QueryReformulator {
  /**
   * Determine if message is a continuation
   */
  private static isContinuation(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    return CONTINUATION_PATTERNS.some(pattern => pattern.test(lowerMessage)) ||
           REFERENCE_PATTERNS.some(pattern => pattern.test(lowerMessage)) ||
           QUESTION_PATTERNS.some(pattern => pattern.test(lowerMessage));
  }

  /**
   * Clean continuation phrases from message
   */
  private static cleanContinuationPhrase(message: string): string {
    let cleaned = message;

    // Remove continuation phrases
    CONTINUATION_PATTERNS.forEach(pattern => {
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
      const currentEntities = extractEntities(currentClean);

      // Extract entities from recent messages
      const historyEntities = recentUserMessages.map(msg => extractEntities(msg));

      // Merge all entities
      const allEntities = mergeEntities(currentEntities, ...historyEntities);

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
    const hasReference = REFERENCE_PATTERNS.some(p => p.test(currentMessage.toLowerCase()));

    if (hasReference && recentUserMessages.length > 0) {
      // Get entities from last message
      const lastMessage = recentUserMessages[recentUserMessages.length - 1];
      const lastEntities = extractEntities(lastMessage || '');
      const currentEntities = extractEntities(currentMessage);

      // Merge entities
      const merged = mergeEntities(lastEntities, currentEntities);

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
        context: [lastMessage || '']
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
    const entities = extractEntities(query);

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

// Re-export types
export type { Message, ReformulatedQuery, Entities };
