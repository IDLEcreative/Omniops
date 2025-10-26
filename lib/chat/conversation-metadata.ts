/**
 * Conversation Metadata Management System
 *
 * Tracks entities, corrections, and references throughout a conversation
 * to improve AI context awareness and response accuracy.
 *
 * @module conversation-metadata
 */

export interface ConversationEntity {
  id: string;
  type: 'product' | 'order' | 'category' | 'correction' | 'list';
  value: string;
  aliases: string[]; // For pronoun resolution
  turnNumber: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationCorrection {
  turnNumber: number;
  originalValue: string;
  correctedValue: string;
  context: string;
}

export interface NumberedListReference {
  turnNumber: number;
  listId: string;
  items: Array<{
    position: number;
    name: string;
    url?: string;
    details?: string;
  }>;
}

/**
 * Manages conversation metadata for context-aware AI responses
 */
export class ConversationMetadataManager {
  private entities: Map<string, ConversationEntity> = new Map();
  private corrections: ConversationCorrection[] = [];
  private lists: Map<string, NumberedListReference> = new Map();
  private currentTurn: number = 0;

  /**
   * Track an entity for pronoun resolution
   */
  trackEntity(entity: ConversationEntity): void {
    this.entities.set(entity.id, entity);
  }

  /**
   * Resolve a reference (pronouns, "the first one", "item 2", etc.)
   * Handles:
   * - Pronouns: "it", "that", "this", "them", "one"
   * - Ordinals: "the first one", "second one"
   * - Numbered items: "item 2", "number 3"
   * - Generic "one": "which one", "this one", "that one", or just "one"
   */
  resolveReference(reference: string): ConversationEntity | null {
    const normalized = reference.toLowerCase().trim();

    // Check for numbered references ("item 2", "the second one")
    const numberMatch = normalized.match(/(?:item|number|option)?\s*(\d+)|(\w+)\s+one/i);
    if (numberMatch) {
      const itemNumber = numberMatch[1]
        ? parseInt(numberMatch[1], 10)
        : this.parseOrdinal(numberMatch[2]);

      if (itemNumber) {
        const listItem = this.resolveListItem(itemNumber);
        if (listItem) {
          // Create temporary entity for list item reference
          const entityId = `list_item_${this.currentTurn}_${itemNumber}`;
          return {
            id: entityId,
            type: 'product',
            value: listItem.name,
            aliases: ['it', 'that', 'this'],
            turnNumber: this.currentTurn,
            metadata: { url: listItem.url, position: itemNumber },
          };
        }
      }
    }

    // Get recent entities (last 3 turns)
    const recentEntities = Array.from(this.entities.values())
      .filter(e => this.currentTurn - e.turnNumber <= 3)
      .sort((a, b) => b.turnNumber - a.turnNumber);

    // Handle generic "one" pronoun (which one, this one, that one, or just "one")
    if (normalized === 'one' || normalized.includes('which one') ||
        normalized.includes('this one') || normalized.includes('that one')) {
      if (recentEntities.length > 0) {
        return recentEntities[0] ?? null; // Return most recent entity or null
      }
    }

    // Try to match against aliases (pronouns)
    for (const entity of recentEntities) {
      if (entity.aliases.some(alias => alias.toLowerCase() === normalized)) {
        return entity;
      }
    }

    // Try to match against value
    for (const entity of recentEntities) {
      if (entity.value.toLowerCase().includes(normalized)) {
        return entity;
      }
    }

    return null;
  }

  /**
   * Parse ordinal words to numbers (e.g., "first" -> 1, "second" -> 2)
   * @private
   */
  private parseOrdinal(word: string | undefined): number | null {
    if (!word) return null;
    const ordinals: Record<string, number> = {
      first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
      sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
    };
    return ordinals[word.toLowerCase()] || null;
  }

  /**
   * Track a user correction
   */
  trackCorrection(original: string, corrected: string, context: string): void {
    this.corrections.push({
      turnNumber: this.currentTurn,
      originalValue: original,
      correctedValue: corrected,
      context
    });
  }

  /**
   * Track a numbered list
   */
  trackList(items: Array<{ name: string; url?: string }>): string {
    const listId = `list_${this.currentTurn}_${Date.now()}`;
    this.lists.set(listId, {
      turnNumber: this.currentTurn,
      listId,
      items: items.map((item, idx) => ({
        position: idx + 1,
        name: item.name,
        url: item.url
      }))
    });
    return listId;
  }

  /**
   * Resolve a numbered item from the most recent list
   */
  resolveListItem(itemNumber: number): { position: number; name: string; url?: string; details?: string } | null {
    const sortedLists = Array.from(this.lists.values())
      .sort((a, b) => b.turnNumber - a.turnNumber);

    if (sortedLists.length === 0) return null;

    const recentList = sortedLists[0];
    if (!recentList) return null;
    return recentList.items.find(item => item.position === itemNumber) ?? null;
  }

  /**
   * Generate context summary for AI system prompt
   */
  generateContextSummary(): string {
    let summary = '';

    // Add corrections
    if (this.corrections.length > 0) {
      summary += '\n\n**Important Corrections in This Conversation:**\n';
      this.corrections.forEach(correction => {
        summary += `- User corrected "${correction.originalValue}" to "${correction.correctedValue}" (Turn ${correction.turnNumber})\n`;
      });
    }

    // Add tracked entities
    const recentEntities = Array.from(this.entities.values())
      .filter(e => this.currentTurn - e.turnNumber <= 5)
      .sort((a, b) => b.turnNumber - a.turnNumber);

    if (recentEntities.length > 0) {
      summary += '\n\n**Recently Mentioned:**\n';
      recentEntities.forEach(entity => {
        summary += `- ${entity.type}: "${entity.value}" (Turn ${entity.turnNumber})\n`;
        if (entity.aliases.length > 0) {
          summary += `  Pronouns referring to this: ${entity.aliases.join(', ')}\n`;
        }
      });
    }

    // Add active lists
    if (this.lists.size > 0) {
      const recentList = Array.from(this.lists.values())
        .sort((a, b) => b.turnNumber - a.turnNumber)[0];

      if (recentList) {
        summary += '\n\n**Active Numbered List (Most Recent):**\n';
        recentList.items.forEach(item => {
          summary += `- Item ${item.position}: ${item.name}\n`;
        });
        summary += '\n**When user says "item 2" or "the second one", refer to this list.**\n';
      }
    }

    return summary;
  }

  /**
   * Increment turn counter
   */
  incrementTurn(): void {
    this.currentTurn++;
  }

  /**
   * Get current turn number
   */
  getCurrentTurn(): number {
    return this.currentTurn;
  }

  /**
   * Serialize to JSON string
   */
  serialize(): string {
    return JSON.stringify({
      entities: Array.from(this.entities.entries()),
      corrections: this.corrections,
      lists: Array.from(this.lists.entries()),
      currentTurn: this.currentTurn
    });
  }

  /**
   * Deserialize from JSON string
   * Returns a new instance or fresh instance on error
   *
   * @param data - JSON string from serialize()
   * @returns ConversationMetadataManager instance
   */
  static deserialize(data: string): ConversationMetadataManager {
    try {
      const parsed = JSON.parse(data);
      const manager = new ConversationMetadataManager();

      // Validate parsed data structure
      if (parsed.entities && Array.isArray(parsed.entities)) {
        manager.entities = new Map(parsed.entities);
      }
      if (parsed.corrections && Array.isArray(parsed.corrections)) {
        manager.corrections = parsed.corrections;
      }
      if (parsed.lists && Array.isArray(parsed.lists)) {
        manager.lists = new Map(parsed.lists);
      }
      if (typeof parsed.currentTurn === 'number') {
        manager.currentTurn = parsed.currentTurn;
      }

      return manager;
    } catch (error) {
      console.error('[ConversationMetadataManager] Deserialization error:', error);
      // Return fresh instance on error to prevent crashes
      return new ConversationMetadataManager();
    }
  }
}
