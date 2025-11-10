/**
 * Tests for ConsentManager listing and query methods
 * Tests list(), getById(), and filtering capabilities
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsentManager } from '@/lib/autonomous/security/consent-manager';
import { createMockSupabaseClient } from '__tests__/utils/consent/supabase-mock';

describe('ConsentManager list and query methods', () => {
  let consentManager: ConsentManager;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    consentManager = new ConsentManager(mockSupabaseClient);
  });

  describe('list()', () => {
    it('should have list method', () => {
      expect(typeof consentManager.list).toBe('function');
    });

    it('should accept organization ID parameter', async () => {
      const promise = consentManager.list('org-123');
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should accept optional filter options', async () => {
      const promise = consentManager.list('org-123', { activeOnly: true });
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should accept service filter', async () => {
      const promise = consentManager.list('org-123', { service: 'woocommerce' });
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('getById()', () => {
    it('should have getById method', () => {
      expect(typeof consentManager.getById).toBe('function');
    });

    it('should accept consent ID parameter', async () => {
      const promise = consentManager.getById('consent-123');
      expect(promise).toBeInstanceOf(Promise);
    });
  });
});
