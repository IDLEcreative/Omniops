/**
 * Audit Statistics Calculator
 * @module lib/autonomous/security/audit-statistics
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export class AuditStatistics {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createServerClient();
  }

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
    try {
      let query = this.supabase
        .from('autonomous_operations_audit')
        .select('success, error, duration_ms');

      if (organizationId) {
        query = query.eq('autonomous_operations.organization_id', organizationId);
      }

      if (period) {
        query = query
          .gte('timestamp', period.startDate.toISOString())
          .lte('timestamp', period.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get statistics: ${error.message}`);
      }

      const logs = data || [];
      const successful = logs.filter(l => l.success).length;
      const total = logs.length;

      const durations = logs
        .filter(l => l.duration_ms !== null)
        .map(l => l.duration_ms!);
      const avgDurationMs = durations.length > 0
        ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
        : 0;

      const failureReasons: Record<string, number> = {};
      logs.filter(l => !l.success && l.error).forEach(l => {
        const reason = l.error!;
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
      });

      const uniqueOperations = await this.getUniqueOperationsCount(organizationId, period);

      return {
        totalOperations: uniqueOperations,
        totalSteps: total,
        successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
        avgDurationMs,
        failureReasons
      };
    } catch (error) {
      console.error('[AuditStatistics] GetStatistics error:', error);
      throw error;
    }
  }

  private async getUniqueOperationsCount(
    organizationId?: string,
    period?: { startDate: Date; endDate: Date }
  ): Promise<number> {
    try {
      let query = this.supabase
        .from('autonomous_operations_audit')
        .select('operation_id', { count: 'exact', head: false });

      if (organizationId) {
        query = query.eq('autonomous_operations.organization_id', organizationId);
      }

      if (period) {
        query = query
          .gte('timestamp', period.startDate.toISOString())
          .lte('timestamp', period.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to count operations: ${error.message}`);
      }

      const uniqueIds = new Set((data || []).map(d => d.operation_id));
      return uniqueIds.size;
    } catch (error) {
      console.error('[AuditStatistics] GetUniqueOperationsCount error:', error);
      return 0;
    }
  }
}
