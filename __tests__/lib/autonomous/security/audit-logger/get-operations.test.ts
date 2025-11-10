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
  let mockOperations: any;

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();

    // Create mock operations using dependency injection
    mockOperations = {
      insertAuditStep: jest.fn(),
      selectOperationLogs: jest.fn(),
      mapToAuditRecord: jest.fn((data) => ({
        id: data.id,
        operationId: data.operation_id,
        stepNumber: data.step_number,
        intent: data.intent,
        action: data.action,
        success: data.success,
        error: data.error,
        screenshotUrl: data.screenshot_url,
        pageUrl: data.page_url,
        durationMs: data.duration_ms,
        aiResponse: data.ai_response,
        timestamp: data.timestamp
      }))
    };

    // Use dependency injection to provide mock operations
    auditLogger = new AuditLogger(mockSupabaseClient, mockOperations);
  });

  it('should retrieve all logs for an operation', async () => {
    const mockData = createMockMultipleLogsResponse();
    mockOperations.selectOperationLogs.mockResolvedValue(mockData);

    const logs = await auditLogger.getOperationLogs('op-123');

    expect(mockOperations.selectOperationLogs).toHaveBeenCalledWith(mockSupabaseClient, 'op-123');
    expect(logs).toHaveLength(3);
    expect(logs[0].stepNumber).toBe(1);
    expect(logs[1].stepNumber).toBe(2);
    expect(logs[2].stepNumber).toBe(3);
    expect(logs[2].success).toBe(false);
  });

  it('should return empty array for non-existent operation', async () => {
    mockOperations.selectOperationLogs.mockResolvedValue([]);

    const logs = await auditLogger.getOperationLogs('non-existent');

    expect(mockOperations.selectOperationLogs).toHaveBeenCalledWith(mockSupabaseClient, 'non-existent');
    expect(logs).toHaveLength(0);
  });
});

describe('AuditLogger.getOperationSummary', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;
  let mockOperations: any;

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();

    // Create mock operations using dependency injection
    mockOperations = {
      insertAuditStep: jest.fn(),
      selectOperationLogs: jest.fn(),
      mapToAuditRecord: jest.fn((data) => ({
        id: data.id,
        operationId: data.operation_id,
        stepNumber: data.step_number,
        intent: data.intent,
        action: data.action,
        success: data.success,
        error: data.error,
        screenshotUrl: data.screenshot_url,
        pageUrl: data.page_url,
        durationMs: data.duration_ms,
        aiResponse: data.ai_response,
        timestamp: data.timestamp
      }))
    };

    // Use dependency injection to provide mock operations
    auditLogger = new AuditLogger(mockSupabaseClient, mockOperations);
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

    // Use dependency injection to mock selectOperationLogs
    mockOperations.selectOperationLogs.mockResolvedValue(mockData);

    const summary = await auditLogger.getOperationSummary('op-123');

    expect(mockOperations.selectOperationLogs).toHaveBeenCalledWith(mockSupabaseClient, 'op-123');
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

    // Use dependency injection to mock selectOperationLogs
    mockOperations.selectOperationLogs.mockResolvedValue(mockData);

    const summary = await auditLogger.getOperationSummary('op-124');

    expect(mockOperations.selectOperationLogs).toHaveBeenCalledWith(mockSupabaseClient, 'op-124');
    expect(summary.totalDurationMs).toBe(0);
    expect(summary.avgStepDurationMs).toBe(0);
  });
});
