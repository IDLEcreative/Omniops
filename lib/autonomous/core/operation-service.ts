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

  constructor() {
    this.supabase = createServerClient();
  }

  /**
   * Create a new autonomous operation
   *
   * @example
   * const operation = await service.create({
   *   organizationId: 'org-123',
   *   userId: 'user-456',
   *   service: 'woocommerce',
   *   operation: 'api_key_generation',
   *   workflowId: 'should-complete-woocommerce-setup-and-enable-product-search'
   * });
   */
  async create(request: CreateOperationRequest): Promise<OperationRecord> {
    try {
      // Verify consent exists
      const consentVerification = await verifyConsent(
        request.organizationId,
        request.service,
        request.operation
      );

      if (!consentVerification.hasConsent) {
        // Create operation in "awaiting_consent" state
        const { data, error } = await this.supabase
          .from('autonomous_operations')
          .insert({
            organization_id: request.organizationId,
            user_id: request.userId || null,
            service: request.service,
            operation: request.operation,
            workflow_id: request.workflowId || null,
            status: 'awaiting_consent',
            consent_given: false,
            execution_metadata: request.metadata || {}
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create operation: ${error.message}`);
        }

        return this.mapToOperationRecord(data);
      }

      // Create operation in "pending" state (ready to execute)
      const { data, error } = await this.supabase
        .from('autonomous_operations')
        .insert({
          organization_id: request.organizationId,
          user_id: request.userId || null,
          service: request.service,
          operation: request.operation,
          workflow_id: request.workflowId || null,
          status: 'pending',
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          execution_metadata: request.metadata || {}
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create operation: ${error.message}`);
        }

      console.log('[OperationService] Operation created:', {
        id: data.id,
        service: request.service,
        operation: request.operation
      });

      return this.mapToOperationRecord(data);
    } catch (error) {
      console.error('[OperationService] Create error:', error);
      throw error;
    }
  }

  /**
   * Get operation by ID
   */
  async get(operationId: string): Promise<OperationRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('autonomous_operations')
        .select('*')
        .eq('id', operationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to get operation: ${error.message}`);
      }

      return this.mapToOperationRecord(data);
    } catch (error) {
      console.error('[OperationService] Get error:', error);
      throw error;
    }
  }

  /**
   * List operations for organization
   */
  async list(
    organizationId: string,
    options?: {
      status?: string;
      service?: string;
      limit?: number;
    }
  ): Promise<OperationRecord[]> {
    try {
      let query = this.supabase
        .from('autonomous_operations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.service) {
        query = query.eq('service', options.service);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list operations: ${error.message}`);
      }

      return (data || []).map(this.mapToOperationRecord);
    } catch (error) {
      console.error('[OperationService] List error:', error);
      throw error;
    }
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
  async getStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    success_rate: number;
  }> {
    try {
      const operations = await this.list(organizationId);

      const stats = {
        total: operations.length,
        pending: operations.filter(op => op.status === 'pending').length,
        in_progress: operations.filter(op => op.status === 'in_progress').length,
        completed: operations.filter(op => op.status === 'completed').length,
        failed: operations.filter(op => op.status === 'failed').length,
        success_rate: 0
      };

      const finished = stats.completed + stats.failed;
      if (finished > 0) {
        stats.success_rate = Math.round((stats.completed / finished) * 100);
      }

      return stats;
    } catch (error) {
      console.error('[OperationService] GetStats error:', error);
      throw error;
    }
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
 */
export function getOperationService(): OperationService {
  if (!operationServiceInstance) {
    operationServiceInstance = new OperationService();
  }
  return operationServiceInstance;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create operation (convenience function)
 */
export async function createOperation(request: CreateOperationRequest): Promise<OperationRecord> {
  const service = getOperationService();
  return service.create(request);
}

/**
 * Get operation (convenience function)
 */
export async function getOperation(operationId: string): Promise<OperationRecord | null> {
  const service = getOperationService();
  return service.get(operationId);
}

/**
 * List operations (convenience function)
 */
export async function listOperations(
  organizationId: string,
  options?: Parameters<OperationService['list']>[1]
): Promise<OperationRecord[]> {
  const service = getOperationService();
  return service.list(organizationId, options);
}
