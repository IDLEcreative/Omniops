/**
 * Follow-up Detection Tests
 *
 * Tests for detectFollowUpCandidates function covering:
 * - Abandoned conversations
 * - Low satisfaction detection
 * - Cart abandonment detection
 * - Max follow-up enforcement
 * - Email extraction
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { detectFollowUpCandidates } from '@/lib/follow-ups/detector';
import {
  setupMockSupabase,
  createAbandonedConversation,
  createLowSatisfactionConversation,
  createCartAbandonmentConversation,
  createCompletedCheckoutConversation,
  createTooFewMessagesConversation,
  createNestedEmailConversation,
  createDirectEmailConversation,
  createHighSatisfactionConversation,
  createConversationWithAttempts,
} from '@/__tests__/utils/follow-ups/mock-helpers';

describe('detectFollowUpCandidates', () => {
  let mockSupabase: ReturnType<typeof setupMockSupabase>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect abandoned conversations with user\'s last message', async () => {
    const conversation = createAbandonedConversation();
    mockSupabase = setupMockSupabase([conversation]);

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1'], {
      abandonmentThresholdMinutes: 30,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      conversation_id: 'conv-1',
      session_id: 'session-1',
      reason: 'abandoned_conversation',
      priority: 'medium',
      metadata: {
        last_message_at: '2024-01-01T10:30:00Z',
        message_count: 2,
        customer_email: 'user@example.com',
      },
    });
  });

  it('should skip conversations with too few messages', async () => {
    const conversation = createTooFewMessagesConversation();
    mockSupabase = setupMockSupabase([conversation]);

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1'], {
      minMessagesForFollowUp: 2,
    });

    expect(candidates).toHaveLength(0);
  });

  it('should detect low satisfaction conversations', async () => {
    const conversation = createLowSatisfactionConversation();
    mockSupabase = setupMockSupabase([conversation], 0, { splitDataByQueryPath: true });

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1'], {
      lowSatisfactionThreshold: 40,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      conversation_id: 'conv-2',
      reason: 'low_satisfaction',
      priority: 'high',
      metadata: expect.objectContaining({
        sentiment_score: expect.any(Number),
        customer_email: 'angry@example.com',
      }),
    });
    expect(candidates[0].metadata.sentiment_score).toBeLessThan(40);
  });

  it('should detect cart abandonment from session metadata', async () => {
    const conversation = createCartAbandonmentConversation();
    mockSupabase = setupMockSupabase([conversation]);

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1']);

    const cartCandidate = candidates.find((c) => c.reason === 'cart_abandonment');
    expect(cartCandidate).toBeDefined();
    expect(cartCandidate).toMatchObject({
      conversation_id: 'conv-3',
      reason: 'cart_abandonment',
      priority: 'high',
      metadata: expect.objectContaining({
        has_cart_activity: true,
        customer_email: 'shopper@example.com',
      }),
    });
  });

  it('should not detect cart abandonment if checkout completed', async () => {
    const conversation = createCompletedCheckoutConversation();
    mockSupabase = setupMockSupabase([conversation]);

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1']);

    expect(candidates.find((c) => c.reason === 'cart_abandonment')).toBeUndefined();
  });

  it('should enforce max follow-up attempts', async () => {
    const conversation = createConversationWithAttempts();
    mockSupabase = setupMockSupabase([conversation], 2); // Already sent 2

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1'], {
      maxFollowUpAttempts: 2,
    });

    expect(candidates).toHaveLength(0);
  });

  it('should extract email from nested metadata', async () => {
    const conv1 = createNestedEmailConversation();
    const conv2 = createDirectEmailConversation();
    mockSupabase = setupMockSupabase([conv1, conv2]);

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1']);

    expect(candidates[0].metadata.customer_email).toBe('nested@example.com');
    expect(candidates[1].metadata.customer_email).toBe('direct@example.com');
  });

  it('should handle empty results gracefully', async () => {
    mockSupabase = setupMockSupabase([]);

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1']);

    expect(candidates).toEqual([]);
  });

  it('should not detect low satisfaction with positive sentiment', async () => {
    const conversation = createHighSatisfactionConversation();
    mockSupabase = setupMockSupabase([conversation], 0, { splitDataByQueryPath: true });

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1'], {
      lowSatisfactionThreshold: 40,
    });

    expect(candidates.find((c) => c.reason === 'low_satisfaction')).toBeUndefined();
  });
});
