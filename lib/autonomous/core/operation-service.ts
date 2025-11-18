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

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyConsent as defaultVerifyConsent } from '../security/consent-manager';
import {
  insertOperation as defaultInsertOperation,
  selectOperationById as defaultSelectOperationById,
  selectOperations as defaultSelectOperations,
  updateOperationConsent as defaultUpdateOperationConsent,
  updateOperationCancelled as defaultUpdateOperationCancelled,
  mapToOperationRecord as defaultMapToOperationRecord
} from './operation-operations';

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
// Operations Interface for Dependency Injection
// ============================================================================

export interface OperationDatabaseOps {
  insertOperation: typeof defaultInsertOperation;
  selectOperationById: typeof defaultSelectOperationById;
  selectOperations: typeof defaultSelectOperations;
  updateOperationConsent: typeof defaultUpdateOperationConsent;
  updateOperationCancelled: typeof defaultUpdateOperationCancelled;
  mapToOperationRecord: typeof defaultMapToOperationRecord;
}

export interface OperationDependencies {
  verifyConsent?: typeof defaultVerifyConsent;
}

// ============================================================================
// Operation Service
// ============================================================================

export class OperationService {
  private supabase: SupabaseClient | null;
  private operations: OperationDatabaseOps;
  private verifyConsent: typeof defaultVerifyConsent;

  /**
   * Create OperationService instance
   * @param client Optional Supabase client (for testing). If not provided, creates one.
   * @param operations Optional operations (for testing). If not provided, uses defaults.
   * @param dependencies Optional dependencies including verifyConsent (for testing).
   */
  constructor(
    client?: SupabaseClient | null,
    operations?: Partial<OperationDatabaseOps>,
    dependencies?: OperationDependencies
  ) {
    this.supabase = client || createServiceRoleClientSync();

    // Use provided operations or defaults
    this.operations = {
      insertOperation: operations?.insertOperation || defaultInsertOperation,
      selectOperationById: operations?.selectOperationById || defaultSelectOperationById,
      selectOperations: operations?.selectOperations || defaultSelectOperations,
      updateOperationConsent: operations?.updateOperationConsent || defaultUpdateOperationConsent,
      updateOperationCancelled: operations?.updateOperationCancelled || defaultUpdateOperationCancelled,
      mapToOperationRecord: operations?.mapToOperationRecord || defaultMapToOperationRecord
    };

    // Use provided verifyConsent or default
    this.verifyConsent = dependencies?.verifyConsent || defaultVerifyConsent;
  }

  /**
   * Create a new autonomous operation
   */
  async create(request: CreateOperationRequest): Promise<OperationRecord> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const consentVerification = await this.verifyConsent(request.organizationId, request.service, request.operation);
    const status = consentVerification.hasConsent ? 'pending' : 'awaiting_consent';
    const consent_given = consentVerification.hasConsent;

    const data = await this.operations.insertOperation(this.supabase, {
      organization_id: request.organizationId,
      user_id: request.userId || null,
      service: request.service,
      operation: request.operation,
      workflow_id: request.workflowId || null,
      status,
      consent_given,
      consent_timestamp: consent_given ? new Date().toISOString() : null,
      execution_metadata: request.metadata || {}
    });

    if (consent_given) {
      console.log('[OperationService] Operation created:', {
        id: data.id,
        service: request.service,
        operation: request.operation
      });
    }

    return this.operations.mapToOperationRecord(data);
  }

  /**
   * Get operation by ID
   */
  async get(operationId: string): Promise<OperationRecord | null> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const data = await this.operations.selectOperationById(this.supabase, operationId);
    if (!data) return null;
    return this.operations.mapToOperationRecord(data);
  }

  /**
   * List operations for organization
   */
  async list(
    organizationId: string,
    options?: { status?: string; service?: string; limit?: number }
  ): Promise<OperationRecord[]> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const data = await this.operations.selectOperations(this.supabase, organizationId, options);
    return data.map(item => this.operations.mapToOperationRecord(item));
  }

  /**
   * Update operation consent
   */
  async grantConsent(operationId: string): Promise<void> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      await this.operations.updateOperationConsent(this.supabase, operationId);
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
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      await this.operations.updateOperationCancelled(this.supabase, operationId);
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
}

// ============================================================================
// Singleton Instance
// ============================================================================

let operationServiceInstance: OperationService | null = null;

/**
 * Get singleton operation service instance
 * @param client Optional Supabase client (for testing)
 * @param operations Optional operations (for testing)
 * @param dependencies Optional dependencies (for testing)
 */
export function getOperationService(
  client?: SupabaseClient | null,
  operations?: Partial<OperationDatabaseOps>,
  dependencies?: OperationDependencies
): OperationService {
  if (!operationServiceInstance) {
    operationServiceInstance = new OperationService(client, operations, dependencies);
  }
  return operationServiceInstance;
}

// ============================================================================
// Convenience Functions (Re-exported from helpers)
// ============================================================================

export { createOperation, getOperation, listOperations } from './operation-helpers';
export { updateOperation } from './operation-operations';
