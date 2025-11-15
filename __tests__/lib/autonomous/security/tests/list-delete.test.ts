/**
 * Tests for credential listing and deletion
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CredentialVault } from '@/lib/autonomous/security/credential-vault';
import { createMockOperations, mockSupabaseClient } from './setup';

describe('CredentialVault - List & Delete', () => {
  let vault: CredentialVault;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperations = createMockOperations();
    vault = new CredentialVault(mockSupabaseClient as any, mockOperations);
  });

  describe('list', () => {
    it('should list credentials for organization', async () => {
      const mockData = [
        {
          id: 'cred-1',
          organization_id: 'org-123',
          service: 'woocommerce',
          credential_type: 'api_key',
          encrypted_credential: Buffer.from('encrypted_key1'),
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
          credential_type: 'oauth_token',
          encrypted_credential: Buffer.from('encrypted_token'),
          encryption_key_id: 'v1',
          expires_at: new Date('2025-12-31').toISOString(),
          credential_metadata: {},
          last_rotated_at: new Date().toISOString(),
          rotation_required: false,
          created_at: new Date().toISOString()
        }
      ];

      mockOperations.selectCredentials.mockResolvedValue(mockData);

      const credentials = await vault.list('org-123');

      expect(credentials).toHaveLength(2);
      expect(credentials[0].service).toBe('woocommerce');
      expect(credentials[1].service).toBe('shopify');
    });

    it('should filter by service', async () => {
      mockOperations.selectCredentials.mockResolvedValue([]);

      await vault.list('org-123', 'woocommerce');

      expect(mockOperations.selectCredentials).toHaveBeenCalledWith(
        expect.anything(),
        'org-123',
        'woocommerce'
      );
    });
  });

  describe('delete', () => {
    it('should delete credential', async () => {
      await expect(vault.delete('org-123', 'woocommerce', 'api_key')).resolves.not.toThrow();

      expect(mockOperations.deleteCredential).toHaveBeenCalledWith(
        expect.anything(),
        'org-123',
        'woocommerce',
        'api_key'
      );
    });

    it('should handle deletion errors', async () => {
      mockOperations.deleteCredential.mockRejectedValue(
        new Error('Failed to delete credential: Foreign key constraint violation')
      );

      await expect(vault.delete('org-123', 'woocommerce', 'api_key'))
        .rejects.toThrow('Failed to delete credential: Foreign key constraint violation');
    });
  });
});
