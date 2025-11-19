/**
 * Tests for ConsentManager - GDPR Compliance
 * Tests consent withdrawal, audit trails, and compliance requirements
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsentManager } from '@/lib/autonomous/security/consent-manager';
import { createMockSupabaseClient } from '__tests__/utils/consent/supabase-mock';
import type { ConsentRecord } from '@/lib/autonomous/security/consent-manager';

describe('ConsentManager - GDPR Compliance', () => {
  let consentManager: ConsentManager;
  let mockSupabaseClient: any;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();

    mockOperations = {
      insertConsent: jest.fn(),
      selectConsent: jest.fn(),
      updateConsentRevoked: jest.fn(),
      updateConsentRevokedById: jest.fn(),
      updateConsentExpiry: jest.fn(),
      bulkRevokeForService: jest.fn(),
      mapToConsentRecord: jest.fn((data) => ({
        id: data.id,
        organizationId: data.organization_id ?? data.organizationId,
        userId: data.user_id ?? data.userId,
        service: data.service,
        operation: data.operation,
        permissions: data.permissions,
        grantedAt: data.granted_at ?? data.grantedAt,
        expiresAt: data.expires_at ?? data.expiresAt ?? null,
        revokedAt: data.revoked_at ?? data.revokedAt ?? null,
        isActive: data.is_active ?? data.isActive,
        consentVersion: data.consent_version ?? data.consentVersion,
        createdAt: data.created_at ?? data.createdAt
      }))
    };

    consentManager = new ConsentManager(mockSupabaseClient, mockOperations);
  });

  describe('Consent Withdrawal (GDPR Article 7.3)', () => {
    it('should allow user to withdraw consent at any time', async () => {
      mockOperations.updateConsentRevoked.mockResolvedValue(undefined);

      await consentManager.revoke('org-123', 'woocommerce', 'api_key_generation');

      expect(mockOperations.updateConsentRevoked).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'woocommerce',
        'api_key_generation'
      );
    });

    it('should verify consent is no longer valid after withdrawal', async () => {
      // First verify consent exists (before revocation)
      const activeConsent = {
        id: 'consent-123',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read', 'write'],
        granted_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: null,
        is_active: true,
        consent_version: '1.0',
        created_at: new Date().toISOString()
      };
      mockOperations.selectConsent.mockResolvedValueOnce(activeConsent);

      const beforeRevoke = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');
      expect(beforeRevoke.hasConsent).toBe(true);

      // Simulate withdrawal - consent becomes inactive
      const revokedConsent = {
        ...activeConsent,
        revoked_at: new Date().toISOString(),
        is_active: false
      };
      mockOperations.selectConsent.mockResolvedValueOnce(null); // Revoked consents not returned

      const afterRevoke = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');
      expect(afterRevoke.hasConsent).toBe(false);
    });

    it('should handle withdrawal of specific consent by ID', async () => {
      mockOperations.updateConsentRevokedById.mockResolvedValue(undefined);

      await consentManager.revokeById('org-123', 'consent-789');

      expect(mockOperations.updateConsentRevokedById).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'consent-789'
      );
    });

    it('should support bulk withdrawal for entire service', async () => {
      mockOperations.bulkRevokeForService.mockResolvedValue(5); // 5 consents revoked

      const count = await consentManager.revokeAllForService('org-123', 'woocommerce');

      expect(count).toBe(5);
      expect(mockOperations.bulkRevokeForService).toHaveBeenCalledWith(
        mockSupabaseClient,
        'org-123',
        'woocommerce'
      );
    });
  });

  describe('Consent Audit Trail (GDPR Article 30)', () => {
    it('should provide complete history of consents', async () => {
      const mockConsents: ConsentRecord[] = [
        {
          id: 'consent-1',
          organizationId: 'org-123',
          userId: 'user-456',
          service: 'woocommerce',
          operation: 'api_key_generation',
          permissions: ['read', 'write'],
          grantedAt: new Date('2025-01-01').toISOString(),
          expiresAt: null,
          revokedAt: new Date('2025-01-15').toISOString(),
          isActive: false,
          consentVersion: '1.0',
          createdAt: new Date('2025-01-01').toISOString()
        },
        {
          id: 'consent-2',
          organizationId: 'org-123',
          userId: 'user-456',
          service: 'woocommerce',
          operation: 'order_sync',
          permissions: ['read'],
          grantedAt: new Date('2025-01-10').toISOString(),
          expiresAt: null,
          revokedAt: null,
          isActive: true,
          consentVersion: '1.0',
          createdAt: new Date('2025-01-10').toISOString()
        }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockConsents.map(c => ({
          id: c.id,
          organization_id: c.organizationId,
          user_id: c.userId,
          service: c.service,
          operation: c.operation,
          permissions: c.permissions,
          granted_at: c.grantedAt,
          expires_at: c.expiresAt,
          revoked_at: c.revokedAt,
          is_active: c.isActive,
          consent_version: c.consentVersion,
          created_at: c.createdAt
        })), error: null })
      });

      const history = await consentManager.list('org-123');

      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({ id: 'consent-1', revokedAt: expect.any(String) });
      expect(history[1]).toMatchObject({ id: 'consent-2', isActive: true });
    });

    it('should track consent version changes', async () => {
      const oldVersionConsent = {
        id: 'consent-old',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'api_key_generation',
        permissions: ['read'],
        granted_at: new Date('2024-01-01').toISOString(),
        expires_at: null,
        revoked_at: null,
        is_active: true,
        consent_version: '0.9', // Old version
        created_at: new Date('2024-01-01').toISOString()
      };

      mockOperations.selectConsent.mockResolvedValue(oldVersionConsent);

      const verification = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');

      expect(verification.consentRecord?.consentVersion).toBe('0.9');
      // Application should handle version differences
    });
  });

  describe('Consent Statistics & Reporting', () => {
    it('should provide consent statistics for compliance reporting', async () => {
      const mockAllConsents = [
        { id: '1', is_active: true, revoked_at: null, expires_at: null, granted_at: new Date().toISOString(), organization_id: 'org-123', user_id: 'user-456', service: 'woo', operation: 'op1', permissions: ['read'], consent_version: '1.0', created_at: new Date().toISOString() },
        { id: '2', is_active: true, revoked_at: null, expires_at: null, granted_at: new Date().toISOString(), organization_id: 'org-123', user_id: 'user-456', service: 'woo', operation: 'op2', permissions: ['read'], consent_version: '1.0', created_at: new Date().toISOString() },
        { id: '3', is_active: false, revoked_at: new Date().toISOString(), expires_at: null, granted_at: new Date().toISOString(), organization_id: 'org-123', user_id: 'user-456', service: 'woo', operation: 'op3', permissions: ['read'], consent_version: '1.0', created_at: new Date().toISOString() },
        { id: '4', is_active: true, revoked_at: null, expires_at: new Date(Date.now() - 86400000).toISOString(), granted_at: new Date().toISOString(), organization_id: 'org-123', user_id: 'user-456', service: 'woo', operation: 'op4', permissions: ['read'], consent_version: '1.0', created_at: new Date().toISOString() }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAllConsents, error: null })
      });

      const stats = await consentManager.getStats('org-123');

      expect(stats).toEqual({
        total: 4,
        active: 3, // consents with is_active: true
        revoked: 1, // consents with revoked_at not null
        expired: 1 // consents with expires_at in past and not revoked
      });
    });
  });

  describe('Scope-Based Permissions (GDPR Principle of Data Minimization)', () => {
    it('should verify specific permission within consent', async () => {
      const consent = {
        id: 'consent-123',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'order_sync',
        permissions: ['read', 'write'], // Limited permissions
        granted_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: null,
        is_active: true,
        consent_version: '1.0',
        created_at: new Date().toISOString()
      };

      mockOperations.selectConsent.mockResolvedValue(consent);

      const hasRead = await consentManager.hasPermission('org-123', 'woocommerce', 'order_sync', 'read');
      const hasWrite = await consentManager.hasPermission('org-123', 'woocommerce', 'order_sync', 'write');
      const hasDelete = await consentManager.hasPermission('org-123', 'woocommerce', 'order_sync', 'delete');

      expect(hasRead).toBe(true);
      expect(hasWrite).toBe(true);
      expect(hasDelete).toBe(false); // Not granted
    });

    it('should prevent scope escalation attempts', async () => {
      const limitedConsent = {
        id: 'consent-123',
        organization_id: 'org-123',
        user_id: 'user-456',
        service: 'woocommerce',
        operation: 'product_view',
        permissions: ['read'], // Read-only
        granted_at: new Date().toISOString(),
        expires_at: null,
        revoked_at: null,
        is_active: true,
        consent_version: '1.0',
        created_at: new Date().toISOString()
      };

      mockOperations.selectConsent.mockResolvedValue(limitedConsent);

      // Attempt to check write permission
      const hasWrite = await consentManager.hasPermission('org-123', 'woocommerce', 'product_view', 'write');

      expect(hasWrite).toBe(false); // Escalation prevented
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle missing Supabase client gracefully', async () => {
      const invalidManager = new ConsentManager(null);

      await expect(
        invalidManager.grant('org-123', 'user-456', {
          service: 'test',
          operation: 'test',
          permissions: ['read']
        })
      ).rejects.toThrow('Supabase client not initialized');
    });

    it('should handle database errors during consent operations', async () => {
      mockOperations.updateConsentRevoked.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        consentManager.revoke('org-123', 'woocommerce', 'api_key_generation')
      ).rejects.toThrow('Database connection failed');
    });
  });
});
