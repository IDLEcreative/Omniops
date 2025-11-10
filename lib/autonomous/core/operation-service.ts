/**
 * Autonomous Operation Service
 *
 * Manages autonomous operation lifecycle:
 * - Creating operations
 * - Updating status
 * - Retrieving operation data
 *
 * @module lib/autonomous/core/operation-service
 */

import { createServerClient } from '@/lib/supabase/server';
import { verifyConsent } from '../security/consent-manager';

// ============================================================================
// Types
// ============================================================================

export interface CreateOperationRequest {
  organizationId: string;
  userId?: string;
  service: string;
  operation: string;
  workflowId?: string;
  metadata?: Record<string, any>;
}

export interface OperationRecord {
  id: string;
  organizationId: string;
  userId: string | null;
  service: string;
  operation: string;
  workflowId: string | null;
  status: string;
  consentGiven: boolean;
  consentTimestamp: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalSteps: number | null;
  currentStep: number;
  result: any;
  executionMetadata: any;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Operation Service
// ============================================================================

export class OperationService {
  private supabase: ReturnType<typeof createServerClient>;

  /**
   * Create OperationService instance
   * @param client Optional Supabase client (for testing). If not provided, creates one.
   */
  constructor(client?: ReturnType<typeof createServerClient>) {
    this.supabase = client || createServerClient();
  }

  /**
   * Create a new autonomous operation
   */
  async create(request: CreateOperationRequest): Promise<OperationRecord> {
    const consentVerification = await verifyConsent(request.organizationId, request.service, request.operation);
    const status = consentVerification.hasConsent ? 'pending' : 'awaiting_consent';
    const consent_given = consentVerification.hasConsent;

    const { data, error } = await this.supabase
      .from('autonomous_operations')
      .insert({
        organization_id: request.organizationId,
        user_id: request.userId || null,
        service: request.service,
        operation: request.operation,
        workflow_id: request.workflowId || null,
        status,
        consent_given,
        consent_timestamp: consent_given ? new Date().toISOString() : null,
        execution_metadata: request.metadata || {}
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create operation: ${error.message}`);
    if (consent_given) console.log('[OperationService] Operation created:', { id: data.id, service: request.service, operation: request.operation });
    return this.mapToOperationRecord(data);
  }

  /**
   * Get operation by ID
   */
  async get(operationId: string): Promise<OperationRecord | null> {
    const { data, error } = await this.supabase.from('autonomous_operations').select('*').eq('id', operationId).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get operation: ${error.message}`);
    }
    return this.mapToOperationRecord(data);
  }

  /**
   * List operations for organization
   */
  async list(organizationId: string, options?: { status?: string; service?: string; limit?: number }): Promise<OperationRecord[]> {
    let query = this.supabase.from('autonomous_operations').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false });
    if (options?.status) query = query.eq('status', options.status);
    if (options?.service) query = query.eq('service', options.service);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw new Error(`Failed to list operations: ${error.message}`);
    return (data || []).map(this.mapToOperationRecord);
  }

  /**
   * Update operation consent
   */
  async grantConsent(operationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('autonomous_operations')
        .update({
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          status: 'pending'
        })
        .eq('id', operationId)
        .eq('status', 'awaiting_consent');

      if (error) {
        throw new Error(`Failed to grant consent: ${error.message}`);
      }

      console.log('[OperationService] Consent granted for operation:', operationId);
    } catch (error) {
      console.error('[OperationService] GrantConsent error:', error);
      throw error;
    }
  }

  /**
   * Cancel operation
   */
  async cancel(operationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('autonomous_operations')
        .update({ status: 'cancelled' })
        .eq('id', operationId)
        .in('status', ['pending', 'awaiting_consent']);

      if (error) {
        throw new Error(`Failed to cancel operation: ${error.message}`);
      }

      console.log('[OperationService] Operation cancelled:', operationId);
    } catch (error) {
      console.error('[OperationService] Cancel error:', error);
      throw error;
    }
  }

  /**
   * Get operation statistics for organization
   */
  async getStats(organizationId: string) {
    const { calculateStats } = await import('./operation-statistics');
    const operations = await this.list(organizationId);
    return calculateStats(operations);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private mapToOperationRecord(data: any): OperationRecord {
    return {
      id: data.id,
      organizationId: data.organization_id,
      userId: data.user_id,
      service: data.service,
      operation: data.operation,
      workflowId: data.workflow_id,
      status: data.status,
      consentGiven: data.consent_given,
      consentTimestamp: data.consent_timestamp,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      totalSteps: data.total_steps,
      currentStep: data.current_step,
      result: data.result,
      executionMetadata: data.execution_metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let operationServiceInstance: OperationService | null = null;

/**
 * Get singleton operation service instance
 * @param client Optional Supabase client (for testing)
 */
export function getOperationService(client?: ReturnType<typeof createServerClient>): OperationService {
  if (!operationServiceInstance) {
    operationServiceInstance = new OperationService(client);
  }
  return operationServiceInstance;
}

// ============================================================================
// Convenience Functions (Re-exported from helpers)
// ============================================================================

export { createOperation, getOperation, listOperations } from './operation-helpers';
