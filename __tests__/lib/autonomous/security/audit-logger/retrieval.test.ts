/**
 * AuditLogger retrieval tests
 * Tests getFailedSteps and getRecentLogs methods
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuditLogger } from '@/lib/autonomous/security/audit-logger';
import { createMockSupabaseClient } from '@/__tests__/utils/audit/mock-supabase';

// Mock the audit-queries module
jest.mock('@/lib/autonomous/security/audit-queries', () => ({
  getFailedSteps: jest.fn(),
  getRecentLogs: jest.fn(),
  exportAuditTrail: jest.fn(),
  deleteOldLogs: jest.fn()
}));

describe('AuditLogger.getFailedSteps', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;
  let mockOperations: any;
  let auditQueries: any;

  beforeEach(async () => {
    // Import the mocked module
    const auditQueriesModule = await import('@/lib/autonomous/security/audit-queries');
    auditQueries = auditQueriesModule;

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

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Use dependency injection to provide mock operations
    auditLogger = new AuditLogger(mockSupabaseClient, mockOperations);
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

    // Mock the getFailedSteps query function
    auditQueries.getFailedSteps.mockResolvedValue(
      mockData.map(d => mockOperations.mapToAuditRecord(d))
    );

    const failedSteps = await auditLogger.getFailedSteps('op-123');

    expect(auditQueries.getFailedSteps).toHaveBeenCalledWith(
      'op-123',
      mockSupabaseClient,
      expect.any(Function)
    );
    expect(failedSteps).toHaveLength(2);
    expect(failedSteps.every(step => !step.success)).toBe(true);
    expect(failedSteps[0].error).toBe('Element not found');
    expect(failedSteps[1].error).toBe('Timeout');
  });
});

describe('AuditLogger.getRecentLogs', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;
  let mockOperations: any;
  let auditQueries: any;

  beforeEach(async () => {
    // Import the mocked module
    const auditQueriesModule = await import('@/lib/autonomous/security/audit-queries');
    auditQueries = auditQueriesModule;

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

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Use dependency injection to provide mock operations
    auditLogger = new AuditLogger(mockSupabaseClient, mockOperations);
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

    // Mock the getRecentLogs query function
    auditQueries.getRecentLogs.mockResolvedValue(
      mockData.map(d => mockOperations.mapToAuditRecord(d))
    );

    const logs = await auditLogger.getRecentLogs();

    expect(auditQueries.getRecentLogs).toHaveBeenCalledWith(
      100,
      mockSupabaseClient,
      expect.any(Function)
    );
    expect(logs.length).toBeLessThanOrEqual(100);
  });

  it('should respect custom limit', async () => {
    // Mock the getRecentLogs query function
    auditQueries.getRecentLogs.mockResolvedValue([]);

    await auditLogger.getRecentLogs(25);

    expect(auditQueries.getRecentLogs).toHaveBeenCalledWith(
      25,
      mockSupabaseClient,
      expect.any(Function)
    );
  });
});
