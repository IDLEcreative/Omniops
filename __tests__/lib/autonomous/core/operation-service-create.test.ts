/**
 * Tests for OperationService.create()
 * Tests operation creation with consent handling
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OperationService } from '@/lib/autonomous/core/operation-service';
import {
  createMockOperations,
  createMockVerifyConsent,
  createMockSupabaseClient,
  createValidOperationRequest,
  createMockOperationData,
  createMockConsentResponse
} from './helpers/operation-test-helpers';

describe('OperationService.create', () => {
  let operationService: OperationService;
  let mockOperations: ReturnType<typeof createMockOperations>;
  let mockVerifyConsent: ReturnType<typeof createMockVerifyConsent>;
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyConsent = createMockVerifyConsent();
    mockOperations = createMockOperations();
    mockSupabaseClient = createMockSupabaseClient();

    operationService = new OperationService(
      mockSupabaseClient as any,
      mockOperations as any,
      { verifyConsent: mockVerifyConsent }
    );
  });

  it('should create operation in pending state when consent exists', async () => {
    mockVerifyConsent.mockResolvedValue(createMockConsentResponse(true));
    mockOperations.insertOperation.mockResolvedValue(createMockOperationData());

    const operation = await operationService.create(createValidOperationRequest());

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
    mockVerifyConsent.mockResolvedValue(createMockConsentResponse(false));
    mockOperations.insertOperation.mockResolvedValue(
      createMockOperationData({
        id: 'op-124',
        status: 'awaiting_consent',
        consent_given: false,
        consent_timestamp: null
      })
    );

    const operation = await operationService.create(createValidOperationRequest());

    expect(operation.status).toBe('awaiting_consent');
    expect(operation.consentGiven).toBe(false);
    expect(operation.consentTimestamp).toBeNull();
  });

  it('should handle database errors', async () => {
    mockVerifyConsent.mockResolvedValue(createMockConsentResponse(true));
    mockOperations.insertOperation.mockRejectedValue(
      new Error('Failed to insert operation: Database connection failed')
    );

    await expect(operationService.create(createValidOperationRequest()))
      .rejects.toThrow('Failed to insert operation: Database connection failed');
  });

  it('should allow operation without userId', async () => {
    mockVerifyConsent.mockResolvedValue(createMockConsentResponse(true));
    const requestWithoutUser = {
      organizationId: 'org-123',
      service: 'woocommerce',
      operation: 'api_key_generation'
    };

    mockOperations.insertOperation.mockResolvedValue(
      createMockOperationData({ id: 'op-125', user_id: null, workflow_id: null })
    );

    const operation = await operationService.create(requestWithoutUser);

    expect(operation.userId).toBeNull();
  });
});
