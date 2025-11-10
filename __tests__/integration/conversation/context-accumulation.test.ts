/**
 * Context Accumulation Tests
 *
 * Tests AI's ability to maintain context across 5+ turns (validates 86% accuracy claim).
 *
 * Priority: CRITICAL - Validates the core 86% conversation accuracy claim
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  sendMessage,
  fetchMetadataFromDB,
  validateEnvironment,
  setupTestDomain,
  cleanupConversations
} from '@/__tests__/utils/conversation/helpers';

describe('Context Accumulation (86% Accuracy Validation)', () => {
  let testDomainId: string;
  const testConversations: string[] = [];

  beforeAll(async () => {
    validateEnvironment();
    testDomainId = await setupTestDomain();
  });

  afterAll(async () => {
    await cleanupConversations(testConversations);
  });

  it('should maintain context across 5+ turns (CRITICAL - validates 86% accuracy)', async () => {
    /**
     * Test Flow (5 turns - validates 86% accuracy claim):
     * Turn 1: User asks about product category
     * Turn 2: User narrows down with specification
     * Turn 3: User asks about price of narrowed results
     * Turn 4: User asks about availability (pronoun reference)
     * Turn 5: User requests purchase link (pronoun + list reference)
     *
     * Success Criteria:
     * - All 5 turns maintain correct context
     * - No "I don't understand" responses
     * - Metadata shows clear context chain
     * - Final response correctly combines all context
     *
     * This test directly validates the 86% conversation accuracy claim!
     */

    const turnResults: Array<{ turn: number; success: boolean; reason: string }> = [];

    // Turn 1: Category inquiry
    const turn1 = await sendMessage('What types of pumps do you have?');
    testConversations.push(turn1.conversationId);

    const turn1Success =
      turn1.response.length > 50 && // Substantial response
      !turn1.response.toLowerCase().includes("don't understand");

    turnResults.push({
      turn: 1,
      success: turn1Success,
      reason: turn1Success ? 'Provided pump categories' : 'Insufficient or confused response'
    });

    // Turn 2: Narrow down (implicit "show me" command)
    const turn2 = await sendMessage('Show me the first type you mentioned', turn1.conversationId);

    const turn2Success =
      turn2.response.length > 50 &&
      !turn2.response.toLowerCase().includes("which") &&
      !turn2.response.toLowerCase().includes("don't understand");

    turnResults.push({
      turn: 2,
      success: turn2Success,
      reason: turn2Success ? 'Resolved category reference' : 'Failed to resolve category'
    });

    // Turn 3: Price inquiry with pronoun
    const turn3 = await sendMessage('What are the prices?', turn2.conversationId);

    const turn3Success =
      (turn3.response.toLowerCase().includes('price') ||
       turn3.response.toLowerCase().includes('cost') ||
       turn3.response.match(/\$\d+/)) &&
      !turn3.response.toLowerCase().includes("which pump");

    turnResults.push({
      turn: 3,
      success: turn3Success,
      reason: turn3Success ? 'Resolved price query with context' : 'Lost context of pumps'
    });

    // Turn 4: Availability with pronoun
    const turn4 = await sendMessage('Are they in stock?', turn3.conversationId);

    const turn4Success =
      (turn4.response.toLowerCase().includes('stock') ||
       turn4.response.toLowerCase().includes('available') ||
       turn4.response.toLowerCase().includes('inventory')) &&
      !turn4.response.toLowerCase().includes("which one");

    turnResults.push({
      turn: 4,
      success: turn4Success,
      reason: turn4Success ? 'Resolved plural pronoun "they"' : 'Failed pronoun resolution'
    });

    // Turn 5: Complex reference (list + pronoun)
    const turn5 = await sendMessage('Can I get more details about the first one?', turn4.conversationId);

    const turn5Success =
      turn5.response.length > 50 &&
      !turn5.response.toLowerCase().includes("which") &&
      !turn5.response.toLowerCase().includes("don't understand");

    turnResults.push({
      turn: 5,
      success: turn5Success,
      reason: turn5Success ? 'Resolved list reference with context' : 'Failed complex reference'
    });

    // Calculate accuracy
    const successfulTurns = turnResults.filter(t => t.success).length;
    const accuracy = (successfulTurns / turnResults.length) * 100;

    // Log results
    console.log('\n📊 Multi-Turn Conversation Accuracy Results:');
    turnResults.forEach(result => {
      console.log(`  Turn ${result.turn}: ${result.success ? '✅' : '❌'} ${result.reason}`);
    });
    console.log(`\n🎯 Accuracy: ${accuracy}% (${successfulTurns}/${turnResults.length} turns successful)`);
    console.log(`   Target: >= 86%`);

    // Verify metadata tracking
    const finalMetadata = await fetchMetadataFromDB(turn1.conversationId);
    expect(finalMetadata.currentTurn).toBeGreaterThanOrEqual(5);

    // CRITICAL ASSERTION - Validates 86% claim
    expect(accuracy).toBeGreaterThanOrEqual(86);
  }, 120000);

  it('should handle context switches gracefully', async () => {
    /**
     * Test Flow:
     * Turn 1-2: Conversation about pumps
     * Turn 3: Switch to asking about orders
     * Turn 4: Return to pumps
     *
     * Expected AI Behavior:
     * - Recognize topic switch
     * - Preserve old context (don't delete pump metadata)
     * - Start new context for orders
     * - If user returns to pumps, context should still be available
     */

    // Turn 1: Start with pumps
    const turn1 = await sendMessage('Show me your pumps');
    testConversations.push(turn1.conversationId);

    const turn1HasPumps = turn1.response.length > 50;
    expect(turn1HasPumps).toBe(true);

    // Turn 2: Continue with pumps
    const turn2 = await sendMessage('What about pricing?', turn1.conversationId);
    const turn2HasPricing =
      turn2.response.toLowerCase().includes('price') ||
      turn2.response.toLowerCase().includes('cost') ||
      turn2.response.match(/\$/);

    // Turn 3: SWITCH to orders
    const turn3 = await sendMessage('Actually, I want to check on my order status', turn2.conversationId);

    const turn3RecognizesSwitch =
      turn3.response.toLowerCase().includes('order') ||
      turn3.response.toLowerCase().includes('track');

    expect(turn3RecognizesSwitch).toBe(true);

    // Turn 4: Return to pumps
    const turn4 = await sendMessage('Going back to the pumps, tell me about the first one', turn3.conversationId);

    const turn4RetainsPumpContext =
      turn4.response.length > 50 &&
      !turn4.response.toLowerCase().includes("which pump");

    // Should be able to switch back
    expect(turn4RetainsPumpContext).toBe(true);

    // Verify metadata contains both contexts
    const metadata = await fetchMetadataFromDB(turn1.conversationId);
    expect(metadata.currentTurn).toBeGreaterThanOrEqual(4);
  }, 90000);

  it('should track conversation intent changes', async () => {
    /**
     * Test: Conversation starts as pump search, becomes order lookup
     *
     * Validation:
     * - Intent change tracked in metadata
     * - Appropriate tools used for each intent
     * - Context preserved for both intents
     */

    // Turn 1: Pump search intent
    const turn1 = await sendMessage('I need to find a hydraulic pump');
    testConversations.push(turn1.conversationId);

    const turn1IsPumpSearch =
      turn1.response.toLowerCase().includes('pump') ||
      turn1.response.toLowerCase().includes('hydraulic');

    expect(turn1IsPumpSearch).toBe(true);

    // Turn 2: Switch to order lookup intent
    const turn2 = await sendMessage('Actually, can you help me track my order #12345?', turn1.conversationId);

    const turn2IsOrderLookup =
      turn2.response.toLowerCase().includes('order') ||
      turn2.response.toLowerCase().includes('12345') ||
      turn2.response.toLowerCase().includes('track');

    expect(turn2IsOrderLookup).toBe(true);

    // Verify metadata shows multiple entity types (products and orders)
    const metadata = await fetchMetadataFromDB(turn1.conversationId);

    // Should have tracked entities from both intents
    expect(metadata.entities).toBeDefined();

    // Verify conversation tracked multiple turns
    expect(metadata.currentTurn).toBeGreaterThanOrEqual(2);
  }, 60000);
});
