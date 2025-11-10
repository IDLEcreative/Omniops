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

  constructor() {
    this.supabase = createServerClient();
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
    try {
      const { data, error } = await this.supabase
        .from('autonomous_operations_audit')
        .select('*')
        .eq('operation_id', operationId)
        .eq('success', false)
        .order('step_number', { ascending: true });

      if (error) {
        throw new Error(`Failed to get failed steps: ${error.message}`);
      }

      return (data || []).map(this.mapToAuditRecord);
    } catch (error) {
      console.error('[AuditLogger] GetFailedSteps error:', error);
      throw error;
    }
  }

  /**
   * Get recent audit logs (for monitoring dashboard)
   */
  async getRecentLogs(limit: number = 100): Promise<AuditRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('autonomous_operations_audit')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get recent logs: ${error.message}`);
      }

      return (data || []).map(this.mapToAuditRecord);
    } catch (error) {
      console.error('[AuditLogger] GetRecentLogs error:', error);
      throw error;
    }
  }

  /**
   * Export audit trail for GDPR/compliance
   */
  async exportAuditTrail(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditRecord[]> {
    try {
      let query = this.supabase
        .from('autonomous_operations_audit')
        .select(`
          *,
          autonomous_operations!inner(organization_id)
        `)
        .eq('autonomous_operations.organization_id', organizationId)
        .order('timestamp', { ascending: true });

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to export audit trail: ${error.message}`);
      }

      return (data || []).map(this.mapToAuditRecord);
    } catch (error) {
      console.error('[AuditLogger] ExportAuditTrail error:', error);
      throw error;
    }
  }

  /**
   * Delete old audit logs (retention policy)
   * Default: Keep 90 days
   */
  async deleteOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await this.supabase
        .from('autonomous_operations_audit')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to delete old logs: ${error.message}`);
      }

      const count = data?.length || 0;
      console.log(`[AuditLogger] Deleted ${count} audit logs older than ${retentionDays} days`);
      return count;
    } catch (error) {
      console.error('[AuditLogger] DeleteOldLogs error:', error);
      throw error;
    }
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
 *
 * @example
 * const logger = getAuditLogger();
 * await logger.logStep(...);
 */
export function getAuditLogger(): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger();
  }
  return auditLoggerInstance;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Log step (convenience function)
 */
export async function logAuditStep(data: AuditStepData): Promise<AuditRecord> {
  const logger = getAuditLogger();
  return logger.logStep(data);
}

/**
 * Get operation logs (convenience function)
 */
export async function getOperationAuditLogs(operationId: string): Promise<AuditRecord[]> {
  const logger = getAuditLogger();
  return logger.getOperationLogs(operationId);
}

/**
 * Get operation summary (convenience function)
 */
export async function getOperationAuditSummary(operationId: string): Promise<OperationSummary> {
  const logger = getAuditLogger();
  return logger.getOperationSummary(operationId);
}
