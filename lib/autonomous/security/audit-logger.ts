/**
 * Autonomous Operations Audit Logger
 *
 * Comprehensive audit trail for all autonomous operations.
 * Logs every step, screenshot, and outcome for compliance and debugging.
 *
 * @module lib/autonomous/security/audit-logger
 */

import { createServerClient } from '@/lib/supabase/server';
import type { AuditStepData, AuditRecord, OperationSummary } from './audit-logger-types';

export type { AuditStepData, AuditRecord, OperationSummary } from './audit-logger-types';

// ============================================================================
// Audit Logger Service
// ============================================================================

export class AuditLogger {
  private supabase: ReturnType<typeof createServerClient>;

  /**
   * Create AuditLogger instance
   * @param client Optional Supabase client (for testing). If not provided, creates one.
   */
  constructor(client?: ReturnType<typeof createServerClient>) {
    this.supabase = client || createServerClient();
  }

  /**
   * Log a single step in an autonomous operation
   *
   * @example
   * await logger.logStep({
   *   operationId: 'op-123',
   *   stepNumber: 1,
   *   intent: 'Navigate to login page',
   *   action: 'await page.goto("https://example.com/login")',
   *   success: true,
   *   pageUrl: 'https://example.com/login',
   *   durationMs: 1250
   * });
   */
  async logStep(data: AuditStepData): Promise<AuditRecord> {
    try {
      const { data: record, error } = await this.supabase
        .from('autonomous_operations_audit')
        .insert({
          operation_id: data.operationId,
          step_number: data.stepNumber,
          intent: data.intent,
          action: data.action,
          success: data.success,
          error: data.error || null,
          screenshot_url: data.screenshotUrl || null,
          page_url: data.pageUrl || null,
          duration_ms: data.durationMs || null,
          ai_response: data.aiResponse || null
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log audit step: ${error.message}`);
      }

      // Log to console for real-time monitoring
      console.log(`[AuditLogger] ${data.success ? '✅' : '❌'} Step ${data.stepNumber}:`, {
        operationId: data.operationId,
        intent: data.intent,
        durationMs: data.durationMs
      });

      return this.mapToAuditRecord(record);
    } catch (error) {
      console.error('[AuditLogger] LogStep error:', error);
      // Don't throw - audit logging should never break the main operation
      throw error;
    }
  }

  /**
   * Get all audit logs for an operation
   *
   * @example
   * const logs = await logger.getOperationLogs('op-123');
   * logs.forEach(log => console.log(log.intent, log.success));
   */
  async getOperationLogs(operationId: string): Promise<AuditRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('autonomous_operations_audit')
        .select('*')
        .eq('operation_id', operationId)
        .order('step_number', { ascending: true });

      if (error) {
        throw new Error(`Failed to get operation logs: ${error.message}`);
      }

      return (data || []).map(this.mapToAuditRecord);
    } catch (error) {
      console.error('[AuditLogger] GetOperationLogs error:', error);
      throw error;
    }
  }

  /**
   * Get summary statistics for an operation
   *
   * @example
   * const summary = await logger.getOperationSummary('op-123');
   * console.log(`Success rate: ${summary.successfulSteps}/${summary.totalSteps}`);
   */
  async getOperationSummary(operationId: string): Promise<OperationSummary> {
    try {
      const logs = await this.getOperationLogs(operationId);

      const screenshots = logs
        .filter(log => log.screenshotUrl)
        .map(log => log.screenshotUrl!);

      const durations = logs
        .filter(log => log.durationMs !== null)
        .map(log => log.durationMs!);

      const totalDurationMs = durations.reduce((sum, d) => sum + d, 0);
      const avgStepDurationMs = durations.length > 0
        ? Math.round(totalDurationMs / durations.length)
        : 0;

      return {
        totalSteps: logs.length,
        successfulSteps: logs.filter(log => log.success).length,
        failedSteps: logs.filter(log => !log.success).length,
        totalDurationMs,
        avgStepDurationMs,
        screenshots
      };
    } catch (error) {
      console.error('[AuditLogger] GetOperationSummary error:', error);
      throw error;
    }
  }

  /**
   * Get failed steps for an operation (for debugging)
   */
  async getFailedSteps(operationId: string): Promise<AuditRecord[]> {
    const { getFailedSteps } = await import('./audit-queries');
    return getFailedSteps(operationId, this.supabase, this.mapToAuditRecord);
  }

  /**
   * Get recent audit logs (for monitoring dashboard)
   */
  async getRecentLogs(limit: number = 100): Promise<AuditRecord[]> {
    const { getRecentLogs } = await import('./audit-queries');
    return getRecentLogs(limit, this.supabase, this.mapToAuditRecord);
  }

  /**
   * Export audit trail for GDPR/compliance
   */
  async exportAuditTrail(organizationId: string, startDate?: Date, endDate?: Date): Promise<AuditRecord[]> {
    const { exportAuditTrail } = await import('./audit-queries');
    return exportAuditTrail(organizationId, startDate, endDate, this.supabase, this.mapToAuditRecord);
  }

  /**
   * Delete old audit logs (retention policy)
   */
  async deleteOldLogs(retentionDays: number = 90): Promise<number> {
    const { deleteOldLogs } = await import('./audit-queries');
    return deleteOldLogs(retentionDays, this.supabase);
  }

  /**
   * Get audit statistics (for dashboard)
   */
  async getStatistics(
    organizationId?: string,
    period?: { startDate: Date; endDate: Date }
  ): Promise<{
    totalOperations: number;
    totalSteps: number;
    successRate: number;
    avgDurationMs: number;
    failureReasons: Record<string, number>;
  }> {
    const { AuditStatistics } = await import('./audit-statistics');
    const stats = new AuditStatistics();
    return stats.getStatistics(organizationId, period);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private mapToAuditRecord(data: any): AuditRecord {
    return {
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
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let auditLoggerInstance: AuditLogger | null = null;

/**
 * Get singleton audit logger instance
 * @param client Optional Supabase client (for testing)
 *
 * @example
 * const logger = getAuditLogger();
 * await logger.logStep(...);
 */
export function getAuditLogger(client?: ReturnType<typeof createServerClient>): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger(client);
  }
  return auditLoggerInstance;
}

// ============================================================================
// Convenience Functions (Re-exported from helpers)
// ============================================================================

export { logAuditStep, getOperationAuditLogs, getOperationAuditSummary } from './audit-logger-helpers';
