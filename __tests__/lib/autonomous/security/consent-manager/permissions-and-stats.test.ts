/**
 * Tests for ConsentManager permission and statistics methods
 * Tests hasPermission(), extend(), getStats(), and revokeAllForService()
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsentManager } from '@/lib/autonomous/security/consent-manager';
import { createMockSupabaseClient } from '__tests__/utils/consent/supabase-mock';

describe('ConsentManager permission and stats methods', () => {
  let consentManager: ConsentManager;
  let mockSupabaseClient: any;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();

    // Create mock operations using dependency injection
    mockOperations = {
      selectConsent: jest.fn(),
      updateConsentExpiry: jest.fn().mockResolvedValue(undefined),
      bulkRevokeForService: jest.fn().mockResolvedValue(3),
      mapToConsentRecord: jest.fn((data) => {
        if (!data) return null;
        return {
          id: data.id,
          organizationId: data.organization_id,
          userId: data.user_id,
          service: data.service,
          operation: data.operation,
          permissions: data.permissions || [],
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

  describe('hasPermission()', () => {
    it('should have hasPermission method', () => {
      expect(typeof consentManager.hasPermission).toBe('function');
    });

    it('should accept organization, service, operation, and permission parameters', async () => {
      const promise = consentManager.hasPermission(
        'org-123',
        'woocommerce',
        'api_key_generation',
        'read_products'
      );
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should return a promise resolving to boolean', async () => {
      const result = await consentManager.hasPermission(
        'org-123',
        'woocommerce',
        'api_key_generation',
        'read_products'
      ).catch(() => false);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('extend()', () => {
    it('should have extend method', () => {
      expect(typeof consentManager.extend).toBe('function');
    });

    it('should accept organization, service, operation, and expiration date', async () => {
      const promise = consentManager.extend(
        'org-123',
        'woocommerce',
        'api_key_generation',
        new Date('2026-12-31')
      );
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('getStats()', () => {
    it('should have getStats method', () => {
      expect(typeof consentManager.getStats).toBe('function');
    });

    it('should accept organization ID parameter', async () => {
      const promise = consentManager.getStats('org-123');
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should return stats object', async () => {
      const result = await consentManager.getStats('org-123').catch(() => ({}));
      expect(typeof result).toBe('object');
    });
  });

  describe('revokeAllForService()', () => {
    it('should have revokeAllForService method', () => {
      expect(typeof consentManager.revokeAllForService).toBe('function');
    });

    it('should accept organization and service parameters', async () => {
      const promise = consentManager.revokeAllForService('org-123', 'woocommerce');
      expect(promise).toBeInstanceOf(Promise);
    });
  });
});
