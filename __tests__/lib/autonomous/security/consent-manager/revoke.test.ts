/**
 * Tests for ConsentManager.revoke*() methods
 * Tests consent revocation by service/operation and by ID
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsentManager } from '@/lib/autonomous/security/consent-manager';
import { createMockSupabaseClient } from '__tests__/utils/consent/supabase-mock';

describe('ConsentManager revoke methods', () => {
  let consentManager: ConsentManager;
  let mockSupabaseClient: any;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();

    // Create mock operations using dependency injection
    mockOperations = {
      updateConsentRevoked: jest.fn().mockResolvedValue(undefined),
      updateConsentRevokedById: jest.fn().mockResolvedValue(undefined),
      bulkRevokeForService: jest.fn().mockResolvedValue(5) // Returns count of revoked consents
    };

    // Use dependency injection to provide mock operations
    consentManager = new ConsentManager(mockSupabaseClient, mockOperations);
  });

  describe('revoke()', () => {
    it('should have revoke method', () => {
      expect(typeof consentManager.revoke).toBe('function');
    });

    it('should call updateConsentRevoked with correct parameters', async () => {
      await consentManager.revoke('org-123', 'woocommerce', 'api_key_generation');

      expect(mockOperations.updateConsentRevoked).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'woocommerce',
        'api_key_generation'
      );
    });
  });

  describe('revokeById()', () => {
    it('should have revokeById method', () => {
      expect(typeof consentManager.revokeById).toBe('function');
    });

    it('should call updateConsentRevokedById with correct parameters', async () => {
      await consentManager.revokeById('org-123', 'consent-123');

      expect(mockOperations.updateConsentRevokedById).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'consent-123'
      );
    });
  });
});
