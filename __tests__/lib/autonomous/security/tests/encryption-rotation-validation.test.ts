/**
 * CredentialVault - Validation & Error Handling Tests
 * Tests credential expiration, error handling, and verification
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CredentialVault, type CredentialData } from '@/lib/autonomous/security/credential-vault';
import { createMockOperations, mockSupabaseClient } from './setup';

describe('CredentialVault - Validation & Error Handling', () => {
  let vault: CredentialVault;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperations = createMockOperations();
    vault = new CredentialVault(mockSupabaseClient as any, mockOperations);
  });

  describe('Credential Expiration', () => {
    it('should reject expired credentials', async () => {
      const expiredCredential = {
        id: 'cred-expired',
        organization_id: 'org-123',
        service: 'temporary',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_value'),
        encryption_key_id: 'v1',
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Expired 1 day ago
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      mockOperations.selectCredential.mockResolvedValue(expiredCredential);

      const retrieved = await vault.get('org-123', 'temporary', 'api_key');

      // Should return null for expired credentials
      expect(retrieved).toBeNull();
    });

    it('should accept credentials with future expiration', async () => {
      const validCredential = {
        id: 'cred-valid',
        organization_id: 'org-123',
        service: 'temporary',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_value', 'base64'),
        encryption_key_id: 'v1',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Expires tomorrow
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      mockOperations.selectCredential.mockResolvedValue(validCredential);
      mockOperations.decrypt.mockResolvedValue('valid_api_key');

      const retrieved = await vault.get('org-123', 'temporary', 'api_key');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.value).toBe('valid_api_key');
    });

    it('should accept credentials with no expiration', async () => {
      const noExpiryCredential = {
        id: 'cred-permanent',
        organization_id: 'org-123',
        service: 'permanent',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_value', 'base64'),
        encryption_key_id: 'v1',
        expires_at: null, // No expiration
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      mockOperations.selectCredential.mockResolvedValue(noExpiryCredential);
      mockOperations.decrypt.mockResolvedValue('permanent_key');

      const retrieved = await vault.get('org-123', 'permanent', 'api_key');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.value).toBe('permanent_key');
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors', async () => {
      const credential: CredentialData = { value: 'test_key' };

      mockOperations.encrypt.mockRejectedValue(
        new Error('Encryption failed: Key not available')
      );

      await expect(vault.store('org-123', 'test', 'api_key', credential))
        .rejects.toThrow('Encryption failed');
    });

    it('should handle decryption errors for corrupted data', async () => {
      const corruptedCredential = {
        id: 'cred-corrupted',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('corrupted_data!!!'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      mockOperations.selectCredential.mockResolvedValue(corruptedCredential);
      mockOperations.decrypt.mockRejectedValue(
        new Error('Decryption failed: Invalid ciphertext')
      );

      await expect(vault.get('org-123', 'test', 'api_key'))
        .rejects.toThrow('Decryption failed');
    });

    it('should handle wrong encryption key errors', async () => {
      const credential = {
        id: 'cred-wrong-key',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_with_different_key'),
        encryption_key_id: 'v_old', // Encrypted with old key
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      mockOperations.selectCredential.mockResolvedValue(credential);
      mockOperations.decrypt.mockRejectedValue(
        new Error('Decryption failed: Authentication tag verification failed')
      );

      await expect(vault.get('org-123', 'test', 'api_key'))
        .rejects.toThrow('Authentication tag verification failed');
    });

    it('should handle database errors gracefully', async () => {
      const credential: CredentialData = { value: 'test_key' };

      mockOperations.upsertCredential.mockRejectedValue(
        new Error('Database connection timeout')
      );

      await expect(vault.store('org-123', 'test', 'api_key', credential))
        .rejects.toThrow('Database connection timeout');
    });

    it('should handle missing credentials gracefully', async () => {
      mockOperations.selectCredential.mockResolvedValue(null);

      const retrieved = await vault.get('org-123', 'nonexistent', 'api_key');

      expect(retrieved).toBeNull();
    });
  });

  describe('Credential Verification', () => {
    it('should verify credential exists and is valid', async () => {
      const validCredential = {
        id: 'cred-valid',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted', 'base64'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      mockOperations.selectCredential.mockResolvedValue(validCredential);
      mockOperations.decrypt.mockResolvedValue('valid_key');

      const isValid = await vault.verify('org-123', 'test', 'api_key');

      expect(isValid).toBe(true);
    });

    it('should verify returns false for expired credentials', async () => {
      const expiredCredential = {
        id: 'cred-expired',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted'),
        encryption_key_id: 'v1',
        expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      };

      mockOperations.selectCredential.mockResolvedValue(expiredCredential);

      const isValid = await vault.verify('org-123', 'test', 'api_key');

      expect(isValid).toBe(false);
    });

    it('should verify returns false for missing credentials', async () => {
      mockOperations.selectCredential.mockResolvedValue(null);

      const isValid = await vault.verify('org-123', 'missing', 'api_key');

      expect(isValid).toBe(false);
    });
  });
});
