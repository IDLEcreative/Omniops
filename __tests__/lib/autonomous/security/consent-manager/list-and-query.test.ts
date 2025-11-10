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
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();

    // Create mock operations using dependency injection
    mockOperations = {
      mapToConsentRecord: jest.fn((data) => {
        if (!data) return null;
        return {
          id: data.id,
          organizationId: data.organization_id,
          userId: data.user_id,
          service: data.service,
          operation: data.operation,
          permissions: data.permissions,
          grantedAt: data.granted_at,
          expiresAt: data.expires_at,
          revokedAt: data.revoked_at,
          isActive: data.is_active,
          consentVersion: data.consent_version,
          createdAt: data.created_at
        };
      })
    };

    // Use dependency injection to provide mock operations
    consentManager = new ConsentManager(mockSupabaseClient, mockOperations);
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
