/**
 * AuditLogger.logStep tests
 * Tests step logging functionality with success/failure handling
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuditLogger } from '@/lib/autonomous/security/audit-logger';
import {
  validStepData,
  failedStepData,
  stepWithScreenshot,
  stepWithAI,
  createMockLogResponse
} from '@/__tests__/utils/audit/test-data';
import { createMockSupabaseClient } from '@/__tests__/utils/audit/mock-supabase';

describe('AuditLogger.logStep', () => {
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

  it('should log successful step', async () => {
    const mockResponse = createMockLogResponse(validStepData);
    mockOperations.insertAuditStep.mockResolvedValue(mockResponse.data);

    const record = await auditLogger.logStep(validStepData);

    // Verify insertAuditStep was called with correct data
    expect(mockOperations.insertAuditStep).toHaveBeenCalledWith(
      mockSupabaseClient,
      expect.objectContaining({
        operation_id: validStepData.operationId,
        step_number: validStepData.stepNumber,
        intent: validStepData.intent,
        action: validStepData.action,
        success: validStepData.success
      })
    );

    // Verify record was mapped correctly
    expect(record.operationId).toBe('op-123');
    expect(record.stepNumber).toBe(1);
    expect(record.success).toBe(true);
    expect(record.durationMs).toBe(1250);
  });

  it('should log failed step with error message', async () => {
    const mockResponse = createMockLogResponse(failedStepData, 'audit-124');
    mockOperations.insertAuditStep.mockResolvedValue(mockResponse.data);

    const record = await auditLogger.logStep(failedStepData);

    expect(record.success).toBe(false);
    expect(record.error).toBe('Element not found');
  });

  it('should log step with screenshot URL', async () => {
    const mockResponse = createMockLogResponse(stepWithScreenshot, 'audit-125');
    mockOperations.insertAuditStep.mockResolvedValue(mockResponse.data);

    const record = await auditLogger.logStep(stepWithScreenshot);

    expect(record.screenshotUrl).toBe('https://example.com/screenshots/step-1.png');
  });

  it('should log step with AI response', async () => {
    const mockResponse = createMockLogResponse(stepWithAI, 'audit-126');
    mockOperations.insertAuditStep.mockResolvedValue(mockResponse.data);

    const record = await auditLogger.logStep(stepWithAI);

    expect(record.aiResponse).toBe('Click the blue login button in the top right corner');
  });

  it('should handle database errors', async () => {
    mockOperations.insertAuditStep.mockRejectedValue(
      new Error('Failed to log audit step: Database connection failed')
    );

    await expect(auditLogger.logStep(validStepData))
      .rejects.toThrow('Failed to log audit step: Database connection failed');
  });
});