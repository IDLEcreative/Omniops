/**
 * CredentialVault - Concurrent Access Edge Cases Tests
 * Tests edge cases with special characters, metadata, and list operations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CredentialVault, type CredentialData } from '@/lib/autonomous/security/credential-vault';
import { createMockOperations, mockSupabaseClient } from './setup';

describe('CredentialVault - Concurrent Access Edge Cases', () => {
  let vault: CredentialVault;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperations = createMockOperations();
    vault = new CredentialVault(mockSupabaseClient as any, mockOperations);
  });

  describe('Edge Cases', () => {
    it('should handle empty credential value', async () => {
      const emptyCredential: CredentialData = { value: '' };

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-empty',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_empty'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      const stored = await vault.store('org-123', 'test', 'api_key', emptyCredential);

      expect(stored).toBeDefined();
      expect(mockOperations.encrypt).toHaveBeenCalledWith('');
    });

    it('should handle very long credential values', async () => {
      const longValue = 'x'.repeat(10000); // 10KB string
      const longCredential: CredentialData = { value: longValue };

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-long',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_long'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      await vault.store('org-123', 'test', 'api_key', longCredential);

      expect(mockOperations.encrypt).toHaveBeenCalledWith(longValue);
    });

    it('should handle special characters in credential values', async () => {
      const specialChars: CredentialData = {
        value: 'key!@#$%^&*()_+-={}[]|\\:";\'<>?,./`~'
      };

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-special',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_special'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      await vault.store('org-123', 'test', 'api_key', specialChars);

      expect(mockOperations.encrypt).toHaveBeenCalledWith(specialChars.value);
    });

    it('should handle unicode characters in credential values', async () => {
      const unicodeCredential: CredentialData = {
        value: '密钥🔐💡中文كلمة السر'
      };

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-unicode',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_unicode'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      await vault.store('org-123', 'test', 'api_key', unicodeCredential);

      expect(mockOperations.encrypt).toHaveBeenCalledWith(unicodeCredential.value);
    });

    it('should handle credentials with complex metadata', async () => {
      const complexMetadata = {
        scopes: ['read', 'write', 'delete'],
        permissions: { admin: true, users: ['user1', 'user2'] },
        nested: { level1: { level2: { level3: 'deep' } } }
      };

      const credential: CredentialData = {
        value: 'key',
        metadata: complexMetadata
      };

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-metadata',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: complexMetadata,
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      const stored = await vault.store('org-123', 'test', 'api_key', credential);

      expect(stored.metadata).toEqual(complexMetadata);
    });

    it('should handle expiration dates in different formats', async () => {
      const credential: CredentialData = {
        value: 'key',
        expiresAt: new Date('2025-12-31T23:59:59.999Z')
      };

      mockOperations.upsertCredential.mockResolvedValue({
        id: 'cred-expiry',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted'),
        encryption_key_id: 'v1',
        expires_at: '2025-12-31T23:59:59.999Z',
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      await vault.store('org-123', 'test', 'api_key', credential);

      expect(mockOperations.upsertCredential).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          expires_at: expect.stringContaining('2025-12-31')
        })
      );
    });
  });

  describe('List Operations', () => {
    it('should list all credentials for organization', async () => {
      const mockCredentials = [
        {
          id: 'cred-1',
          organization_id: 'org-123',
          service: 'woocommerce',
          credential_type: 'api_key',
          encrypted_credential: Buffer.from('enc1'),
          encryption_key_id: 'v1',
          expires_at: null,
          credential_metadata: {},
          last_rotated_at: new Date().toISOString(),
          rotation_required: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'cred-2',
          organization_id: 'org-123',
          service: 'shopify',
          credential_type: 'api_key',
          encrypted_credential: Buffer.from('enc2'),
          encryption_key_id: 'v1',
          expires_at: null,
          credential_metadata: {},
          last_rotated_at: new Date().toISOString(),
          rotation_required: false,
          created_at: new Date().toISOString()
        }
      ];

      mockOperations.selectCredentials.mockResolvedValue(mockCredentials);

      const list = await vault.list('org-123');

      expect(list).toHaveLength(2);
      expect(list[0].service).toBe('woocommerce');
      expect(list[1].service).toBe('shopify');
    });

    it('should filter credentials by service', async () => {
      const mockWooCredentials = [
        {
          id: 'cred-woo-1',
          organization_id: 'org-123',
          service: 'woocommerce',
          credential_type: 'api_key',
          encrypted_credential: Buffer.from('enc1'),
          encryption_key_id: 'v1',
          expires_at: null,
          credential_metadata: {},
          last_rotated_at: new Date().toISOString(),
          rotation_required: false,
          created_at: new Date().toISOString()
        }
      ];

      mockOperations.selectCredentials.mockResolvedValue(mockWooCredentials);

      const list = await vault.list('org-123', 'woocommerce');

      expect(list).toHaveLength(1);
      expect(list[0].service).toBe('woocommerce');
    });

    it('should handle empty credential list', async () => {
      mockOperations.selectCredentials.mockResolvedValue([]);

      const list = await vault.list('org-new');

      expect(list).toHaveLength(0);
    });
  });
});
