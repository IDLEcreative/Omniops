/**
 * AuditLogger retrieval tests
 * Tests getFailedSteps and getRecentLogs methods
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuditLogger } from '@/lib/autonomous/security/audit-logger';
import { createMockSupabaseClient } from '@/__tests__/utils/audit/mock-supabase';

describe('AuditLogger.getFailedSteps', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    auditLogger = new AuditLogger(mockSupabaseClient);
  });

  it('should retrieve only failed steps', async () => {
    const mockData = [
      {
        id: 'audit-3',
        operation_id: 'op-123',
        step_number: 3,
        intent: 'Failed step',
        action: 'await page.click(...)',
        success: false,
        error: 'Element not found',
        screenshot_url: 'https://example.com/screenshot-3.png',
        page_url: 'https://example.com/page',
        duration_ms: 200,
        ai_response: null,
        timestamp: new Date().toISOString()
      },
      {
        id: 'audit-5',
        operation_id: 'op-123',
        step_number: 5,
        intent: 'Another failed step',
        action: 'await page.fill(...)',
        success: false,
        error: 'Timeout',
        screenshot_url: 'https://example.com/screenshot-5.png',
        page_url: 'https://example.com/page',
        duration_ms: 5000,
        ai_response: null,
        timestamp: new Date().toISOString()
      }
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    const failedSteps = await auditLogger.getFailedSteps('op-123');

    expect(failedSteps).toHaveLength(2);
    expect(failedSteps.every(step => !step.success)).toBe(true);
    expect(failedSteps[0].error).toBe('Element not found');
    expect(failedSteps[1].error).toBe('Timeout');
  });
});

describe('AuditLogger.getRecentLogs', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    auditLogger = new AuditLogger(mockSupabaseClient);
  });

  it('should retrieve recent logs with default limit', async () => {
    const mockData = Array.from({ length: 50 }, (_, i) => ({
      id: `audit-${i}`,
      operation_id: `op-${Math.floor(i / 10)}`,
      step_number: i % 10 + 1,
      intent: `Step ${i + 1}`,
      action: 'action',
      success: true,
      error: null,
      screenshot_url: null,
      page_url: null,
      duration_ms: 1000,
      ai_response: null,
      timestamp: new Date(Date.now() - i * 1000).toISOString()
    }));

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    const logs = await auditLogger.getRecentLogs();

    expect(logs.length).toBeLessThanOrEqual(100);
  });

  it('should respect custom limit', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    await auditLogger.getRecentLogs(25);

    expect(mockSupabaseClient.from().limit).toHaveBeenCalledWith(25);
  });
});
