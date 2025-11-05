/**
 * Response Parser for Entity Extraction
 * Automatically detects and tracks entities, corrections, and lists
 * from user messages and AI responses to improve conversation context.
 */

import type {
  ConversationEntity,
  ConversationMetadataManager
} from './conversation-metadata';

export interface ParsedResponse {
  entities: ConversationEntity[];
  corrections: Array<{ original: string; corrected: string }>;
  lists: Array<{ items: Array<{ name: string; url?: string }> }>;
}

/**
 * Parses AI responses and user messages for trackable elements
 */
export class ResponseParser {
  /**
   * Parse AI response and user message for trackable elements
   *
   * @example
   * const result = ResponseParser.parseResponse(
   *   "Sorry I meant Model-4 not Model-5",
   *   "Got it, looking at Model-4 instead...",
   *   3
   * );
   * // result.corrections = [{ original: "Model-5", corrected: "Model-4" }]
   */
  static parseResponse(
    userMessage: string,
    aiResponse: string,
    turnNumber: number
  ): ParsedResponse {
    const result: ParsedResponse = {
      entities: [],
      corrections: [],
      lists: []
    };

    try {
      result.corrections = this.detectCorrections(userMessage);
      result.entities.push(...this.extractProductReferences(aiResponse, turnNumber));
      result.entities.push(...this.extractOrderReferences(aiResponse, turnNumber));
      result.lists = this.detectNumberedLists(aiResponse);
    } catch (error) {
      console.error('[ResponseParser] Error parsing response:', error);
    }

    return result;
  }

  /**
   * Detect corrections in user messages
   * Patterns: "I meant X not Y", "not Y but X", "X → Y"
   */
  private static detectCorrections(
    userMessage: string
  ): Array<{ original: string; corrected: string }> {
    const correctionPatterns = [
      // "Sorry/Actually, I meant X not Y"
      /(?:sorry|actually|no|wait)[,\s]+(?:i\s+meant|it'?s|i\s+said)\s+([^\s,]+)\s+(?:not|instead\s+of)\s+([^\s,]+)/i,
      // "I meant X not Y" (without trigger word)
      /i\s+meant\s+([^\s,]+)\s+(?:not|instead\s+of)\s+([^\s,]+)/i,
      // "not Y but X"
      /not\s+([^\s,]+)[,\s]*(?:but|it'?s)\s+([^\s,]+)/i,
      // "X → Y" or "X -> Y"
      /([^\s,]+)\s*(?:→|->)\s*([^\s,]+)/,
      // "I said X not Y"
      /i\s+said\s+([^\s,]+)[,\s]+not\s+([^\s,]+)/i,
      // "it's X not Y"
      /it'?s\s+([^\s,]+)\s+not\s+([^\s,]+)/i,
      // "Actually X not Y" (without "I meant")
      /(?:actually|sorry)[,\s]+([^\s,]+)\s+not\s+([^\s,]+)/i
    ];

    for (const pattern of correctionPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1] && match[2]) {
        let corrected = match[1].trim();
        let original = match[2].trim();

        // For "not Y but X" pattern, swap them (Y is original, X is corrected)
        if (pattern === correctionPatterns[2]) { // /not\s+([^\s,]+)[,\s]*(?:but|it'?s)\s+([^\s,]+)/i
          [original, corrected] = [corrected, original];
        }

        // For arrow notation "X → Y", the arrow points from original to corrected
        // So X is original, Y is corrected (need to swap current assignment)
        if (pattern === correctionPatterns[3]) { // /([^\s,]+)\s*(?:→|->)\s*([^\s,]+)/
          [original, corrected] = [corrected, original];
        }

        if (corrected.length > 0 && corrected.length < 50 &&
            original.length > 0 && original.length < 50) {
          return [{ original, corrected }];
        }
      }
    }
    return [];
  }

  /**
   * Extract product references from markdown links: [Product Name](url)
   */
  private static extractProductReferences(
    aiResponse: string,
    turnNumber: number
  ): ConversationEntity[] {
    const products: ConversationEntity[] = [];
    const productUrlPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = productUrlPattern.exec(aiResponse)) !== null) {
      const productName = match[1];
      const url = match[2];
      if (productName && url && this.isProductLink(url, productName)) {
        products.push({
          id: `product_${turnNumber}_${productName.replace(/\s+/g, '_')}`,
          type: 'product',
          value: productName.trim(),
          aliases: ['it', 'that', 'this', 'the product'],
          turnNumber,
          metadata: { url: url.trim() }
        });
      }
    }
    return products;
  }

  /**
   * Extract order references: "order #12345", "order 12345", "orders #12345", "#67890"
   */
  private static extractOrderReferences(
    aiResponse: string,
    turnNumber: number
  ): ConversationEntity[] {
    const orders: ConversationEntity[] = [];
    // Match "order(s) #?12345" and standalone "#12345"
    const orderPattern = /(?:orders?\s+#?|#)(\d+)/gi;
    let match;

    while ((match = orderPattern.exec(aiResponse)) !== null) {
      if (match[1]) {
        orders.push({
          id: `order_${turnNumber}_${match[1]}`,
          type: 'order',
          value: match[1],
          aliases: ['it', 'that', 'the order', 'my order'],
          turnNumber
        });
      }
    }
    return orders;
  }

  /**
   * Detect numbered lists in AI response
   * Formats: "1. [Item](url)", "- [Item](url)", "• [Item](url)"
   */
  private static detectNumberedLists(
    aiResponse: string
  ): Array<{ items: Array<{ name: string; url?: string }> }> {
    const listItems: Array<{ name: string; url?: string }> = [];
    const listPattern = /(?:^|\n)[\s]*(?:[•\-*]|\d+\.)\s*\[([^\]]+)\]\(([^)]+)\)/gm;
    let match;

    while ((match = listPattern.exec(aiResponse)) !== null) {
      if (match[1] && match[2]) {
        listItems.push({
          name: match[1].trim(),
          url: match[2].trim()
        });
      }
    }

    return listItems.length >= 2 ? [{ items: listItems }] : [];
  }

  /**
   * Check if a URL looks like a product link and name is not generic
   */
  private static isProductLink(url: string, name?: string): boolean {
    // Filter out generic link text
    if (name) {
      const genericLinkTexts = ['click here', 'view details', 'learn more', 'see more', 'read more'];
      if (genericLinkTexts.includes(name.toLowerCase().trim())) {
        return false;
      }
    }

    // Filter out non-product URLs
    const nonProductPatterns = [
      /[\/\.]docs([\/\.]|$)/i, /[\/\.]help([\/\.]|$)/i, /[\/\.]support([\/\.]|$)/i,
      /[\/\.]about([\/\.]|$)/i, /[\/\.]contact([\/\.]|$)/i, /\.pdf$/i
    ];
    return !nonProductPatterns.some(pattern => pattern.test(url));
  }
}

/**
 * Helper function to parse and track entities in metadata manager
 *
 * @example
 * await parseAndTrackEntities(
 *   "Here's the [Model-4 Product](https://example.com/model4)",
 *   "Show me products",
 *   metadataManager
 * );
 */
export async function parseAndTrackEntities(
  aiResponse: string,
  userMessage: string,
  metadataManager: ConversationMetadataManager
): Promise<void> {
  try {
    const currentTurn = metadataManager.getCurrentTurn();
    const parsed = ResponseParser.parseResponse(userMessage, aiResponse, currentTurn);

    parsed.entities.forEach(entity => metadataManager.trackEntity(entity));
    parsed.corrections.forEach(correction => {
      metadataManager.trackCorrection(
        correction.original,
        correction.corrected,
        userMessage
      );
    });
    parsed.lists.forEach(list => metadataManager.trackList(list.items));
  } catch (error) {
    console.error('[parseAndTrackEntities] Error tracking entities:', error);
  }
}
