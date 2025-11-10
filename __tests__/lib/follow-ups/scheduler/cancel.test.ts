/**
 * Tests for Follow-up Scheduler - Cancellation Operations
 *
 * Validates cancellation of pending follow-up messages:
 * - Cancelling follow-ups for a conversation
 * - Only cancelling pending (not sent) messages
 * - Handling empty cancellations
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cancelFollowUps } from '@/lib/follow-ups/scheduler';
import {
  createMockSupabase,
  mockSupabaseForCancellation,
} from '__tests__/utils/follow-ups/test-helpers';

describe('cancelFollowUps', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should cancel pending follow-ups for a conversation', async () => {
    mockSupabase.from.mockImplementation(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: 3 }),
      }),
    } as any));

    const cancelled = await cancelFollowUps(mockSupabase, 'conv-1');

    expect(cancelled).toBe(3);
    expect(mockSupabase.from).toHaveBeenCalledWith('follow_up_messages');
  });

  it('should only cancel pending messages, not sent ones', async () => {
    const eqCalls: Array<{ field: string; value: any }> = [];

    mockSupabaseForCancellation(mockSupabase, [
      (field, value) => eqCalls.push({ field, value }),
      (field, value) => eqCalls.push({ field, value }),
    ]);

    await cancelFollowUps(mockSupabase, 'conv-1');

    expect(eqCalls).toContainEqual({ field: 'conversation_id', value: 'conv-1' });
    expect(eqCalls).toContainEqual({ field: 'status', value: 'pending' });
  });

  it('should return 0 if no messages to cancel', async () => {
    mockSupabase.from.mockImplementation(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: null }),
      }),
    } as any));

    const cancelled = await cancelFollowUps(mockSupabase, 'conv-1');

    expect(cancelled).toBe(0);
  });
});
