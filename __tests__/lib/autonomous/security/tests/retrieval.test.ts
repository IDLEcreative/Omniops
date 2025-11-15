/**
 * Tests for credential retrieval and verification
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CredentialVault } from '@/lib/autonomous/security/credential-vault';
import { createMockOperations, mockSupabaseClient } from './setup';

describe('CredentialVault - Retrieval', () => {
  let vault: CredentialVault;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperations = createMockOperations();
    vault = new CredentialVault(mockSupabaseClient as any, mockOperations);
  });

  it('should retrieve and decrypt credential', async () => {
    const mockSelectResponse = {
      id: 'cred-123',
      organization_id: 'org-123',
      service: 'woocommerce',
      credential_type: 'api_key',
      encrypted_credential: Buffer.from('encrypted_ck_abc123'),
      encryption_key_id: 'v1',
      expires_at: null,
      credential_metadata: { scopes: ['read'] },
      last_rotated_at: new Date().toISOString(),
      rotation_required: false,
      created_at: new Date().toISOString()
    };

    mockOperations.selectCredential.mockResolvedValue(mockSelectResponse);

    const credential = await vault.get('org-123', 'woocommerce', 'api_key');

    expect(credential).not.toBeNull();
    expect(credential?.value).toBe('decrypted_value');
    expect(mockOperations.decrypt).toHaveBeenCalled();
  });

  it('should return null for non-existent credential', async () => {
    mockOperations.selectCredential.mockResolvedValue(null);

    const credential = await vault.get('org-123', 'woocommerce', 'api_key');

    expect(credential).toBeNull();
  });

  it('should return null for expired credential', async () => {
    const expiredDate = new Date();
    expiredDate.setFullYear(expiredDate.getFullYear() - 1);

    const mockSelectResponse = {
      id: 'cred-expired',
      organization_id: 'org-123',
      service: 'woocommerce',
      credential_type: 'oauth_token',
      encrypted_credential: Buffer.from('encrypted_expired_token'),
      encryption_key_id: 'v1',
      expires_at: expiredDate.toISOString(),
      credential_metadata: {},
      last_rotated_at: new Date().toISOString(),
      rotation_required: false,
      created_at: new Date().toISOString()
    };

    mockOperations.selectCredential.mockResolvedValue(mockSelectResponse);

    const credential = await vault.get('org-123', 'woocommerce', 'oauth_token');

    expect(credential).toBeNull();
  });

  it('should handle decryption errors', async () => {
    const mockSelectResponse = {
      id: 'cred-123',
      organization_id: 'org-123',
      service: 'woocommerce',
      credential_type: 'api_key',
      encrypted_credential: Buffer.from('corrupted_data'),
      encryption_key_id: 'v1',
      expires_at: null,
      credential_metadata: {},
      last_rotated_at: new Date().toISOString(),
      rotation_required: false,
      created_at: new Date().toISOString()
    };

    mockOperations.selectCredential.mockResolvedValue(mockSelectResponse);
    mockOperations.decrypt.mockRejectedValueOnce(new Error('Invalid encryption key'));

    await expect(vault.get('org-123', 'woocommerce', 'api_key'))
      .rejects.toThrow('Invalid encryption key');
  });

  it('should return true for valid credential', async () => {
    const mockSelectResponse = {
      id: 'cred-123',
      organization_id: 'org-123',
      service: 'woocommerce',
      credential_type: 'api_key',
      encrypted_credential: Buffer.from('encrypted_key'),
      encryption_key_id: 'v1',
      expires_at: null,
      credential_metadata: {},
      last_rotated_at: new Date().toISOString(),
      rotation_required: false,
      created_at: new Date().toISOString()
    };

    mockOperations.selectCredential.mockResolvedValue(mockSelectResponse);

    const isValid = await vault.verify('org-123', 'woocommerce', 'api_key');

    expect(isValid).toBe(true);
  });

  it('should return false for non-existent credential', async () => {
    mockOperations.selectCredential.mockResolvedValue(null);

    const isValid = await vault.verify('org-123', 'woocommerce', 'api_key');

    expect(isValid).toBe(false);
  });
});
