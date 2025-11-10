/**
 * Tests for ConsentManager.verify()
 * Tests consent verification with expiry, active status, and existence checks
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsentManager } from '@/lib/autonomous/security/consent-manager';
import { createMockSupabaseClient } from '__tests__/utils/consent/supabase-mock';

describe('ConsentManager.verify()', () => {
  let consentManager: ConsentManager;
  let mockSupabaseClient: any;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();

    // Create mock operations using dependency injection
    mockOperations = {
      selectConsent: jest.fn(),
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
    };

    // Use dependency injection to provide mock operations
    consentManager = new ConsentManager(mockSupabaseClient, mockOperations);
  });

  it('should have verify method', () => {
    expect(typeof consentManager.verify).toBe('function');
  });

  it('should return hasConsent:false when no consent exists', async () => {
    // Mock selectConsent to return null (no consent found)
    mockOperations.selectConsent.mockResolvedValue(null);

    const result = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');

    expect(result).toEqual({
      hasConsent: false,
      reason: 'No consent granted for this operation'
    });
  });

  it('should return hasConsent:true for valid active consent', async () => {
    // Mock selectConsent to return valid active consent
    const validConsent = {
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
    mockOperations.selectConsent.mockResolvedValue(validConsent);

    const result = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');

    expect(result.hasConsent).toBe(true);
    expect(result.consentRecord).toBeDefined();
  });

  it('should return hasConsent:false for expired consent', async () => {
    // Mock selectConsent to return expired consent
    const expiredConsent = {
      id: 'consent-123',
      organization_id: 'org-123',
      user_id: 'user-456',
      service: 'woocommerce',
      operation: 'api_key_generation',
      permissions: ['read'],
      granted_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      revoked_at: null,
      is_active: true,
      consent_version: '1.0',
      created_at: new Date().toISOString()
    };
    mockOperations.selectConsent.mockResolvedValue(expiredConsent);

    const result = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation');

    expect(result).toEqual({
      hasConsent: false,
      reason: 'Consent has expired'
    });
  });
});
