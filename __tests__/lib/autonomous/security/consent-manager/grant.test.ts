/**
 * Tests for ConsentManager.grant()
 * Tests consent granting, validation, and error handling
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsentManager } from '@/lib/autonomous/security/consent-manager';
import { createMockSupabaseClient } from '__tests__/utils/consent/supabase-mock';
import {
  validConsentRequest,
  invalidEmptyPermissionsRequest,
  consentWithExpiryRequest
} from '__tests__/utils/consent/mock-consent-data';

describe('ConsentManager.grant()', () => {
  let consentManager: ConsentManager;
  let mockSupabaseClient: any;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();

    // Create mock operations using dependency injection
    mockOperations = {
      insertConsent: jest.fn().mockResolvedValue({
        id: 'consent-123',
        organizationId: 'org-123',
        userId: 'user-456',
        service: 'test-service',
        operation: 'test-operation',
        permissions: ['read', 'write'],
        grantedAt: new Date().toISOString(),
        expiresAt: null,
        revokedAt: null,
        isActive: true,
        consentVersion: '1.0',
        createdAt: new Date().toISOString()
      }),
      mapToConsentRecord: jest.fn((data) => ({
        id: data.id,
        organizationId: data.organization_id || data.organizationId,
        userId: data.user_id || data.userId,
        service: data.service,
        operation: data.operation,
        permissions: data.permissions,
        grantedAt: data.granted_at || data.grantedAt,
        expiresAt: data.expires_at || data.expiresAt,
        revokedAt: data.revoked_at || data.revokedAt,
        isActive: data.is_active || data.isActive,
        consentVersion: data.consent_version || data.consentVersion,
        createdAt: data.created_at || data.createdAt
      }))
    };

    // Use dependency injection to provide mock operations
    consentManager = new ConsentManager(mockSupabaseClient, mockOperations);
  });

  it('should validate request has at least one permission', async () => {
    // This test validates input even without mocking database calls
    await expect(
      consentManager.grant('org-123', 'user-456', invalidEmptyPermissionsRequest)
    ).rejects.toThrow('At least one permission required');
  });

  it('should call insertConsent with correct parameters', async () => {
    // Grant consent using our mock operations
    const result = await consentManager.grant('org-123', 'user-456', validConsentRequest);

    // Verify insertConsent was called with correct parameters
    expect(mockOperations.insertConsent).toHaveBeenCalledWith(
      mockSupabaseClient,
      'org-123',
      'user-456',
      validConsentRequest,
      '1.0'
    );

    // Verify we got back the expected consent record
    expect(result).toEqual({
      id: 'consent-123',
      organizationId: 'org-123',
      userId: 'user-456',
      service: 'test-service',
      operation: 'test-operation',
      permissions: ['read', 'write'],
      grantedAt: expect.any(String),
      expiresAt: null,
      revokedAt: null,
      isActive: true,
      consentVersion: '1.0',
      createdAt: expect.any(String)
    });
  });

  it('should handle expiration dates in requests', async () => {
    // Set up mock to return consent with expiry
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // 24 hours from now
    mockOperations.insertConsent.mockResolvedValue({
      id: 'consent-456',
      organizationId: 'org-123',
      userId: 'user-456',
      service: 'data-retention',
      operation: 'backup',
      permissions: ['read', 'write', 'delete'],
      grantedAt: new Date().toISOString(),
      expiresAt: futureDate,
      revokedAt: null,
      isActive: true,
      consentVersion: '1.0',
      createdAt: new Date().toISOString()
    });

    const result = await consentManager.grant('org-123', 'user-456', consentWithExpiryRequest);

    // Verify insertConsent was called
    expect(mockOperations.insertConsent).toHaveBeenCalled();

    // Verify expiration date was handled
    expect(result.expiresAt).toBe(futureDate);
  });
});
