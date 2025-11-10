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

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    auditLogger = new AuditLogger(mockSupabaseClient);
  });

  it('should log successful step', async () => {
    mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(createMockLogResponse(validStepData))
    });

    const record = await auditLogger.logStep(validStepData);

    expect(record.operationId).toBe('op-123');
    expect(record.stepNumber).toBe(1);
    expect(record.success).toBe(true);
    expect(record.durationMs).toBe(1250);
  });

  it('should log failed step with error message', async () => {
    mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(createMockLogResponse(failedStepData, 'audit-124'))
    });

    const record = await auditLogger.logStep(failedStepData);

    expect(record.success).toBe(false);
    expect(record.error).toBe('Element not found');
  });

  it('should log step with screenshot URL', async () => {
    mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(
        createMockLogResponse(stepWithScreenshot, 'audit-125')
      )
    });

    const record = await auditLogger.logStep(stepWithScreenshot);

    expect(record.screenshotUrl).toBe('https://example.com/screenshots/step-1.png');
  });

  it('should log step with AI response', async () => {
    mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(
        createMockLogResponse(stepWithAI, 'audit-126')
      )
    });

    const record = await auditLogger.logStep(stepWithAI);

    expect(record.aiResponse).toBe('Click the blue login button in the top right corner');
  });

  it('should handle database errors', async () => {
    mockSupabaseClient.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })
    });

    await expect(auditLogger.logStep(validStepData))
      .rejects.toThrow('Failed to log audit step: Database connection failed');
  });
});
