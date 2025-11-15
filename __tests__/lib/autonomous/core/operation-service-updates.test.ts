/**
 * Tests for OperationService update methods
 * Tests grantConsent() and cancel()
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OperationService } from '@/lib/autonomous/core/operation-service';
import {
  createMockOperations,
  createMockVerifyConsent,
  createMockSupabaseClient
} from './helpers/operation-test-helpers';

describe('OperationService Updates', () => {
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
});
