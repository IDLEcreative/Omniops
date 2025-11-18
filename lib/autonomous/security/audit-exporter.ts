/**
 * Audit Trail Exporter (GDPR/Compliance)
 * @module lib/autonomous/security/audit-exporter
 */

// eslint-disable-next-line no-restricted-imports -- Type-only import, no runtime code imported
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditRecord } from './audit-logger-types';

export class AuditExporter {
  constructor(private supabase: SupabaseClient<any>) {}

  async exportAuditTrail(
    customerId: string,
    startDate?: Date,
    endDate?: Date,
    mapperFn?: (data: any) => AuditRecord
  ): Promise<AuditRecord[]> {
    try {
      let query = this.supabase
        .from('autonomous_operations_audit')
        .select(`
          *,
          autonomous_operations!inner(customer_id)
        `)
        .eq('autonomous_operations.customer_id', customerId)
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

      return (data || []).map(mapperFn || (d => d as AuditRecord));
    } catch (error) {
      console.error('[AuditExporter] ExportAuditTrail error:', error);
      throw error;
    }
  }

  async deleteOldLogs(retentionDays: number): Promise<number> {
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
      return count;
    } catch (error) {
      console.error('[AuditExporter] DeleteOldLogs error:', error);
      throw error;
    }
  }
}
