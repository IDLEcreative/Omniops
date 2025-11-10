/**
 * Tests for Follow-up Scheduler - Message Sending Operations
 *
 * Validates sending of follow-up messages via channel handlers.
 * Tests email and in-app notification sending behavior.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail, sendInAppNotification } from '@/lib/follow-ups/scheduler';
import { createMockSupabase } from '__tests__/utils/follow-ups/test-helpers';

describe('Follow-up Message Sending', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('sendEmail', () => {
    it('should log email send attempt', async () => {
      const emailData = {
        recipient: 'user@example.com',
        subject: 'Follow-up',
        content: 'Message content',
      };

      await sendEmail(emailData);

      // sendEmail logs to console and returns void
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[FollowUpScheduler] Would send email:',
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Follow-up',
        })
      );
    });
  });

  describe('sendInAppNotification', () => {
    it('should insert notification into database', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      } as any);

      const notificationData = {
        session_id: 'session-1',
        subject: 'Need help?',
        content: 'Continue conversation?',
        conversation_id: 'conv-1',
        reason: 'abandoned_conversation',
      };

      await sendInAppNotification(mockSupabase, notificationData);

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'session-1',
          type: 'follow_up',
          title: 'Need help?',
          message: 'Continue conversation?',
        })
      );
    });
  });
});
