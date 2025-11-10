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

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    consentManager = new ConsentManager(mockSupabaseClient);
  });

  describe('revoke()', () => {
    it('should have revoke method', () => {
      expect(typeof consentManager.revoke).toBe('function');
    });

    it('should accept organization, service, and operation parameters', async () => {
      const promise = consentManager.revoke('org-123', 'woocommerce', 'api_key_generation');
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('revokeById()', () => {
    it('should have revokeById method', () => {
      expect(typeof consentManager.revokeById).toBe('function');
    });

    it('should accept organization and consent ID parameters', async () => {
      const promise = consentManager.revokeById('org-123', 'consent-123');
      expect(promise).toBeInstanceOf(Promise);
    });
  });
});
