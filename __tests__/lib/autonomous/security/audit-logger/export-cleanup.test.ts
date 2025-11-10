/**
 * AuditLogger export and cleanup tests
 * Tests exportAuditTrail and deleteOldLogs methods
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuditLogger } from '@/lib/autonomous/security/audit-logger';
import { createMockSupabaseClient } from '@/__tests__/utils/audit/mock-supabase';

describe('AuditLogger.exportAuditTrail', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    auditLogger = new AuditLogger(mockSupabaseClient);
  });

  it('should export audit trail for organization', async () => {
    const mockData = [
      {
        id: 'audit-1',
        operation_id: 'op-1',
        step_number: 1,
        intent: 'Step 1',
        action: 'action 1',
        success: true,
        error: null,
        screenshot_url: null,
        page_url: null,
        duration_ms: 1000,
        ai_response: null,
        timestamp: new Date().toISOString()
      }
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    const trail = await auditLogger.exportAuditTrail('org-123');

    expect(trail).toHaveLength(1);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('autonomous_operations_audit');
  });

  it('should filter by date range', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await auditLogger.exportAuditTrail('org-123', startDate, endDate);

    expect(mockSupabaseClient.from().gte).toHaveBeenCalledWith('timestamp', startDate.toISOString());
    expect(mockSupabaseClient.from().lte).toHaveBeenCalledWith('timestamp', endDate.toISOString());
  });
});

describe('AuditLogger.deleteOldLogs', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    auditLogger = new AuditLogger(mockSupabaseClient);
  });

  it('should delete logs older than retention period', async () => {
    const mockData = [{ id: 'audit-1' }, { id: 'audit-2' }, { id: 'audit-3' }];

    mockSupabaseClient.from.mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    const count = await auditLogger.deleteOldLogs(90);

    expect(count).toBe(3);
    expect(mockSupabaseClient.from().delete).toHaveBeenCalled();
  });

  it('should use custom retention period', async () => {
    mockSupabaseClient.from.mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await auditLogger.deleteOldLogs(30);

    expect(mockSupabaseClient.from().lt).toHaveBeenCalled();
  });

  it('should return 0 when no logs to delete', async () => {
    mockSupabaseClient.from.mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    const count = await auditLogger.deleteOldLogs(90);

    expect(count).toBe(0);
  });
});
