/**
 * AuditLogger - Operations & Compliance Tests
 * Tests compliance audit support, performance, scalability, and error handling
 */

// Mock Supabase server before imports (Jest hoisting requirement)
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClientSync: jest.fn(() => null), // Return null to test error handling
}));

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuditLogger } from '@/lib/autonomous/security/audit-logger';
import { createMockSupabaseClient } from '@/__tests__/utils/audit/mock-supabase';
import type { AuditStepData } from '@/lib/autonomous/security/audit-logger';

describe('AuditLogger - Operations & Compliance', () => {
  let auditLogger: AuditLogger;
  let mockSupabaseClient: any;
  let mockOperations: any;

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();

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

    auditLogger = new AuditLogger(mockSupabaseClient, mockOperations);
  });

  describe('Compliance Audit Support', () => {
    it('should support audit trail export for compliance', async () => {
      // Mock export functionality (would be implemented separately)
      const organizationId = 'org-123';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      // This would call auditLogger.exportAuditTrail in real implementation
      // For now, just verify the method exists
      expect(typeof auditLogger.exportAuditTrail).toBe('function');
    });

    it('should provide audit statistics for compliance reporting', async () => {
      // Verify statistics method exists
      expect(typeof auditLogger.getStatistics).toBe('function');
    });

    it('should support log retention policies', async () => {
      // Verify cleanup method exists
      expect(typeof auditLogger.deleteOldLogs).toBe('function');
    });
  });

  describe('Performance & Scalability', () => {
    it('should handle high-volume logging without blocking', async () => {
      const batchSize = 100;
      const steps: AuditStepData[] = Array.from({ length: batchSize }, (_, i) => ({
        operationId: 'perf-001',
        stepNumber: i + 1,
        intent: `Step ${i + 1}`,
        action: `action${i + 1}`,
        success: true,
        durationMs: Math.random() * 1000
      }));

      mockOperations.insertAuditStep.mockImplementation((_, data) =>
        Promise.resolve({
          ...data,
          id: `audit-${data.step_number}`,
          timestamp: new Date().toISOString()
        })
      );

      const startTime = Date.now();

      // Log all steps (should complete quickly with mocks)
      for (const step of steps) {
        await auditLogger.logStep(step);
      }

      const duration = Date.now() - startTime;

      expect(mockOperations.insertAuditStep).toHaveBeenCalledTimes(batchSize);
      expect(duration).toBeLessThan(5000); // Should complete quickly with mocks
    });

    it('should handle concurrent logging from multiple operations', async () => {
      const operations = ['op-1', 'op-2', 'op-3'];
      const stepsPerOperation = 10;

      mockOperations.insertAuditStep.mockImplementation((_, data) =>
        Promise.resolve({
          ...data,
          id: `audit-${data.operation_id}-${data.step_number}`,
          timestamp: new Date().toISOString()
        })
      );

      // Simulate concurrent operations
      const promises = operations.flatMap(opId =>
        Array.from({ length: stepsPerOperation }, (_, i) =>
          auditLogger.logStep({
            operationId: opId,
            stepNumber: i + 1,
            intent: `Step ${i + 1}`,
            action: `action${i + 1}`,
            success: true
          })
        )
      );

      await Promise.all(promises);

      expect(mockOperations.insertAuditStep).toHaveBeenCalledTimes(operations.length * stepsPerOperation);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const step: AuditStepData = {
        operationId: 'err-001',
        stepNumber: 1,
        intent: 'Test step',
        action: 'testAction',
        success: true
      };

      mockOperations.insertAuditStep.mockRejectedValue(
        new Error('Failed to log audit step: Connection timeout')
      );

      // Audit logging should throw but not crash the application
      await expect(auditLogger.logStep(step))
        .rejects.toThrow('Connection timeout');
    });

    it('should handle missing Supabase client gracefully', async () => {
      const invalidLogger = new AuditLogger(null);

      await expect(
        invalidLogger.logStep({
          operationId: 'err-002',
          stepNumber: 1,
          intent: 'Test',
          action: 'test',
          success: true
        })
      ).rejects.toThrow('Supabase client not initialized');
    });
  });
});
