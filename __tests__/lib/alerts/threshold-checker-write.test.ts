/**
 * Alert Threshold Checker - Write Operations Tests
 *
 * Tests for saveAlertThreshold function
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { saveAlertThreshold } from '@/lib/alerts/threshold-checker';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Alert Threshold Checker - Write', () => {
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

  describe('saveAlertThreshold', () => {
    const organizationId = 'org-123';

    it('creates a new threshold', async () => {
      const newThreshold = {
        metric: 'error_rate',
        condition: 'above' as const,
        threshold: 5,
      };

      const insertMock = jest.fn().mockResolvedValue({
        data: { id: 'threshold-new', ...newThreshold },
        error: null,
      });

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: insertMock,
          }),
        }),
      }) as any;

      const result = await saveAlertThreshold(organizationId, newThreshold);

      expect(result.success).toBe(true);
      expect(result.data?.metric).toBe('error_rate');
    });

    it('updates an existing threshold', async () => {
      const updatedThreshold = {
        id: 'threshold-1',
        metric: 'error_rate',
        condition: 'above' as const,
        threshold: 10,
      };

      const updateMock = jest.fn().mockResolvedValue({
        data: updatedThreshold,
        error: null,
      });

      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: updateMock,
              }),
            }),
          }),
        }),
      }) as any;

      const result = await saveAlertThreshold(organizationId, updatedThreshold);

      expect(result.success).toBe(true);
      expect(result.data?.threshold).toBe(10);
    });

    it('sets default values for optional fields', async () => {
      let insertedData: any;

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn((data) => {
          insertedData = data;
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: {}, error: null }),
            }),
          };
        }),
      }) as any;

      await saveAlertThreshold(organizationId, {
        metric: 'error_rate',
        condition: 'above',
        threshold: 5,
      });

      expect(insertedData.enabled).toBe(true);
      expect(insertedData.notification_channels).toEqual(['email']);
    });

    it('handles creation errors', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
          }),
        }),
      }) as any;

      const result = await saveAlertThreshold(organizationId, {
        metric: 'error_rate',
        condition: 'above',
        threshold: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insert failed');
    });
  });
});
