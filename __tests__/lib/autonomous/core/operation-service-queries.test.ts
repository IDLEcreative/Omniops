/**
 * Tests for OperationService query methods
 * Tests get(), list(), and getStats()
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OperationService } from '@/lib/autonomous/core/operation-service';
import {
  createMockOperations,
  createMockVerifyConsent,
  createMockSupabaseClient,
  createMockOperationData
} from './helpers/operation-test-helpers';

describe('OperationService Queries', () => {
  let operationService: OperationService;
  let mockOperations: ReturnType<typeof createMockOperations>;
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperations = createMockOperations();
    mockSupabaseClient = createMockSupabaseClient();

    operationService = new OperationService(
      mockSupabaseClient as any,
      mockOperations as any,
      { verifyConsent: createMockVerifyConsent() }
    );
  });

  describe('get', () => {
    it('should retrieve operation by ID', async () => {
      const mockData = createMockOperationData({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        total_steps: 10,
        current_step: 5
      });

      mockOperations.selectOperationById.mockResolvedValue(mockData);

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
        createMockOperationData({ id: 'op-1', status: 'completed', total_steps: 10, current_step: 10 }),
        createMockOperationData({ id: 'op-2', service: 'shopify', operation: 'product_import', status: 'pending' })
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

  describe('getStats', () => {
    it('should calculate operation statistics', async () => {
      const mockData = [
        { status: 'pending', ...createMockOperationData({ id: '1' }) },
        { status: 'in_progress', ...createMockOperationData({ id: '2' }) },
        { status: 'completed', ...createMockOperationData({ id: '3' }) },
        { status: 'completed', ...createMockOperationData({ id: '4' }) },
        { status: 'completed', ...createMockOperationData({ id: '5' }) },
        { status: 'failed', ...createMockOperationData({ id: '6' }) }
      ] as any;

      mockOperations.selectOperations.mockResolvedValue(mockData);

      const stats = await operationService.getStats('org-123');

      expect(stats.total).toBe(6);
      expect(stats.pending).toBe(1);
      expect(stats.in_progress).toBe(1);
      expect(stats.completed).toBe(3);
      expect(stats.failed).toBe(1);
      expect(stats.success_rate).toBe(75);
    });

    it('should handle zero operations', async () => {
      mockOperations.selectOperations.mockResolvedValue([]);

      const stats = await operationService.getStats('org-123');

      expect(stats.total).toBe(0);
      expect(stats.success_rate).toBe(0);
    });
  });
});
