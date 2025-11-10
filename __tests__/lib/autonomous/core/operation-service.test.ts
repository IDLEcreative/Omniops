/**
 * Tests for OperationService
 * Tests operation lifecycle management with organization_id
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OperationService, type CreateOperationRequest } from '@/lib/autonomous/core/operation-service';

// Mock Supabase with chainable query methods
const createMockQuery = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null })
});

const mockSupabaseClient = {
  from: jest.fn(() => createMockQuery()),
  auth: {
    getUser: jest.fn()
  }
};

// Consent manager is mocked via moduleNameMapper in jest.config.js

import { verifyConsent } from '@/lib/autonomous/security/consent-manager';

describe('OperationService', () => {
  let operationService: OperationService;
  const mockVerifyConsent = verifyConsent as jest.MockedFunction<typeof verifyConsent>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Pass mock Supabase client to OperationService constructor
    operationService = new OperationService(mockSupabaseClient as any);
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

      const mockInsertResponse = {
        data: {
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
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
      });

      const operation = await operationService.create(validRequest);

      expect(operation.status).toBe('pending');
      expect(operation.consentGiven).toBe(true);
      expect(operation.organizationId).toBe('org-123');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('autonomous_operations');
    });

    it('should create operation in awaiting_consent state when no consent', async () => {
      mockVerifyConsent.mockResolvedValue({
        hasConsent: false,
        reason: 'No consent granted for this operation'
      });

      const mockInsertResponse = {
        data: {
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
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
      });

      const operation = await operationService.create(validRequest);

      expect(operation.status).toBe('awaiting_consent');
      expect(operation.consentGiven).toBe(false);
      expect(operation.consentTimestamp).toBeNull();
    });

    it('should handle database errors', async () => {
      mockVerifyConsent.mockResolvedValue({ hasConsent: true });

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      });

      await expect(operationService.create(validRequest))
        .rejects.toThrow('Failed to create operation: Database connection failed');
    });

    it('should allow operation without userId', async () => {
      mockVerifyConsent.mockResolvedValue({ hasConsent: true });

      const requestWithoutUser: CreateOperationRequest = {
        organizationId: 'org-123',
        service: 'woocommerce',
        operation: 'api_key_generation'
      };

      const mockInsertResponse = {
        data: {
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
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
      });

      const operation = await operationService.create(requestWithoutUser);

      expect(operation.userId).toBeNull();
    });
  });

  describe('get', () => {
    it('should retrieve operation by ID', async () => {
      const mockSelectResponse = {
        data: {
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
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSelectResponse)
      });

      const operation = await operationService.get('op-123');

      expect(operation).not.toBeNull();
      expect(operation?.id).toBe('op-123');
      expect(operation?.status).toBe('in_progress');
      expect(operation?.currentStep).toBe(5);
      expect(operation?.totalSteps).toBe(10);
    });

    it('should return null for non-existent operation', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      });

      const operation = await operationService.get('non-existent');

      expect(operation).toBeNull();
    });

    it('should throw on database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'ERROR', message: 'Database error' }
        })
      });

      await expect(operationService.get('op-123'))
        .rejects.toThrow('Failed to get operation: Database error');
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

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const operations = await operationService.list('org-123');

      expect(operations).toHaveLength(2);
      expect(operations[0].service).toBe('woocommerce');
      expect(operations[1].service).toBe('shopify');
    });

    it('should filter by status', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      await operationService.list('org-123', { status: 'pending' });

      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('status', 'pending');
    });

    it('should filter by service', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      await operationService.list('org-123', { service: 'woocommerce' });

      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('service', 'woocommerce');
    });

    it('should apply limit', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: mockLimit
      });

      await operationService.list('org-123', { limit: 10 });

      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe('grantConsent', () => {
    it('should grant consent for awaiting operation', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await expect(operationService.grantConsent('op-123')).resolves.not.toThrow();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('autonomous_operations');
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          consent_given: true,
          status: 'pending'
        })
      );
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Update failed' }
        })
      });

      await expect(operationService.grantConsent('op-123'))
        .rejects.toThrow('Failed to grant consent: Update failed');
    });
  });

  describe('cancel', () => {
    it('should cancel pending operation', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null })
      });

      await expect(operationService.cancel('op-123')).resolves.not.toThrow();

      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({ status: 'cancelled' });
      expect(mockSupabaseClient.from().in).toHaveBeenCalledWith('status', ['pending', 'awaiting_consent']);
    });
  });

  describe('getStats', () => {
    it('should calculate operation statistics', async () => {
      const mockData = [
        { status: 'pending' },
        { status: 'in_progress' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
        { status: 'failed' }
      ] as any;

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const stats = await operationService.getStats('org-123');

      expect(stats.total).toBe(6);
      expect(stats.pending).toBe(1);
      expect(stats.in_progress).toBe(1);
      expect(stats.completed).toBe(3);
      expect(stats.failed).toBe(1);
      expect(stats.success_rate).toBe(75); // 3 completed out of 4 finished
    });

    it('should handle zero operations', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      const stats = await operationService.getStats('org-123');

      expect(stats.total).toBe(0);
      expect(stats.success_rate).toBe(0);
    });
  });
});
