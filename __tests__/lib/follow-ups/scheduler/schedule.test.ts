/**
 * Tests for Follow-up Scheduler - Scheduling Operations
 *
 * Validates scheduling of automated follow-up messages:
 * - Message scheduling for candidates
 * - Content generation per reason
 * - Channel handling (email, in-app)
 * - Delay minute options
 * - Database error handling
 * - Metadata inclusion
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  scheduleFollowUps,
  type ScheduleOptions,
} from '@/lib/follow-ups/scheduler';
import {
  createMockSupabase,
  MOCK_CANDIDATES,
  CANDIDATE_WITHOUT_EMAIL,
  mockSupabaseForScheduling,
} from '__tests__/utils/follow-ups/test-helpers';

describe('scheduleFollowUps', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should schedule follow-ups for candidates with emails', async () => {
    mockSupabaseForScheduling(mockSupabase);

    const result = await scheduleFollowUps(mockSupabase, MOCK_CANDIDATES);

    expect(result.scheduled).toBe(2);
    expect(result.skipped).toBe(0);
    expect(mockSupabase.from).toHaveBeenCalledWith('follow_up_messages');
    expect(mockSupabase.from).toHaveBeenCalledWith('follow_up_logs');
  });

  it('should skip candidates without email for email channel', async () => {
    mockSupabaseForScheduling(mockSupabase);

    const result = await scheduleFollowUps(
      mockSupabase,
      CANDIDATE_WITHOUT_EMAIL,
      { channel: 'email' }
    );

    expect(result.scheduled).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('should generate appropriate message content for each reason', async () => {
    const insertCalls: any[] = [];
    mockSupabaseForScheduling(mockSupabase, (data) => {
      insertCalls.push(data);
    });

    await scheduleFollowUps(mockSupabase, MOCK_CANDIDATES, {
      channel: 'email',
    });

    expect(insertCalls).toHaveLength(2);

    // Check abandoned conversation message
    expect(insertCalls[0].subject).toBe('Did you find what you were looking for?');
    expect(insertCalls[0].content).toContain('We noticed you were asking about something');

    // Check cart abandonment message
    expect(insertCalls[1].subject).toBe('You left something in your cart');
    expect(insertCalls[1].content).toContain('Your items are still waiting');
  });

  it('should respect delay minutes option', async () => {
    let insertedData: any;
    mockSupabaseForScheduling(mockSupabase, (data) => {
      insertedData = data;
    });

    const delayMinutes = 30;
    await scheduleFollowUps(mockSupabase, [MOCK_CANDIDATES[0]], {
      delayMinutes,
    });

    const scheduledTime = new Date(insertedData.scheduled_at);
    const now = new Date();
    const diffMinutes = (scheduledTime.getTime() - now.getTime()) / 60000;

    // Should be approximately 30 minutes in the future (allow small variance)
    expect(diffMinutes).toBeGreaterThan(29);
    expect(diffMinutes).toBeLessThan(31);
  });

  it('should handle database errors gracefully', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'follow_up_messages') {
        return {
          insert: jest.fn().mockResolvedValue({
            error: new Error('Database error'),
          }),
        } as any;
      }
      return {} as any;
    });

    const result = await scheduleFollowUps(mockSupabase, MOCK_CANDIDATES);

    expect(result.scheduled).toBe(0);
    expect(result.skipped).toBe(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[FollowUpScheduler] Failed to schedule:',
      expect.any(Error)
    );
  });

  it('should generate in-app messages with shorter content', async () => {
    const insertCalls: any[] = [];
    mockSupabaseForScheduling(mockSupabase, (data) => {
      insertCalls.push(data);
    });

    await scheduleFollowUps(mockSupabase, MOCK_CANDIDATES, {
      channel: 'in_app',
    });

    expect(insertCalls[0].subject).toBe('Need help?');
    expect(insertCalls[0].content).toContain('Would you like to continue');
    expect(insertCalls[0].recipient).toBe('user@example.com');
  });

  it('should include metadata in scheduled messages', async () => {
    let insertedData: any;
    mockSupabaseForScheduling(mockSupabase, (data) => {
      insertedData = data;
    });

    await scheduleFollowUps(mockSupabase, [MOCK_CANDIDATES[0]]);

    expect(insertedData.metadata).toEqual({
      priority: 'medium',
      detection_metadata: MOCK_CANDIDATES[0].metadata,
    });
  });
});
