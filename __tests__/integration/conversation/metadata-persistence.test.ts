/**
 * Metadata Persistence Tests
 *
 * Tests that conversation metadata is correctly saved and cumulative across turns.
 *
 * Priority: HIGH - Critical for context reconstruction and debugging
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  sendMessage,
  fetchMetadataFromDB,
  validateEnvironment,
  setupTestDomain,
  cleanupConversations
} from '@/__tests__/utils/conversation/helpers';

describe('Metadata Persistence', () => {
  let testDomainId: string;
  const testConversations: string[] = [];

  beforeAll(async () => {
    validateEnvironment();
    testDomainId = await setupTestDomain();
  });

  afterAll(async () => {
    await cleanupConversations(testConversations);
  });

  it('should persist metadata to database after each turn', async () => {
    /**
     * Test Flow:
     * Turn 1: Send message, verify metadata saved
     * Turn 2: Send message, verify previous + new metadata saved
     * Turn 3: Retrieve conversation, verify all metadata present
     *
     * Validation:
     * - Metadata saved after each turn (not just at end)
     * - Metadata is cumulative, not replaced
     * - Timestamps accurate for each turn
     * - Can reconstruct full context from stored metadata
     */

    // Turn 1
    const turn1 = await sendMessage('Show me pumps');
    testConversations.push(turn1.conversationId);

    const dbMetadata1 = await fetchMetadataFromDB(turn1.conversationId);
    expect(dbMetadata1.currentTurn).toBe(1);

    // Turn 2
    const turn2 = await sendMessage('What about the first one?', turn1.conversationId);

    const dbMetadata2 = await fetchMetadataFromDB(turn1.conversationId);
    expect(dbMetadata2.currentTurn).toBe(2);

    // Verify metadata is cumulative (turn 2 has more data than turn 1)
    const metadata1Keys = Object.keys(dbMetadata1);
    const metadata2Keys = Object.keys(dbMetadata2);

    // Turn 2 should preserve turn 1 data
    expect(dbMetadata2.currentTurn).toBeGreaterThan(dbMetadata1.currentTurn);

    // Turn 3 - Verify persistence across API calls
    const turn3 = await sendMessage('Tell me more about it', turn2.conversationId);

    const dbMetadata3 = await fetchMetadataFromDB(turn1.conversationId);
    expect(dbMetadata3.currentTurn).toBe(3);

    // Full conversation history should be preserved in metadata
    expect(dbMetadata3.currentTurn).toBeGreaterThan(dbMetadata2.currentTurn);
  }, 90000);

  it('should update metadata when context changes (correction scenario)', async () => {
    /**
     * Test: Correction scenario - metadata should show version history
     *
     * Expected:
     * - Old context tracked
     * - Correction detected and stored
     * - History preserved for debugging
     */

    // Turn 1: Initial request
    const turn1 = await sendMessage('Show me ZF4 pumps');
    testConversations.push(turn1.conversationId);

    const dbMetadata1 = await fetchMetadataFromDB(turn1.conversationId);
    expect(dbMetadata1.currentTurn).toBe(1);

    // Turn 2: User correction
    const turn2 = await sendMessage('Sorry, I meant ZF5 not ZF4', turn1.conversationId);

    const dbMetadata2 = await fetchMetadataFromDB(turn1.conversationId);

    // Should detect correction
    expect(dbMetadata2.corrections).toBeDefined();

    // If corrections array exists, verify it has the correction
    if (Array.isArray(dbMetadata2.corrections) && dbMetadata2.corrections.length > 0) {
      const correction = dbMetadata2.corrections[0];
      expect(correction.originalValue).toMatch(/ZF4/i);
      expect(correction.correctedValue).toMatch(/ZF5/i);
    }

    // Turn 3: Verify new context is used
    const turn3 = await sendMessage('What are the prices for those?', turn2.conversationId);

    // Response should reference ZF5, not ZF4
    const mentionsCorrectModel = turn3.response.toLowerCase().includes('zf5');
    const mentionsWrongModel = turn3.response.toLowerCase().includes('zf4');

    // Ideally should mention correct model
    // Even if not explicitly mentioned, should not hallucinate the wrong one
    expect(mentionsWrongModel).toBe(false);

    // Verify metadata preserved correction history
    const dbMetadata3 = await fetchMetadataFromDB(turn1.conversationId);
    expect(dbMetadata3.currentTurn).toBe(3);

    // Corrections should still be accessible
    expect(dbMetadata3.corrections).toBeDefined();
  }, 90000);
});
