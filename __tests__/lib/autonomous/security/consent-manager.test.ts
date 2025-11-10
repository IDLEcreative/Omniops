/**
 * Tests for ConsentManager
 * Tests consent granting, verification, revocation, and expiry handling
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsentManager } from '@/lib/autonomous/security/consent-manager';
import type { ConsentRequest } from '@/lib/autonomous/security/consent-types';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient)
}));

// Mock consent operations
jest.mock('@/lib/autonomous/security/consent-operations', () => ({
  insertConsent: jest.fn(),
  selectConsent: jest.fn(),
  updateConsentRevoked: jest.fn(),
  updateConsentRevokedById: jest.fn(),
  updateConsentExpiry: jest.fn(),
  bulkRevokeForService: jest.fn(),
  mapToConsentRecord: jest.fn((data) => ({
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
  }))
}));

import {
  insertConsent,
  selectConsent,
  updateConsentRevoked,
  updateConsentRevokedById,
  updateConsentExpiry,
  bulkRevokeForService,
  mapToConsentRecord
} from '@/lib/autonomous/security/consent-operations';

describe('ConsentManager', () => {
  let consentManager: ConsentManager;
  const mockInsertConsent = insertConsent as jest.MockedFunction<typeof insertConsent>;
  const mockSelectConsent = selectConsent as jest.MockedFunction<typeof selectConsent>;
  const mockUpdateConsentRevoked = updateConsentRevoked as jest.MockedFunction<typeof updateConsentRevoked>;
  const mockUpdateConsentRevokedById = updateConsentRevokedById as jest.MockedFunction<typeof updateConsentRevokedById>;
  const mockUpdateConsentExpiry = updateConsentExpiry as jest.MockedFunction<typeof updateConsentExpiry>;
  const mockBulkRevokeForService = bulkRevokeForService as jest.MockedFunction<typeof bulkRevokeForService>;

  beforeEach(() => {
    jest.clearAllMocks();
    consentManager = new ConsentManager();
  });

  describe('grant', () => {
    const validRequest: ConsentRequest = {
      service: 'woocommerce',
      operation: 'api_key_generation',
      permissions: ['read_products', 'create_api_keys']
    };

    it('should grant consent successfully', async () => {
      const mockConsent = {
        id: 'consent-123',
        organizationId: 'org-123',
        userId: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read_products', 'create_api_keys'],
        grantedAt: new Date().toISOString(),
        expiresAt: null,
        revokedAt: null,
        isActive: true,
        consentVersion: '1.0',
        createdAt: new Date().toISOString()
      };

      mockInsertConsent.mockResolvedValue(mockConsent);

      const result = await consentManager.grant('org-123', 'user-456', validRequest);

      expect(result).toEqual(mockConsent);
      expect(mockInsertConsent).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'user-456',
        validRequest,
        expect.any(String)
      );
    });

    it('should require at least one permission', async () => {
      const invalidRequest: ConsentRequest = {
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: []
      };

      await expect(
        consentManager.grant('org-123', 'user-456', invalidRequest)
      ).rejects.toThrow('At least one permission required');
    });

    it('should handle grant errors', async () => {
      mockInsertConsent.mockRejectedValue(new Error('Database error'));

      await expect(
        consentManager.grant('org-123', 'user-456', validRequest)
      ).rejects.toThrow('Database error');
    });

    it('should support expiration date', async () => {
      const requestWithExpiry: ConsentRequest = {
        ...validRequest,
        expiresAt: new Date('2025-12-31')
      };

      const mockConsent = {
        id: 'consent-124',
        organizationId: 'org-123',
        userId: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read_products'],
        grantedAt: new Date().toISOString(),
        expiresAt: '2025-12-31T00:00:00.000Z',
        revokedAt: null,
        isActive: true,
        consentVersion: '1.0',
        createdAt: new Date().toISOString()
      };

      mockInsertConsent.mockResolvedValue(mockConsent);

      const result = await consentManager.grant('org-123', 'user-456', requestWithExpiry);

      expect(result.expiresAt).toBe('2025-12-31T00:00:00.000Z');
    });
  });

  describe('verify', () => {
    it('should verify active consent', async () => {
      const mockData = {
        id: 'consent-123',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read_products', 'create_api_keys'],
        granted_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: null,
        is_active: true,
        consent_version: '1.0',
        created_at: new Date().toISOString()
      };

      mockSelectConsent.mockResolvedValue(mockData);

      const verification = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');

      expect(verification.hasConsent).toBe(true);
      expect(verification.consentRecord).toBeDefined();
      expect(verification.consentRecord?.permissions).toContain('read_products');
    });

    it('should return false when no consent exists', async () => {
      mockSelectConsent.mockResolvedValue(null);

      const verification = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');

      expect(verification.hasConsent).toBe(false);
      expect(verification.reason).toBe('No consent granted for this operation');
    });

    it('should return false for expired consent', async () => {
      const expiredDate = new Date();
      expiredDate.setFullYear(expiredDate.getFullYear() - 1);

      const mockData = {
        id: 'consent-expired',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read_products'],
        granted_at: expiredDate.toISOString(),
        expires_at: expiredDate.toISOString(),
        revoked_at: null,
        is_active: true,
        consent_version: '1.0',
        created_at: expiredDate.toISOString()
      };

      mockSelectConsent.mockResolvedValue(mockData);

      const verification = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');

      expect(verification.hasConsent).toBe(false);
      expect(verification.reason).toBe('Consent has expired');
    });

    it('should accept consent with future expiration', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockData = {
        id: 'consent-future',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read_products'],
        granted_at: new Date().toISOString(),
        expires_at: futureDate.toISOString(),
        revoked_at: null,
        is_active: true,
        consent_version: '1.0',
        created_at: new Date().toISOString()
      };

      mockSelectConsent.mockResolvedValue(mockData);

      const verification = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');

      expect(verification.hasConsent).toBe(true);
    });
  });

  describe('revoke', () => {
    it('should revoke consent', async () => {
      mockUpdateConsentRevoked.mockResolvedValue();

      await expect(
        consentManager.revoke('org-123', 'woocommerce', 'api_key_generation')
      ).resolves.not.toThrow();

      expect(mockUpdateConsentRevoked).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'woocommerce',
        'api_key_generation'
      );
    });

    it('should handle revoke errors', async () => {
      mockUpdateConsentRevoked.mockRejectedValue(new Error('Update failed'));

      await expect(
        consentManager.revoke('org-123', 'woocommerce', 'api_key_generation')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('revokeById', () => {
    it('should revoke consent by ID', async () => {
      mockUpdateConsentRevokedById.mockResolvedValue();

      await expect(
        consentManager.revokeById('org-123', 'consent-123')
      ).resolves.not.toThrow();

      expect(mockUpdateConsentRevokedById).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'consent-123'
      );
    });
  });

  describe('list', () => {
    it('should list all consents for organization', async () => {
      const mockData = [
        {
          id: 'consent-1',
          organization_id: 'org-123',
          user_id: 'user-456',
          service: 'woocommerce',
          operation: 'api_key_generation',
          permissions: ['read_products'],
          granted_at: new Date().toISOString(),
          expires_at: null,
          revoked_at: null,
          is_active: true,
          consent_version: '1.0',
          created_at: new Date().toISOString()
        },
        {
          id: 'consent-2',
          organization_id: 'org-123',
          user_id: 'user-789',
          service: 'shopify',
          operation: 'product_import',
          permissions: ['read', 'write'],
          granted_at: new Date().toISOString(),
          expires_at: null,
          revoked_at: new Date().toISOString(),
          is_active: false,
          consent_version: '1.0',
          created_at: new Date().toISOString()
        }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const consents = await consentManager.list('org-123');

      expect(consents).toHaveLength(2);
      expect(consents[0].service).toBe('woocommerce');
      expect(consents[1].service).toBe('shopify');
    });

    it('should filter by active only', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      await consentManager.list('org-123', { activeOnly: true });

      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should filter by service', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      await consentManager.list('org-123', { service: 'woocommerce' });

      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('service', 'woocommerce');
    });
  });

  describe('getById', () => {
    it('should get consent by ID', async () => {
      const mockData = {
        id: 'consent-123',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read_products'],
        granted_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: null,
        is_active: true,
        consent_version: '1.0',
        created_at: new Date().toISOString()
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const consent = await consentManager.getById('consent-123');

      expect(consent).not.toBeNull();
      expect(consent?.id).toBe('consent-123');
    });

    it('should return null for non-existent consent', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      });

      const consent = await consentManager.getById('non-existent');

      expect(consent).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('should return true when permission exists', async () => {
      const mockData = {
        id: 'consent-123',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read_products', 'write_orders'],
        granted_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: null,
        is_active: true,
        consent_version: '1.0',
        created_at: new Date().toISOString()
      };

      mockSelectConsent.mockResolvedValue(mockData);

      const hasPermission = await consentManager.hasPermission(
        'org-123',
        'woocommerce',
        'api_key_generation',
        'read_products'
      );

      expect(hasPermission).toBe(true);
    });

    it('should return false when permission does not exist', async () => {
      const mockData = {
        id: 'consent-123',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read_products'],
        granted_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: null,
        is_active: true,
        consent_version: '1.0',
        created_at: new Date().toISOString()
      };

      mockSelectConsent.mockResolvedValue(mockData);

      const hasPermission = await consentManager.hasPermission(
        'org-123',
        'woocommerce',
        'api_key_generation',
        'delete_products'
      );

      expect(hasPermission).toBe(false);
    });

    it('should return false when no consent', async () => {
      mockSelectConsent.mockResolvedValue(null);

      const hasPermission = await consentManager.hasPermission(
        'org-123',
        'woocommerce',
        'api_key_generation',
        'read_products'
      );

      expect(hasPermission).toBe(false);
    });
  });

  describe('extend', () => {
    it('should extend consent expiration', async () => {
      const newExpiresAt = new Date('2026-12-31');
      mockUpdateConsentExpiry.mockResolvedValue();

      await expect(
        consentManager.extend('org-123', 'woocommerce', 'api_key_generation', newExpiresAt)
      ).resolves.not.toThrow();

      expect(mockUpdateConsentExpiry).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'woocommerce',
        'api_key_generation',
        newExpiresAt
      );
    });
  });

  describe('getStats', () => {
    it('should calculate consent statistics', async () => {
      const now = new Date();
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);

      const mockData = [
        {
          id: 'consent-1',
          organization_id: 'org-123',
          user_id: 'user-456',
          service: 'woocommerce',
          operation: 'api_key_generation',
          permissions: ['read'],
          granted_at: now.toISOString(),
          expires_at: null,
          revoked_at: null,
          is_active: true,
          consent_version: '1.0',
          created_at: now.toISOString()
        },
        {
          id: 'consent-2',
          organization_id: 'org-123',
          user_id: 'user-789',
          service: 'shopify',
          operation: 'product_import',
          permissions: ['read', 'write'],
          granted_at: now.toISOString(),
          expires_at: null,
          revoked_at: now.toISOString(),
          is_active: false,
          consent_version: '1.0',
          created_at: now.toISOString()
        },
        {
          id: 'consent-3',
          organization_id: 'org-123',
          user_id: 'user-999',
          service: 'stripe',
          operation: 'payment_processing',
          permissions: ['read'],
          granted_at: past.toISOString(),
          expires_at: past.toISOString(),
          revoked_at: null,
          is_active: true,
          consent_version: '1.0',
          created_at: past.toISOString()
        }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const stats = await consentManager.getStats('org-123');

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2); // consent-1 and consent-3
      expect(stats.revoked).toBe(1); // consent-2
      expect(stats.expired).toBe(1); // consent-3
    });
  });

  describe('revokeAllForService', () => {
    it('should revoke all consents for a service', async () => {
      mockBulkRevokeForService.mockResolvedValue(5);

      const count = await consentManager.revokeAllForService('org-123', 'woocommerce');

      expect(count).toBe(5);
      expect(mockBulkRevokeForService).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'woocommerce'
      );
    });
  });
});
