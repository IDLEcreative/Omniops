/**
 * Tests for OperationService
 * Tests operation lifecycle management with organization_id
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OperationService, type CreateOperationRequest, type OperationDatabaseOps } from '@/lib/autonomous/core/operation-service';

// Mock Supabase client (not used for queries since we inject operations)
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

describe('OperationService', () => {
  let operationService: OperationService;
  let mockOperations: jest.Mocked<OperationDatabaseOps>;
  let mockVerifyConsent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock verifyConsent function
    mockVerifyConsent = jest.fn();

    // Create mock operations
    mockOperations = {
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

    // Pass mock Supabase client, operations, and dependencies to OperationService constructor
    operationService = new OperationService(
      mockSupabaseClient as any,
      mockOperations,
      { verifyConsent: mockVerifyConsent }
    );
  });

  describe('create', () => {
    const validRequest: CreateOperationRequest = {
      organizationId: 'org-123',
      userId: 'user-456',
      service: 'woocommerce',
      operation: 'api_key_generation',
      workflowId: 'workflow-789',
      metadata: { storeUrl: 'https://shop.example.com' }
    };

    it('should create operation in pending state when consent exists', async () => {
      // Mock verifyConsent to return consent granted
      mockVerifyConsent.mockResolvedValue({
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
      });

      const mockInsertData = {
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
        updated_at: new Date().toISOString()
      };

      mockOperations.insertOperation.mockResolvedValue(mockInsertData);

      const operation = await operationService.create(validRequest);

      expect(operation.status).toBe('pending');
      expect(operation.consentGiven).toBe(true);
      expect(operation.organizationId).toBe('org-123');
      expect(mockOperations.insertOperation).toHaveBeenCalledWith(
        mockSupabaseClient,
        expect.objectContaining({
          organization_id: 'org-123',
          service: 'woocommerce',
          operation: 'api_key_generation'
        })
      );
    });

    it('should create operation in awaiting_consent state when no consent', async () => {
      // Mock verifyConsent to return no consent
      mockVerifyConsent.mockResolvedValue({
        hasConsent: false,
        reason: 'No consent granted for this operation'
      });

      const mockInsertData = {
        id: 'op-124',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        workflow_id: 'workflow-789',
        status: 'awaiting_consent',
        consent_given: false,
        consent_timestamp: null,
        started_at: null,
        completed_at: null,
        total_steps: null,
        current_step: 0,
        result: null,
        execution_metadata: { storeUrl: 'https://shop.example.com' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockOperations.insertOperation.mockResolvedValue(mockInsertData);

      const operation = await operationService.create(validRequest);

      expect(operation.status).toBe('awaiting_consent');
      expect(operation.consentGiven).toBe(false);
      expect(operation.consentTimestamp).toBeNull();
    });

    it('should handle database errors', async () => {
      // Mock verifyConsent to return consent
      mockVerifyConsent.mockResolvedValue({ hasConsent: true });

      mockOperations.insertOperation.mockRejectedValue(
        new Error('Failed to insert operation: Database connection failed')
      );

      await expect(operationService.create(validRequest))
        .rejects.toThrow('Failed to insert operation: Database connection failed');
    });

    it('should allow operation without userId', async () => {
      // Mock verifyConsent to return consent
      mockVerifyConsent.mockResolvedValue({ hasConsent: true });

      const requestWithoutUser: CreateOperationRequest = {
        organizationId: 'org-123',
        service: 'woocommerce',
        operation: 'api_key_generation'
      };

      const mockInsertData = {
        id: 'op-125',
        organization_id: 'org-123',
        user_id: null,
        service: 'woocommerce',
        operation: 'api_key_generation',
        workflow_id: null,
        status: 'pending',
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        total_steps: null,
        current_step: 0,
        result: null,
        execution_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockOperations.insertOperation.mockResolvedValue(mockInsertData);

      const operation = await operationService.create(requestWithoutUser);

      expect(operation.userId).toBeNull();
    });
  });

  describe('get', () => {
    it('should retrieve operation by ID', async () => {
      const mockSelectData = {
        id: 'op-123',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        workflow_id: 'workflow-789',
        status: 'in_progress',
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: null,
        total_steps: 10,
        current_step: 5,
        result: null,
        execution_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockOperations.selectOperationById.mockResolvedValue(mockSelectData);

      const operation = await operationService.get('op-123');

      expect(operation).not.toBeNull();
      expect(operation?.id).toBe('op-123');
      expect(operation?.status).toBe('in_progress');
      expect(operation?.currentStep).toBe(5);
      expect(operation?.totalSteps).toBe(10);
      expect(mockOperations.selectOperationById).toHaveBeenCalledWith(mockSupabaseClient, 'op-123');
    });

    it('should return null for non-existent operation', async () => {
      mockOperations.selectOperationById.mockResolvedValue(null);

      const operation = await operationService.get('non-existent');

      expect(operation).toBeNull();
    });

    it('should throw on database errors', async () => {
      mockOperations.selectOperationById.mockRejectedValue(
        new Error('Failed to select operation: Database error')
      );

      await expect(operationService.get('op-123'))
        .rejects.toThrow('Failed to select operation: Database error');
    });
  });

  describe('list', () => {
    it('should list operations for organization', async () => {
      const mockData = [
        {
          id: 'op-1',
          organization_id: 'org-123',
          user_id: 'user-456',
          service: 'woocommerce',
          operation: 'api_key_generation',
          workflow_id: null,
          status: 'completed',
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          total_steps: 10,
          current_step: 10,
          result: { apiKey: 'ck_123' },
          execution_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'op-2',
          organization_id: 'org-123',
          user_id: 'user-456',
          service: 'shopify',
          operation: 'product_import',
          workflow_id: null,
          status: 'pending',
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          started_at: null,
          completed_at: null,
          total_steps: null,
          current_step: 0,
          result: null,
          execution_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      mockOperations.selectOperations.mockResolvedValue(mockData);

      const operations = await operationService.list('org-123');

      expect(operations).toHaveLength(2);
      expect(operations[0].service).toBe('woocommerce');
      expect(operations[1].service).toBe('shopify');
      expect(mockOperations.selectOperations).toHaveBeenCalledWith(mockSupabaseClient, 'org-123', undefined);
    });

    it('should filter by status', async () => {
      mockOperations.selectOperations.mockResolvedValue([]);

      await operationService.list('org-123', { status: 'pending' });

      expect(mockOperations.selectOperations).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('should filter by service', async () => {
      mockOperations.selectOperations.mockResolvedValue([]);

      await operationService.list('org-123', { service: 'woocommerce' });

      expect(mockOperations.selectOperations).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        expect.objectContaining({ service: 'woocommerce' })
      );
    });

    it('should apply limit', async () => {
      mockOperations.selectOperations.mockResolvedValue([]);

      await operationService.list('org-123', { limit: 10 });

      expect(mockOperations.selectOperations).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        expect.objectContaining({ limit: 10 })
      );
    });
  });

  describe('grantConsent', () => {
    it('should grant consent for awaiting operation', async () => {
      mockOperations.updateOperationConsent.mockResolvedValue(undefined);

      await expect(operationService.grantConsent('op-123')).resolves.not.toThrow();

      expect(mockOperations.updateOperationConsent).toHaveBeenCalledWith(mockSupabaseClient, 'op-123');
    });

    it('should handle database errors', async () => {
      mockOperations.updateOperationConsent.mockRejectedValue(
        new Error('Failed to update consent: Update failed')
      );

      await expect(operationService.grantConsent('op-123'))
        .rejects.toThrow('Failed to update consent: Update failed');
    });
  });

  describe('cancel', () => {
    it('should cancel pending operation', async () => {
      mockOperations.updateOperationCancelled.mockResolvedValue(undefined);

      await expect(operationService.cancel('op-123')).resolves.not.toThrow();

      expect(mockOperations.updateOperationCancelled).toHaveBeenCalledWith(mockSupabaseClient, 'op-123');
    });

    it('should handle database errors', async () => {
      mockOperations.updateOperationCancelled.mockRejectedValue(
        new Error('Failed to cancel operation: Cancellation failed')
      );

      await expect(operationService.cancel('op-123'))
        .rejects.toThrow('Failed to cancel operation: Cancellation failed');
    });
  });

  describe('getStats', () => {
    it('should calculate operation statistics', async () => {
      const mockData = [
        { status: 'pending', id: '1', organization_id: 'org-123', user_id: null, service: 's', operation: 'o', workflow_id: null, consent_given: true, consent_timestamp: null, started_at: null, completed_at: null, total_steps: null, current_step: 0, result: null, execution_metadata: {}, created_at: '', updated_at: '' },
        { status: 'in_progress', id: '2', organization_id: 'org-123', user_id: null, service: 's', operation: 'o', workflow_id: null, consent_given: true, consent_timestamp: null, started_at: null, completed_at: null, total_steps: null, current_step: 0, result: null, execution_metadata: {}, created_at: '', updated_at: '' },
        { status: 'completed', id: '3', organization_id: 'org-123', user_id: null, service: 's', operation: 'o', workflow_id: null, consent_given: true, consent_timestamp: null, started_at: null, completed_at: null, total_steps: null, current_step: 0, result: null, execution_metadata: {}, created_at: '', updated_at: '' },
        { status: 'completed', id: '4', organization_id: 'org-123', user_id: null, service: 's', operation: 'o', workflow_id: null, consent_given: true, consent_timestamp: null, started_at: null, completed_at: null, total_steps: null, current_step: 0, result: null, execution_metadata: {}, created_at: '', updated_at: '' },
        { status: 'completed', id: '5', organization_id: 'org-123', user_id: null, service: 's', operation: 'o', workflow_id: null, consent_given: true, consent_timestamp: null, started_at: null, completed_at: null, total_steps: null, current_step: 0, result: null, execution_metadata: {}, created_at: '', updated_at: '' },
        { status: 'failed', id: '6', organization_id: 'org-123', user_id: null, service: 's', operation: 'o', workflow_id: null, consent_given: true, consent_timestamp: null, started_at: null, completed_at: null, total_steps: null, current_step: 0, result: null, execution_metadata: {}, created_at: '', updated_at: '' }
      ] as any;

      mockOperations.selectOperations.mockResolvedValue(mockData);

      const stats = await operationService.getStats('org-123');

      expect(stats.total).toBe(6);
      expect(stats.pending).toBe(1);
      expect(stats.in_progress).toBe(1);
      expect(stats.completed).toBe(3);
      expect(stats.failed).toBe(1);
      expect(stats.success_rate).toBe(75); // 3 completed out of 4 finished
    });

    it('should handle zero operations', async () => {
      mockOperations.selectOperations.mockResolvedValue([]);

      const stats = await operationService.getStats('org-123');

      expect(stats.total).toBe(0);
      expect(stats.success_rate).toBe(0);
    });
  });
});
