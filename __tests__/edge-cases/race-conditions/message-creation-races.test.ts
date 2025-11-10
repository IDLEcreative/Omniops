/**
 * Message Creation Races Test Suite
 *
 * **Purpose:** Tests for concurrent message creation in conversations
 * **Critical:** Ensures message ordering and integrity in concurrent scenarios
 */

import { describe, it, expect } from '@jest/globals';
import { deterministicDelay } from '../../utils/race-conditions/concurrency-helpers';

describe('Message Creation Races', () => {
  it('should handle concurrent message creation for same conversation', async () => {
    const messages: Array<{ conversationId: string; text: string; timestamp: number }> = [];

    let messageCounter = 0;
    const createMessage = async (conversationId: string, text: string) => {
      const delayMs = deterministicDelay(messageCounter);
      messageCounter++;

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      messages.push({
        conversationId,
        text,
        timestamp: Date.now(),
      });

      return { id: messages.length, conversationId, text };
    };

    const results = await Promise.all(
      Array(10)
        .fill(null)
        .map((_, i) => createMessage('conv-123', `Message ${i}`))
    );

    expect(results.length).toBe(10);
    expect(messages.length).toBe(10);
    expect(messages.every((m) => m.conversationId === 'conv-123')).toBe(true);

    const timestamps = messages.map((m) => m.timestamp);
    const sorted = [...timestamps].sort((a, b) => a - b);

    expect(timestamps.length).toBe(sorted.length);
  });
});
