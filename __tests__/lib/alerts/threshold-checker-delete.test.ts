/**
 * Alert Threshold Checker - Delete Operations Tests
 *
 * Tests for deleteAlertThreshold function
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deleteAlertThreshold } from '@/lib/alerts/threshold-checker';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Alert Threshold Checker - Delete', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    // Mock createServiceRoleClient to return our mock
    const { createServiceRoleClient } = require('@/lib/supabase-server');
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('deleteAlertThreshold', () => {
    it('deletes a threshold successfully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }) as any;

      const result = await deleteAlertThreshold('org-123', 'threshold-1');

      expect(result.success).toBe(true);
    });

    it('handles deletion errors', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
          }),
        }),
      }) as any;

      const result = await deleteAlertThreshold('org-123', 'threshold-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });
});
