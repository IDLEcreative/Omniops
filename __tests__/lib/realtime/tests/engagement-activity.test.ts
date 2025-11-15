/**
 * Tests for user engagement and activity feed metrics
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  getUserEngagementMetrics,
  getRecentActivityFeed,
  getAggregatedMetrics
} from '@/lib/realtime/event-aggregator';
import { createServerClient } from '@supabase/ssr';
import { mockSupabaseClient, setupMocks } from './setup';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn()
}));

describe('Event Aggregator - Engagement & Activity', () => {
  beforeEach(() => {
    setupMocks();
  });

  describe('getUserEngagementMetrics', () => {
    it('should calculate session metrics correctly', async () => {
      const now = new Date();
      const mockData = [
        {
          session_id: 'session-1',
          event_type: 'session_started',
          created_at: new Date(now.getTime() - 300000).toISOString()
        },
        { session_id: 'session-1', event_type: 'message_sent', created_at: now.toISOString() },
        { session_id: 'session-1', event_type: 'message_sent', created_at: now.toISOString() },
        { session_id: 'session-1', event_type: 'message_sent', created_at: now.toISOString() },
        {
          session_id: 'session-1',
          event_type: 'session_ended',
          created_at: new Date(now.getTime() - 60000).toISOString()
        },
        {
          session_id: 'session-2',
          event_type: 'session_started',
          created_at: new Date(now.getTime() - 120000).toISOString()
        },
        { session_id: 'session-2', event_type: 'message_sent', created_at: now.toISOString() },
        { session_id: 'session-2', event_type: 'message_sent', created_at: now.toISOString() }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockData, error: null })
            })
          })
        })
      });

      const metrics = await getUserEngagementMetrics();

      expect(metrics.activeCount).toBe(2);
      expect(metrics.avgDuration).toBe(240000);
      expect(metrics.avgMessageCount).toBe(2.5);
    });

    it('should handle empty data gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      });

      const metrics = await getUserEngagementMetrics();

      expect(metrics).toEqual({
        activeCount: 0,
        avgDuration: 0,
        avgMessageCount: 0
      });
    });
  });

  describe('getRecentActivityFeed', () => {
    it('should fetch recent activities with limit', async () => {
      const mockActivities = [
        { id: '1', event_type: 'session_started', created_at: new Date() },
        { id: '2', event_type: 'message_sent', created_at: new Date() }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockActivities, error: null })
          })
        })
      });

      const activities = await getRecentActivityFeed(10);

      expect(activities).toEqual(mockActivities);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('analytics_events');
    });

    it('should return empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'Query error' } })
          })
        })
      });

      const activities = await getRecentActivityFeed();

      expect(activities).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAggregatedMetrics', () => {
    it('should aggregate all metrics in parallel', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'analytics_events') {
          return {
            select: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                not: jest.fn().mockResolvedValue({
                  data: [{ session_id: 'test-session' }],
                  error: null
                })
              }),
              in: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ count: 10, error: null })
              }),
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  not: jest.fn().mockResolvedValue({
                    data: [{ data: { response_time_ms: 100 } }],
                    error: null
                  })
                })
              }),
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null })
              })
            })
          };
        }
        return mockSupabaseClient.from(table);
      });

      const metrics = await getAggregatedMetrics();

      expect(metrics).toHaveProperty('activeSessions');
      expect(metrics).toHaveProperty('messagesPerMinute');
      expect(metrics).toHaveProperty('responseTimes');
      expect(metrics).toHaveProperty('engagement');
      expect(metrics).toHaveProperty('activityFeed');
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics.timestamp).toBeGreaterThan(0);
    });
  });
});
