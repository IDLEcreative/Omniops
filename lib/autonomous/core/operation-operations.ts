/**
 * Database Operations for Autonomous Operations
 *
 * Provides data access functions for operation management.
 * Used by OperationService with dependency injection for testability.
 *
 * @module lib/autonomous/core/operation-operations
 */

import { createServerClient } from '@/lib/supabase/server';
import type { OperationRecord } from './operation-service';

/**
 * Insert a new operation record
 */
export const insertOperation = async (
  supabase: ReturnType<typeof createServerClient>,
  data: {
    organization_id: string;
    user_id: string | null;
    service: string;
    operation: string;
    workflow_id: string | null;
    status: string;
    consent_given: boolean;
    consent_timestamp: string | null;
    execution_metadata: Record<string, any>;
  }
): Promise<any> => {
  const { data: record, error } = await supabase
    .from('autonomous_operations')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert operation: ${error.message}`);
  }

  return record;
};

/**
 * Select operation by ID
 */
export const selectOperationById = async (
  supabase: ReturnType<typeof createServerClient>,
  operationId: string
): Promise<any | null> => {
  const { data, error } = await supabase
    .from('autonomous_operations')
    .select('*')
    .eq('id', operationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to select operation: ${error.message}`);
  }

  return data;
};

/**
 * Select operations for organization with filters
 */
export const selectOperations = async (
  supabase: ReturnType<typeof createServerClient>,
  organizationId: string,
  options?: { status?: string; service?: string; limit?: number }
): Promise<any[]> => {
  let query = supabase
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
    throw new Error(`Failed to select operations: ${error.message}`);
  }

  return data || [];
};

/**
 * Update operation consent
 */
export const updateOperationConsent = async (
  supabase: ReturnType<typeof createServerClient>,
  operationId: string
): Promise<void> => {
  const { error } = await supabase
    .from('autonomous_operations')
    .update({
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
      status: 'pending'
    })
    .eq('id', operationId)
    .eq('status', 'awaiting_consent');

  if (error) {
    throw new Error(`Failed to update consent: ${error.message}`);
  }
};

/**
 * Update operation status to cancelled
 */
export const updateOperationCancelled = async (
  supabase: ReturnType<typeof createServerClient>,
  operationId: string
): Promise<void> => {
  const { error } = await supabase
    .from('autonomous_operations')
    .update({ status: 'cancelled' })
    .eq('id', operationId)
    .in('status', ['pending', 'awaiting_consent']);

  if (error) {
    throw new Error(`Failed to cancel operation: ${error.message}`);
  }
};

/**
 * Map database record to OperationRecord type
 */
export const mapToOperationRecord = (data: any): OperationRecord => {
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
};
