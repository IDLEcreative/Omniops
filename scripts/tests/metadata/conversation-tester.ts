/**
 * Conversation Testing Helper
 * Simulates real conversation flows for metadata tracking validation
 */

import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';
import { ResponseParser } from '../../../lib/chat/response-parser';

export class ConversationTester {
  private manager: ConversationMetadataManager;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor() {
    this.manager = new ConversationMetadataManager();
  }

  async sendMessage(userMessage: string, aiResponse: string): Promise<void> {
    this.manager.incrementTurn();
    this.conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    );

    // Parse and track entities (simulating real chat flow)
    const currentTurn = this.manager.getCurrentTurn();
    const parsed = ResponseParser.parseResponse(userMessage, aiResponse, currentTurn);

    // Track entities
    parsed.entities.forEach(entity => this.manager.trackEntity(entity));

    // Track corrections
    parsed.corrections.forEach(correction => {
      this.manager.trackCorrection(
        correction.original,
        correction.corrected,
        userMessage
      );
    });

    // Track lists
    parsed.lists.forEach(list => this.manager.trackList(list.items));
  }

  getMetadataManager(): ConversationMetadataManager {
    return this.manager;
  }

  getContextSummary(): string {
    return this.manager.generateContextSummary();
  }

  reset(): void {
    this.manager = new ConversationMetadataManager();
    this.conversationHistory = [];
  }
}

export function extractNumberedList(text: string): Array<{ position: number; name: string; url?: string }> {
  const items: Array<{ position: number; name: string; url?: string }> = [];
  const listPattern = /(?:^|\n)[\s]*(?:\d+\.)\s*\[([^\]]+)\]\(([^)]+)\)/gm;
  let match;
  let position = 1;

  while ((match = listPattern.exec(text)) !== null) {
    items.push({
      position: position++,
      name: match[1].trim(),
      url: match[2].trim()
    });
  }

  return items;
}
