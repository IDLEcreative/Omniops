/**
 * AuditLogger operation retrieval tests
 * Tests getOperationLogs and getOperationSummary methods
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuditLogger } from '@/lib/autonomous/security/audit-logger';
import { createMockSupabaseClient } from '@/__tests__/utils/audit/mock-supabase';
import { createMockMultipleLogsResponse } from '@/__tests__/utils/audit/test-data';

describe('AuditLogger.getOperationLogs', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    auditLogger = new AuditLogger(mockSupabaseClient);
  });

  it('should retrieve all logs for an operation', async () => {
    const mockData = createMockMultipleLogsResponse();

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    const logs = await auditLogger.getOperationLogs('op-123');

    expect(logs).toHaveLength(3);
    expect(logs[0].stepNumber).toBe(1);
    expect(logs[1].stepNumber).toBe(2);
    expect(logs[2].stepNumber).toBe(3);
    expect(logs[2].success).toBe(false);
  });

  it('should return empty array for non-existent operation', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    const logs = await auditLogger.getOperationLogs('non-existent');

    expect(logs).toHaveLength(0);
  });
});

describe('AuditLogger.getOperationSummary', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    auditLogger = new AuditLogger(mockSupabaseClient);
  });

  it('should calculate operation summary statistics', async () => {
    const mockData = [
      {
        id: 'audit-1',
        operation_id: 'op-123',
        step_number: 1,
        intent: 'Step 1',
        action: 'action 1',
        success: true,
        error: null,
        screenshot_url: 'https://example.com/screenshot-1.png',
        page_url: 'https://example.com/page',
        duration_ms: 1000,
        ai_response: null,
        timestamp: new Date().toISOString()
      },
      {
        id: 'audit-2',
        operation_id: 'op-123',
        step_number: 2,
        intent: 'Step 2',
        action: 'action 2',
        success: true,
        error: null,
        screenshot_url: 'https://example.com/screenshot-2.png',
        page_url: 'https://example.com/page',
        duration_ms: 1500,
        ai_response: null,
        timestamp: new Date().toISOString()
      },
      {
        id: 'audit-3',
        operation_id: 'op-123',
        step_number: 3,
        intent: 'Step 3',
        action: 'action 3',
        success: false,
        error: 'Failed',
        screenshot_url: 'https://example.com/screenshot-3.png',
        page_url: 'https://example.com/page',
        duration_ms: 500,
        ai_response: null,
        timestamp: new Date().toISOString()
      }
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    const summary = await auditLogger.getOperationSummary('op-123');

    expect(summary.totalSteps).toBe(3);
    expect(summary.successfulSteps).toBe(2);
    expect(summary.failedSteps).toBe(1);
    expect(summary.totalDurationMs).toBe(3000);
    expect(summary.avgStepDurationMs).toBe(1000);
    expect(summary.screenshots).toHaveLength(3);
  });

  it('should handle operation with no durations', async () => {
    const mockData = [
      {
        id: 'audit-1',
        operation_id: 'op-124',
        step_number: 1,
        intent: 'Step 1',
        action: 'action 1',
        success: true,
        error: null,
        screenshot_url: null,
        page_url: null,
        duration_ms: null,
        ai_response: null,
        timestamp: new Date().toISOString()
      }
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    const summary = await auditLogger.getOperationSummary('op-124');

    expect(summary.totalDurationMs).toBe(0);
    expect(summary.avgStepDurationMs).toBe(0);
  });
});
