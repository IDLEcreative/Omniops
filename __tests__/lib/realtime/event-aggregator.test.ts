import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  getActiveSessionsCount,
  getMessagesPerMinute,
  getResponseTimes,
  getUserEngagementMetrics,
  getRecentActivityFeed,
  getAggregatedMetrics
} from '@/lib/realtime/event-aggregator';
import { createServerClient } from '@supabase/ssr';

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn()
}));

describe('Event Aggregator', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabaseClient = {
      from: jest.fn()
    };

    (createServerClient as jest.MockedFunction<typeof createServerClient>)
      .mockReturnValue(mockSupabaseClient as any);

    // Set required env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
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
            not: jest.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      });

      const count = await getActiveSessionsCount();

      expect(count).toBe(3); // 3 unique sessions
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('analytics_events');
    });

    it('should return 0 on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
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
            gte: jest.fn().mockResolvedValue({
              count: 42,
              error: null
            })
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
            gte: jest.fn().mockResolvedValue({
              count: null,
              error: null
            })
          })
        })
      });

      const count = await getMessagesPerMinute();

      expect(count).toBe(0);
    });
  });

  describe('getResponseTimes', () => {
    it('should calculate percentiles from response data', async () => {
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        data: { response_time_ms: (i + 1) * 10 } // 10, 20, 30, ..., 1000
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              not: jest.fn().mockResolvedValue({
                data: mockData,
                error: null
              })
            })
          })
        })
      });

      const metrics = await getResponseTimes();

      expect(metrics).toEqual({
        p50: 500, // 50th element = 500ms
        p95: 950, // 95th element = 950ms
        p99: 990  // 99th element = 990ms
      });
    });

    it('should return zeros when no data', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              not: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      });

      const metrics = await getResponseTimes();

      expect(metrics).toEqual({
        p50: 0,
        p95: 0,
        p99: 0
      });
    });
  });

  describe('getUserEngagementMetrics', () => {
    it('should calculate session metrics correctly', async () => {
      const now = new Date();
      const mockData = [
        // Session 1: Complete with 3 messages
        {
          session_id: 'session-1',
          event_type: 'session_started',
          created_at: new Date(now.getTime() - 300000).toISOString() // 5 min ago
        },
        { session_id: 'session-1', event_type: 'message_sent', created_at: now.toISOString() },
        { session_id: 'session-1', event_type: 'message_sent', created_at: now.toISOString() },
        { session_id: 'session-1', event_type: 'message_sent', created_at: now.toISOString() },
        {
          session_id: 'session-1',
          event_type: 'session_ended',
          created_at: new Date(now.getTime() - 60000).toISOString() // 1 min ago
        },
        // Session 2: Incomplete with 2 messages
        {
          session_id: 'session-2',
          event_type: 'session_started',
          created_at: new Date(now.getTime() - 120000).toISOString() // 2 min ago
        },
        { session_id: 'session-2', event_type: 'message_sent', created_at: now.toISOString() },
        { session_id: 'session-2', event_type: 'message_sent', created_at: now.toISOString() }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockData,
                error: null
              })
            })
          })
        })
      });

      const metrics = await getUserEngagementMetrics();

      expect(metrics.activeCount).toBe(2); // 2 sessions
      expect(metrics.avgDuration).toBe(240000); // 4 minutes for completed session
      expect(metrics.avgMessageCount).toBe(2.5); // 5 messages / 2 sessions
    });

    it('should handle empty data gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
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
            limit: jest.fn().mockResolvedValue({
              data: mockActivities,
              error: null
            })
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
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query error' }
            })
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
      // Mock all individual metric functions
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
                gte: jest.fn().mockResolvedValue({
                  count: 10,
                  error: null
                })
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
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
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