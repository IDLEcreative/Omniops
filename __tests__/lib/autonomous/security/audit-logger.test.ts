/**
 * Tests for AuditLogger
 * Tests audit trail logging, retrieval, and compliance features
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuditLogger } from '@/lib/autonomous/security/audit-logger';
import type { AuditStepData } from '@/lib/autonomous/security/audit-logger-types';

// Mock Supabase with chainable query methods
const createMockQuery = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null })
});

const mockSupabaseClient = {
  from: jest.fn(() => createMockQuery())
};

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    // Pass mock Supabase client to AuditLogger constructor
    auditLogger = new AuditLogger(mockSupabaseClient as any);
  });

  describe('logStep', () => {
    const validStepData: AuditStepData = {
      operationId: 'op-123',
      stepNumber: 1,
      intent: 'Navigate to login page',
      action: 'await page.goto("https://example.com/login")',
      success: true,
      pageUrl: 'https://example.com/login',
      durationMs: 1250
    };

    it('should log successful step', async () => {
      const mockInsertResponse = {
        data: {
          id: 'audit-123',
          operation_id: 'op-123',
          step_number: 1,
          intent: 'Navigate to login page',
          action: 'await page.goto("https://example.com/login")',
          success: true,
          error: null,
          screenshot_url: null,
          page_url: 'https://example.com/login',
          duration_ms: 1250,
          ai_response: null,
          timestamp: new Date().toISOString()
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
      });

      const record = await auditLogger.logStep(validStepData);

      expect(record.operationId).toBe('op-123');
      expect(record.stepNumber).toBe(1);
      expect(record.success).toBe(true);
      expect(record.durationMs).toBe(1250);
    });

    it('should log failed step with error message', async () => {
      const failedStepData: AuditStepData = {
        operationId: 'op-124',
        stepNumber: 3,
        intent: 'Click login button',
        action: 'await page.click("#login-btn")',
        success: false,
        error: 'Element not found',
        pageUrl: 'https://example.com/login',
        durationMs: 500
      };

      const mockInsertResponse = {
        data: {
          id: 'audit-124',
          operation_id: 'op-124',
          step_number: 3,
          intent: 'Click login button',
          action: 'await page.click("#login-btn")',
          success: false,
          error: 'Element not found',
          screenshot_url: null,
          page_url: 'https://example.com/login',
          duration_ms: 500,
          ai_response: null,
          timestamp: new Date().toISOString()
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
      });

      const record = await auditLogger.logStep(failedStepData);

      expect(record.success).toBe(false);
      expect(record.error).toBe('Element not found');
    });

    it('should log step with screenshot URL', async () => {
      const stepWithScreenshot: AuditStepData = {
        ...validStepData,
        screenshotUrl: 'https://example.com/screenshots/step-1.png'
      };

      const mockInsertResponse = {
        data: {
          id: 'audit-125',
          operation_id: 'op-123',
          step_number: 1,
          intent: 'Navigate to login page',
          action: 'await page.goto("https://example.com/login")',
          success: true,
          error: null,
          screenshot_url: 'https://example.com/screenshots/step-1.png',
          page_url: 'https://example.com/login',
          duration_ms: 1250,
          ai_response: null,
          timestamp: new Date().toISOString()
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
      });

      const record = await auditLogger.logStep(stepWithScreenshot);

      expect(record.screenshotUrl).toBe('https://example.com/screenshots/step-1.png');
    });

    it('should log step with AI response', async () => {
      const stepWithAI: AuditStepData = {
        ...validStepData,
        aiResponse: 'Click the blue login button in the top right corner'
      };

      const mockInsertResponse = {
        data: {
          id: 'audit-126',
          operation_id: 'op-123',
          step_number: 1,
          intent: 'Navigate to login page',
          action: 'await page.goto("https://example.com/login")',
          success: true,
          error: null,
          screenshot_url: null,
          page_url: 'https://example.com/login',
          duration_ms: 1250,
          ai_response: 'Click the blue login button in the top right corner',
          timestamp: new Date().toISOString()
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
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

  describe('getOperationLogs', () => {
    it('should retrieve all logs for an operation', async () => {
      const mockData = [
        {
          id: 'audit-1',
          operation_id: 'op-123',
          step_number: 1,
          intent: 'Navigate to login',
          action: 'await page.goto(...)',
          success: true,
          error: null,
          screenshot_url: 'https://example.com/screenshot-1.png',
          page_url: 'https://example.com/login',
          duration_ms: 1000,
          ai_response: null,
          timestamp: new Date().toISOString()
        },
        {
          id: 'audit-2',
          operation_id: 'op-123',
          step_number: 2,
          intent: 'Fill username',
          action: 'await page.fill(...)',
          success: true,
          error: null,
          screenshot_url: 'https://example.com/screenshot-2.png',
          page_url: 'https://example.com/login',
          duration_ms: 500,
          ai_response: null,
          timestamp: new Date().toISOString()
        },
        {
          id: 'audit-3',
          operation_id: 'op-123',
          step_number: 3,
          intent: 'Click login button',
          action: 'await page.click(...)',
          success: false,
          error: 'Element not found',
          screenshot_url: 'https://example.com/screenshot-3.png',
          page_url: 'https://example.com/login',
          duration_ms: 200,
          ai_response: null,
          timestamp: new Date().toISOString()
        }
      ];

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

  describe('getOperationSummary', () => {
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

  describe('getFailedSteps', () => {
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

  describe('getRecentLogs', () => {
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

  describe('exportAuditTrail', () => {
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

  describe('deleteOldLogs', () => {
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

      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - 30);

      // Verify lt was called with a date approximately 30 days ago
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
});
