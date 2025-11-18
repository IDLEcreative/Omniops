/**
 * Tests for user engagement and activity feed metrics
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Create mock client BEFORE anything else
const mockSupabaseClient = {
  from: jest.fn()
};

// Create mock function BEFORE jest.mock call
const mockCreateServiceRoleClientSync = jest.fn(() => mockSupabaseClient);

// Mock MUST be before imports of the module being tested
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClientSync: mockCreateServiceRoleClientSync
}));

import {
  getUserEngagementMetrics,
  getRecentActivityFeed,
  getAggregatedMetrics
} from '@/lib/realtime/event-aggregator';

// Setup function to reset mocks between tests
function setupMocks() {
  jest.clearAllMocks();
  mockSupabaseClient.from.mockReset();
  mockCreateServiceRoleClientSync.mockReturnValue(mockSupabaseClient);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  return mockSupabaseClient;
}

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
      const now = new Date();

      // Create a comprehensive mock that handles all different query patterns
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'analytics_events') {
          return {
            select: jest.fn().mockImplementation((columns: string, options?: any) => {
              // For getMessagesPerMinute (count query)
              if (options?.count === 'exact') {
                return {
                  in: jest.fn().mockReturnValue({
                    gte: jest.fn().mockResolvedValue({ count: 5, error: null })
                  })
                };
              }

              // Default select query handler
              return {
                // For getActiveSessionsCount: .gte().not()
                gte: jest.fn().mockReturnValue({
                  not: jest.fn().mockResolvedValue({
                    data: [
                      { session_id: 'session-1' },
                      { session_id: 'session-2' }
                    ],
                    error: null
                  })
                }),
                // For getUserEngagementMetrics: .in().gte().order()
                in: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [
                        {
                          session_id: 'session-1',
                          event_type: 'session_started',
                          created_at: new Date(now.getTime() - 300000).toISOString()
                        },
                        {
                          session_id: 'session-1',
                          event_type: 'message_sent',
                          created_at: now.toISOString()
                        },
                        {
                          session_id: 'session-1',
                          event_type: 'session_ended',
                          created_at: new Date(now.getTime() - 60000).toISOString()
                        }
                      ],
                      error: null
                    })
                  })
                }),
                // For getResponseTimes: .eq().gte().not()
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    not: jest.fn().mockResolvedValue({
                      data: [
                        { data: { response_time_ms: 100 } },
                        { data: { response_time_ms: 200 } },
                        { data: { response_time_ms: 300 } }
                      ],
                      error: null
                    })
                  })
                }),
                // For getRecentActivityFeed: .order().limit()
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      { id: '1', event_type: 'message_sent', created_at: now.toISOString() }
                    ],
                    error: null
                  })
                })
              };
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

      // Verify actual values
      expect(metrics.activeSessions).toBe(2);
      expect(metrics.messagesPerMinute).toBe(5);
      expect(metrics.engagement.activeCount).toBe(1);
      expect(Array.isArray(metrics.activityFeed)).toBe(true);
    });
  });
});
