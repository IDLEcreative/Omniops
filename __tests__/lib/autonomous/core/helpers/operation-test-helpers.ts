/**
 * Test helpers for OperationService tests
 */

import type { CreateOperationRequest } from '@/lib/autonomous/core/operation-service';

export function createMockOperations() {
  return {
    insertOperation: jest.fn(),
    selectOperationById: jest.fn(),
    selectOperations: jest.fn(),
    updateOperationConsent: jest.fn(),
    updateOperationCancelled: jest.fn(),
    mapToOperationRecord: jest.fn(data => ({
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
    }))
  };
}

export function createMockVerifyConsent() {
  return jest.fn();
}

export function createMockSupabaseClient() {
  return {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  };
}

export function createValidOperationRequest(): CreateOperationRequest {
  return {
    organizationId: 'org-123',
    userId: 'user-456',
    service: 'woocommerce',
    operation: 'api_key_generation',
    workflowId: 'workflow-789',
    metadata: { storeUrl: 'https://shop.example.com' }
  };
}

export function createMockOperationData(overrides: Partial<any> = {}) {
  return {
    id: 'op-123',
    organization_id: 'org-123',
    user_id: 'user-456',
    service: 'woocommerce',
    operation: 'api_key_generation',
    workflow_id: 'workflow-789',
    status: 'pending',
    consent_given: true,
    consent_timestamp: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    total_steps: null,
    current_step: 0,
    result: null,
    execution_metadata: { storeUrl: 'https://shop.example.com' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

export function createMockConsentResponse(hasConsent: boolean) {
  if (hasConsent) {
    return {
      hasConsent: true,
      consentRecord: {
        id: 'consent-123',
        organizationId: 'org-123',
        userId: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read', 'write'],
        grantedAt: new Date().toISOString(),
        isActive: true,
        consentVersion: '1.0',
        createdAt: new Date().toISOString()
      }
    };
  }
  return {
    hasConsent: false,
    reason: 'No consent granted for this operation'
  };
}
