/**
 * Audit Logger Query Module
 *
 * Database query operations for audit logs.
 * Extracted from AuditLogger to reduce file size.
 *
 * @module lib/autonomous/security/audit-queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditRecord } from './audit-logger-types';

/**
 * Get failed steps for an operation (for debugging)
 */
export async function getFailedSteps(
  operationId: string,
  supabase: SupabaseClient,
  mapFn: (data: any) => AuditRecord
): Promise<AuditRecord[]> {
  const { data, error } = await supabase
    .from('autonomous_operations_audit')
    .select('*')
    .eq('operation_id', operationId)
    .eq('success', false)
    .order('step_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to get failed steps: ${error.message}`);
  }

  return (data || []).map(mapFn);
}

/**
 * Get recent audit logs (for monitoring dashboard)
 */
export async function getRecentLogs(
  limit: number,
  supabase: SupabaseClient,
  mapFn: (data: any) => AuditRecord
): Promise<AuditRecord[]> {
  const { data, error } = await supabase
    .from('autonomous_operations_audit')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get recent logs: ${error.message}`);
  }

  return (data || []).map(mapFn);
}

/**
 * Export audit trail for GDPR/compliance
 */
export async function exportAuditTrail(
  organizationId: string,
  startDate: Date | undefined,
  endDate: Date | undefined,
  supabase: SupabaseClient,
  mapFn: (data: any) => AuditRecord
): Promise<AuditRecord[]> {
  let query = supabase
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

  return (data || []).map(mapFn);
}

/**
 * Delete old audit logs (retention policy)
 */
export async function deleteOldLogs(
  retentionDays: number,
  supabase: SupabaseClient
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data, error } = await supabase
    .from('autonomous_operations_audit')
    .delete()
    .lt('timestamp', cutoffDate.toISOString())
    .select('id');

  if (error) {
    throw new Error(`Failed to delete old logs: ${error.message}`);
  }

  const count = data?.length || 0;
  return count;
}
