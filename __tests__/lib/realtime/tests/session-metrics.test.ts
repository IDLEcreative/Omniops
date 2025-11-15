/**
 * Tests for active sessions and messages per minute metrics
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getActiveSessionsCount, getMessagesPerMinute } from '@/lib/realtime/event-aggregator';
import { createServerClient } from '@supabase/ssr';
import { mockSupabaseClient, setupMocks } from './setup';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn()
}));

describe('Event Aggregator - Session Metrics', () => {
  beforeEach(() => {
    setupMocks();
  });

  describe('getActiveSessionsCount', () => {
    it('should count unique active sessions from last 5 minutes', async () => {
      const mockData = [
        { session_id: 'session-1' },
        { session_id: 'session-2' },
        { session_id: 'session-1' }, // Duplicate
        { session_id: 'session-3' }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      });

      const count = await getActiveSessionsCount();

      expect(count).toBe(3);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('analytics_events');
    });

    it('should return 0 on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          })
        })
      });

      const count = await getActiveSessionsCount();

      expect(count).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getMessagesPerMinute', () => {
    it('should count messages from last minute', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ count: 42, error: null })
          })
        })
      });

      const count = await getMessagesPerMinute();

      expect(count).toBe(42);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('analytics_events');
    });

    it('should return 0 when no messages', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ count: null, error: null })
          })
        })
      });

      const count = await getMessagesPerMinute();

      expect(count).toBe(0);
    });
  });
});
