/**
 * AuditLogger export and cleanup tests
 * Tests exportAuditTrail and deleteOldLogs methods
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

describe('AuditLogger.exportAuditTrail', () => {
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

    // Mock the exportAuditTrail query function
    auditQueries.exportAuditTrail.mockResolvedValue(
      mockData.map(d => mockOperations.mapToAuditRecord(d))
    );

    const trail = await auditLogger.exportAuditTrail('org-123');

    expect(auditQueries.exportAuditTrail).toHaveBeenCalledWith(
      'org-123',
      undefined,
      undefined,
      mockSupabaseClient,
      expect.any(Function)
    );
    expect(trail).toHaveLength(1);
  });

  it('should filter by date range', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    // Mock the exportAuditTrail query function
    auditQueries.exportAuditTrail.mockResolvedValue([]);

    await auditLogger.exportAuditTrail('org-123', startDate, endDate);

    expect(auditQueries.exportAuditTrail).toHaveBeenCalledWith(
      'org-123',
      startDate,
      endDate,
      mockSupabaseClient,
      expect.any(Function)
    );
  });
});

describe('AuditLogger.deleteOldLogs', () => {
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

  it('should delete logs older than retention period', async () => {
    // Mock the deleteOldLogs query function to return count
    auditQueries.deleteOldLogs.mockResolvedValue(3);

    const count = await auditLogger.deleteOldLogs(90);

    expect(auditQueries.deleteOldLogs).toHaveBeenCalledWith(90, mockSupabaseClient);
    expect(count).toBe(3);
  });

  it('should use custom retention period', async () => {
    // Mock the deleteOldLogs query function
    auditQueries.deleteOldLogs.mockResolvedValue(0);

    await auditLogger.deleteOldLogs(30);

    expect(auditQueries.deleteOldLogs).toHaveBeenCalledWith(30, mockSupabaseClient);
  });

  it('should return 0 when no logs to delete', async () => {
    // Mock the deleteOldLogs query function
    auditQueries.deleteOldLogs.mockResolvedValue(0);

    const count = await auditLogger.deleteOldLogs(90);

    expect(auditQueries.deleteOldLogs).toHaveBeenCalledWith(90, mockSupabaseClient);
    expect(count).toBe(0);
  });
});
