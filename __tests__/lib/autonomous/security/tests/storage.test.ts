/**
 * Tests for credential storage operations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CredentialVault, type CredentialData } from '@/lib/autonomous/security/credential-vault';
import { createMockOperations, mockSupabaseClient } from './setup';

describe('CredentialVault - Storage', () => {
  let vault: CredentialVault;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperations = createMockOperations();
    vault = new CredentialVault(mockSupabaseClient as any, mockOperations);
  });

  it('should store encrypted credential', async () => {
    const credential: CredentialData = {
      value: 'ck_abc123def456',
      metadata: { scopes: ['read_products', 'write_orders'] },
      expiresAt: new Date('2025-12-31')
    };

    const mockUpsertResponse = {
      id: 'cred-123',
      organization_id: 'org-123',
      service: 'woocommerce',
      credential_type: 'api_key',
      encrypted_credential: Buffer.from('encrypted_ck_abc123def456'),
      encryption_key_id: 'v1',
      expires_at: '2025-12-31T00:00:00.000Z',
      credential_metadata: { scopes: ['read_products', 'write_orders'] },
      last_rotated_at: new Date().toISOString(),
      rotation_required: false,
      created_at: new Date().toISOString()
    };

    mockOperations.upsertCredential.mockResolvedValue(mockUpsertResponse);

    const stored = await vault.store('org-123', 'woocommerce', 'api_key', credential);

    expect(mockOperations.encrypt).toHaveBeenCalledWith('ck_abc123def456');
    expect(stored.service).toBe('woocommerce');
    expect(stored.credentialType).toBe('api_key');
    expect(stored.metadata).toEqual({ scopes: ['read_products', 'write_orders'] });
  });

  it('should handle storage without expiration', async () => {
    const credential: CredentialData = { value: 'secret_key_123' };

    const mockUpsertResponse = {
      id: 'cred-124',
      organization_id: 'org-123',
      service: 'stripe',
      credential_type: 'api_key',
      encrypted_credential: Buffer.from('encrypted_secret_key_123'),
      encryption_key_id: 'v1',
      expires_at: null,
      credential_metadata: {},
      last_rotated_at: new Date().toISOString(),
      rotation_required: false,
      created_at: new Date().toISOString()
    };

    mockOperations.upsertCredential.mockResolvedValue(mockUpsertResponse);

    const stored = await vault.store('org-123', 'stripe', 'api_key', credential);

    expect(stored.expiresAt).toBeNull();
  });

  it('should handle database errors', async () => {
    const credential: CredentialData = { value: 'test_key' };

    mockOperations.upsertCredential.mockRejectedValue(
      new Error('Failed to store credential: Unique constraint violation')
    );

    await expect(vault.store('org-123', 'woocommerce', 'api_key', credential))
      .rejects.toThrow('Failed to store credential: Unique constraint violation');
  });

  it('should pass encryption data to upsertCredential', async () => {
    const credential: CredentialData = { value: 'new_key' };

    mockOperations.upsertCredential.mockResolvedValue({
      id: 'cred-125',
      organization_id: 'org-123',
      service: 'woocommerce',
      credential_type: 'api_key',
      encrypted_credential: Buffer.from('encrypted_new_key'),
      encryption_key_id: 'v1',
      expires_at: null,
      credential_metadata: {},
      last_rotated_at: new Date().toISOString(),
      rotation_required: false,
      created_at: new Date().toISOString()
    });

    await vault.store('org-123', 'woocommerce', 'api_key', credential);

    expect(mockOperations.upsertCredential).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organization_id: 'org-123',
        service: 'woocommerce',
        credential_type: 'api_key'
      })
    );
  });
});
