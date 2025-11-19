/**
 * Alert Threshold Checker - Acknowledge Operations Tests
 *
 * Tests for acknowledgeAlert function
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { acknowledgeAlert } from '@/lib/alerts/threshold-checker';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Alert Threshold Checker - Acknowledge', () => {
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

  describe('acknowledgeAlert', () => {
    it('acknowledges an alert successfully', async () => {
      const updateMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: updateMock,
        }),
      }) as any;

      const result = await acknowledgeAlert('alert-1', 'user-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('sets acknowledged_at timestamp', async () => {
      let updateData: any;
      const updateMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn((data) => {
          updateData = data;
          return {
            eq: updateMock,
          };
        }),
      }) as any;

      await acknowledgeAlert('alert-1', 'user-123');

      expect(updateData.acknowledged_by).toBe('user-123');
      expect(updateData.acknowledged_at).toBeDefined();
    });

    it('handles database errors', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        }),
      }) as any;

      const result = await acknowledgeAlert('alert-1', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });
});
