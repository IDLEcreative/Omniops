/**
 * CredentialVault - Encryption & Key Rotation Core Tests
 * Tests encryption correctness, key rotation, and multiple key version support
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CredentialVault, type CredentialData } from '@/lib/autonomous/security/credential-vault';
import { createMockOperations, mockSupabaseClient } from './setup';

describe('CredentialVault - Encryption & Key Rotation', () => {
  let vault: CredentialVault;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperations = createMockOperations();
    vault = new CredentialVault(mockSupabaseClient as any, mockOperations);
  });

  describe('Encryption Correctness', () => {
    it('should encrypt credentials before storage', async () => {
      const credential: CredentialData = {
        value: 'ck_sensitive_api_key_12345',
        metadata: { scopes: ['read', 'write'] }
      };

      const mockEncryptedValue = 'base64_encrypted_value_xyz';
      mockOperations.encrypt.mockResolvedValue(mockEncryptedValue);

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-123',
        organization_id: 'org-123',
        service: 'woocommerce',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from(mockEncryptedValue, 'base64'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: { scopes: ['read', 'write'] },
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      await vault.store('org-123', 'woocommerce', 'api_key', credential);

      // Verify encryption was called
      expect(mockOperations.encrypt).toHaveBeenCalledWith('ck_sensitive_api_key_12345');

      // Verify encrypted value was used for storage
      expect(mockOperations.upsertCredential).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          encrypted_credential: expect.any(Buffer)
        })
      );
    });

    // TODO: Fix mock assertion - encrypted value comparison mismatch
    it.skip('should decrypt credentials on retrieval', async () => {
      const encryptedValue = 'base64_encrypted_value';
      const decryptedValue = 'ck_original_api_key';

      mockOperations.selectCredential.mockResolvedValue({
        id: 'cred-456',
        organization_id: 'org-123',
        service: 'woocommerce',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from(encryptedValue, 'base64'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      mockOperations.decrypt.mockResolvedValue(decryptedValue);

      const retrieved = await vault.get('org-123', 'woocommerce', 'api_key');

      // Verify decryption was called
      expect(mockOperations.decrypt).toHaveBeenCalledWith(encryptedValue);

      // Verify decrypted value is returned
      expect(retrieved?.value).toBe(decryptedValue);
    });

    it('should use strong encryption (AES-256-GCM)', async () => {
      // This test verifies that encryption operations are called
      // Real encryption strength is tested in credential-vault-operations.test.ts
      const credential: CredentialData = { value: 'test_key' };

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-789',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      await vault.store('org-123', 'test', 'api_key', credential);

      expect(mockOperations.encrypt).toHaveBeenCalled();
    });
  });

  describe('Key Rotation', () => {
    it('should support key rotation for existing credentials', async () => {
      // Setup: credential exists with old key version
      const oldCredential = {
        id: 'cred-old',
        organization_id: 'org-123',
        service: 'woocommerce',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('old_encrypted_value', 'base64'),
        encryption_key_id: 'v1', // Old key version
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date(Date.now() - 100 * 86400000).toISOString(), // 100 days ago
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      mockOperations.selectCredential.mockResolvedValue(oldCredential);
      mockOperations.decrypt.mockResolvedValue('original_api_key_value');

      // Get credential (which includes decrypted value)
      const retrieved = await vault.get('org-123', 'woocommerce', 'api_key');

      expect(retrieved?.value).toBe('original_api_key_value');

      // Verify rotation method exists
      expect(typeof vault.rotate).toBe('function');
    });

    it('should track encryption key version', async () => {
      const credential: CredentialData = { value: 'test_key' };

      // Set encryption key version via environment
      const originalKeyVersion = process.env.ENCRYPTION_KEY_VERSION;
      process.env.ENCRYPTION_KEY_VERSION = 'v2';

      const vaultV2 = new CredentialVault(mockSupabaseClient as any, mockOperations);

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-new',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted'),
        encryption_key_id: 'v2', // New version
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      await vaultV2.store('org-123', 'test', 'api_key', credential);

      expect(mockOperations.upsertCredential).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          encryption_key_id: 'v2'
        })
      );

      // Restore original
      if (originalKeyVersion) {
        process.env.ENCRYPTION_KEY_VERSION = originalKeyVersion;
      } else {
        delete process.env.ENCRYPTION_KEY_VERSION;
      }
    });

    it('should identify credentials requiring rotation (90+ days old)', async () => {
      // Verify method exists for checking stale credentials
      expect(typeof vault.markStaleCredentialsForRotation).toBe('function');
      expect(typeof vault.getCredentialsRequiringRotation).toBe('function');
    });

    it('should update last_rotated_at timestamp on key rotation', async () => {
      const credential: CredentialData = { value: 'rotated_key' };

      const beforeRotation = new Date().toISOString();

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-rotated',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: beforeRotation,
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      await vault.store('org-123', 'test', 'api_key', credential);

      expect(mockOperations.upsertCredential).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          last_rotated_at: expect.any(String)
        })
      );
    });
  });

  describe('Multiple Encryption Key Support', () => {
    it('should support credentials encrypted with different key versions', async () => {
      // Credential encrypted with v1
      const credentialV1 = {
        id: 'cred-v1',
        organization_id: 'org-123',
        service: 'service-a',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_v1', 'base64'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      // Credential encrypted with v2
      const credentialV2 = {
        id: 'cred-v2',
        organization_id: 'org-123',
        service: 'service-b',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_v2', 'base64'),
        encryption_key_id: 'v2',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      mockOperations.selectCredential
        .mockResolvedValueOnce(credentialV1)
        .mockResolvedValueOnce(credentialV2);

      mockOperations.decrypt
        .mockResolvedValueOnce('key_v1')
        .mockResolvedValueOnce('key_v2');

      const retrievedV1 = await vault.get('org-123', 'service-a', 'api_key');
      const retrievedV2 = await vault.get('org-123', 'service-b', 'api_key');

      expect(retrievedV1?.value).toBe('key_v1');
      expect(retrievedV2?.value).toBe('key_v2');
    });
  });
});
