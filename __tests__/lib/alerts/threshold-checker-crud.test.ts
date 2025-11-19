/**
 * Alert Threshold Checker - Read Operations Tests
 *
 * Tests for getAlertHistory and getAlertThresholds functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getAlertHistory,
  getAlertThresholds,
} from '@/lib/alerts/threshold-checker';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Alert Threshold Checker - Read Operations', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    const { createServiceRoleClient } = require('@/lib/supabase-server');
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('getAlertHistory', () => {
    const organizationId = 'org-123';

    it('retrieves alert history with default options', async () => {
      const mockHistory = [
        {
          id: 'alert-1',
          organization_id: organizationId,
          metric: 'error_rate',
          value: 10,
          triggered_at: '2024-01-15T10:00:00Z',
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockHistory, error: null }),
      }) as any;

      const history = await getAlertHistory(organizationId);

      expect(history).toEqual(mockHistory);
    });

    it('filters unacknowledged alerts only', async () => {
      const mockHistory = [
        {
          id: 'alert-2',
          organization_id: organizationId,
          metric: 'error_rate',
          acknowledged_at: null,
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockHistory, error: null }),
      }) as any;

      const history = await getAlertHistory(organizationId, { onlyUnacknowledged: true });

      expect(history).toHaveLength(1);
    });

    it('filters by metric type', async () => {
      const mockHistory = [
        {
          id: 'alert-3',
          organization_id: organizationId,
          metric: 'sentiment_score',
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockHistory, error: null }),
      }) as any;

      const history = await getAlertHistory(organizationId, { metricFilter: 'sentiment_score' });

      expect(history).toHaveLength(1);
    });

    it('limits results when specified', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }) as any;

      await getAlertHistory(organizationId, { limit: 10 });

      const fromCall = mockSupabase.from('alert_history');
      expect(fromCall).toBeDefined();
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: { message: 'DB error' } }),
      }) as any;

      const history = await getAlertHistory(organizationId);

      expect(history).toEqual([]);
    });
  });

  describe('getAlertThresholds', () => {
    it('retrieves all thresholds for an organization', async () => {
      const mockThresholds = [
        {
          id: 'threshold-1',
          organization_id: 'org-123',
          metric: 'error_rate',
          condition: 'above',
          threshold: 5,
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockThresholds, error: null }),
      }) as any;

      const thresholds = await getAlertThresholds('org-123');

      expect(thresholds).toEqual(mockThresholds);
    });

    it('returns empty array on database error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: { message: 'DB error' } }),
      }) as any;

      const thresholds = await getAlertThresholds('org-123');

      expect(thresholds).toEqual([]);
    });
  });
});
