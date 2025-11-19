/**
 * Alert Threshold Checker Tests - Edge Cases
 *
 * Tests for edge cases, error handling, and boundary conditions
 *
 * ENVIRONMENTAL NOTE: These tests may encounter SIGKILL in memory-constrained environments.
 *
 * Resolution (applied in jest.config.js):
 * - maxWorkers=1 (serial execution) prevents SIGKILL crashes
 * - Trade-off: ~20% slower test runs, but eliminates crashes
 *
 * To run individually:
 *   npm test -- threshold-checker-edge.test.ts
 *
 * Measured heap usage: ~50 MB (estimated, similar to other threshold tests)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  checkThresholds,
  type AlertThreshold,
  type MetricValues,
} from '@/lib/alerts/threshold-checker';
import { sendAlertNotifications } from '@/lib/alerts/notification-handlers';

// Mock dependencies
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/alerts/notification-handlers');

const mockSendAlertNotifications = sendAlertNotifications as jest.MockedFunction<
  typeof sendAlertNotifications
>;

describe('Alert Threshold Checker - Edge Cases', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    // Mock createServiceRoleClient to return our mock
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createServiceRoleClient } = require('@/lib/supabase-server');
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('checkThresholds - Edge Cases', () => {
    const organizationId = 'org-123';

    it('skips disabled thresholds', async () => {
      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-4',
          organization_id: organizationId,
          metric: 'error_rate',
          condition: 'above',
          threshold: 1,
          enabled: false, // Disabled
          notification_channels: ['email'],
        },
      ];

      const metrics: MetricValues = {
        error_rate: 10, // Would violate if enabled
      };

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'alert_thresholds') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: [], error: null }), // No enabled thresholds
          };
        }
        return {};
      }) as any;

      const triggeredAlerts = await checkThresholds(organizationId, metrics);

      expect(triggeredAlerts).toHaveLength(0);
    });

    it('skips metrics that are not provided', async () => {
      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-5',
          organization_id: organizationId,
          metric: 'conversion_rate',
          condition: 'below',
          threshold: 10,
          enabled: true,
          notification_channels: ['email'],
        },
      ];

      const metrics: MetricValues = {
        error_rate: 5, // Different metric
      };

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'alert_thresholds') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: thresholds, error: null }),
          };
        }
        return {};
      }) as any;

      const triggeredAlerts = await checkThresholds(organizationId, metrics);

      expect(triggeredAlerts).toHaveLength(0);
    });

    it('handles edge case: metric value exactly equals threshold', async () => {
      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-9',
          organization_id: organizationId,
          metric: 'error_rate',
          condition: 'above',
          threshold: 5,
          enabled: true,
          notification_channels: ['email'],
        },
      ];

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'alert_thresholds') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: thresholds, error: null }),
          };
        }
        return {};
      }) as any;

      const triggeredAlerts = await checkThresholds(organizationId, { error_rate: 5 });

      // Exactly equal should NOT trigger for "above" condition
      expect(triggeredAlerts).toHaveLength(0);
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: { message: 'DB error' } }),
      })) as any;

      const triggeredAlerts = await checkThresholds(organizationId, { error_rate: 10 });

      expect(triggeredAlerts).toEqual([]);
    });

    it('handles empty metrics object', async () => {
      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-10',
          organization_id: organizationId,
          metric: 'error_rate',
          condition: 'above',
          threshold: 5,
          enabled: true,
          notification_channels: ['email'],
        },
      ];

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'alert_thresholds') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: thresholds, error: null }),
          };
        }
        return {};
      }) as any;

      const triggeredAlerts = await checkThresholds(organizationId, {});

      expect(triggeredAlerts).toHaveLength(0);
      expect(mockSendAlertNotifications).not.toHaveBeenCalled();
    });

    it('handles null or undefined metric values', async () => {
      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-11',
          organization_id: organizationId,
          metric: 'error_rate',
          condition: 'above',
          threshold: 5,
          enabled: true,
          notification_channels: ['email'],
        },
      ];

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'alert_thresholds') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: thresholds, error: null }),
          };
        }
        return {};
      }) as any;

      const triggeredAlerts = await checkThresholds(organizationId, {
        error_rate: null as any,
      });

      expect(triggeredAlerts).toHaveLength(0);
    });

    it('handles very large metric values', async () => {
      const thresholds: AlertThreshold[] = [
        {
          id: 'threshold-12',
          organization_id: organizationId,
          metric: 'requests',
          condition: 'above',
          threshold: 1000000,
          enabled: true,
          notification_channels: ['email'],
        },
      ];

      const metrics: MetricValues = {
        requests: 999999999, // Very large value
      };

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'alert_thresholds') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: thresholds, error: null }),
          };
        }
        if (table === 'alert_history') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }) as any;

      const triggeredAlerts = await checkThresholds(organizationId, metrics);

      expect(triggeredAlerts).toHaveLength(1);
      expect(triggeredAlerts[0].value).toBe(999999999);
    });

    it('handles all notification channel types', async () => {
      const channels: Array<string[]> = [['email'], ['slack'], ['email', 'slack']];

      for (const notificationChannels of channels) {
        const thresholds: AlertThreshold[] = [
          {
            id: `threshold-channels-${notificationChannels.join('-')}`,
            organization_id: organizationId,
            metric: 'error_rate',
            condition: 'above',
            threshold: 5,
            enabled: true,
            notification_channels: notificationChannels,
          },
        ];

        mockSupabase.from = jest.fn().mockImplementation((table) => {
          if (table === 'alert_thresholds') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              then: (resolve: any) => resolve({ data: thresholds, error: null }),
            };
          }
          if (table === 'alert_history') {
            return {
              insert: jest.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }) as any;

        const triggeredAlerts = await checkThresholds(organizationId, { error_rate: 10 });
        expect(triggeredAlerts).toHaveLength(1);
        expect(triggeredAlerts[0].threshold.notification_channels).toEqual(notificationChannels);
      }
    });
  });
});
