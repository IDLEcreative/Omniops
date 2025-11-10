/**
 * Tests for CredentialVault
 * Tests AES-256 encryption/decryption and credential storage
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CredentialVault, type CredentialData } from '@/lib/autonomous/security/credential-vault';

// Mock encryption functions
jest.mock('@/lib/encryption/crypto-core', () => ({
  encrypt: jest.fn((text: string) => Buffer.from(`encrypted_${text}`).toString('base64')),
  decrypt: jest.fn((encrypted: string) => {
    const decoded = Buffer.from(encrypted, 'base64').toString();
    return decoded.replace('encrypted_', '');
  })
}));

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn()
};

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient)
}));

import { encrypt, decrypt } from '@/lib/encryption/crypto-core';

describe('CredentialVault', () => {
  let vault: CredentialVault;
  const mockEncrypt = encrypt as jest.MockedFunction<typeof encrypt>;
  const mockDecrypt = decrypt as jest.MockedFunction<typeof decrypt>;

  beforeEach(() => {
    jest.clearAllMocks();
    vault = new CredentialVault();
  });

  describe('store', () => {
    it('should store encrypted credential', async () => {
      const credential: CredentialData = {
        value: 'ck_abc123def456',
        metadata: { scopes: ['read_products', 'write_orders'] },
        expiresAt: new Date('2025-12-31')
      };

      const mockUpsertResponse = {
        data: {
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
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockUpsertResponse)
      });

      const stored = await vault.store('org-123', 'woocommerce', 'api_key', credential);

      expect(mockEncrypt).toHaveBeenCalledWith('ck_abc123def456');
      expect(stored.service).toBe('woocommerce');
      expect(stored.credentialType).toBe('api_key');
      expect(stored.metadata).toEqual({ scopes: ['read_products', 'write_orders'] });
    });

    it('should handle storage without expiration', async () => {
      const credential: CredentialData = {
        value: 'secret_key_123'
      };

      const mockUpsertResponse = {
        data: {
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
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockUpsertResponse)
      });

      const stored = await vault.store('org-123', 'stripe', 'api_key', credential);

      expect(stored.expiresAt).toBeUndefined();
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Unique constraint violation' }
        })
      });

      const credential: CredentialData = { value: 'test_key' };

      await expect(vault.store('org-123', 'woocommerce', 'api_key', credential))
        .rejects.toThrow('Failed to store credential: Unique constraint violation');
    });

    it('should use upsert for credential updates', async () => {
      const mockUpsert = jest.fn().mockReturnThis();

      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert,
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
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
          },
          error: null
        })
      });

      await vault.store('org-123', 'woocommerce', 'api_key', { value: 'new_key' });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.anything(),
        { onConflict: 'organization_id,service,credential_type' }
      );
    });
  });

  describe('get', () => {
    it('should retrieve and decrypt credential', async () => {
      const mockSelectResponse = {
        data: {
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
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSelectResponse)
      });

      const credential = await vault.get('org-123', 'woocommerce', 'api_key');

      expect(credential).not.toBeNull();
      expect(credential?.value).toBe('ck_abc123');
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('should return null for non-existent credential', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      });

      const credential = await vault.get('org-123', 'woocommerce', 'api_key');

      expect(credential).toBeNull();
    });

    it('should return null for expired credential', async () => {
      const expiredDate = new Date();
      expiredDate.setFullYear(expiredDate.getFullYear() - 1);

      const mockSelectResponse = {
        data: {
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
        },
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSelectResponse)
      });

      const credential = await vault.get('org-123', 'woocommerce', 'oauth_token');

      expect(credential).toBeNull();
    });

    it('should handle decryption errors', async () => {
      mockDecrypt.mockImplementationOnce(() => {
        throw new Error('Invalid encryption key');
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
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
          },
          error: null
        })
      });

      await expect(vault.get('org-123', 'woocommerce', 'api_key'))
        .rejects.toThrow('Invalid encryption key');
    });
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

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const credentials = await vault.list('org-123');

      expect(credentials).toHaveLength(2);
      expect(credentials[0].service).toBe('woocommerce');
      expect(credentials[1].service).toBe('shopify');
    });

    it('should filter by service', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      await vault.list('org-123', 'woocommerce');

      const eqCalls = mockSupabaseClient.from().eq.mock.calls;
      expect(eqCalls).toEqual(
        expect.arrayContaining([
          ['organization_id', 'org-123'],
          ['service', 'woocommerce']
        ])
      );
    });
  });

  describe('delete', () => {
    it('should delete credential', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      await expect(vault.delete('org-123', 'woocommerce', 'api_key')).resolves.not.toThrow();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('autonomous_credentials');
      expect(mockSupabaseClient.from().delete).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Foreign key constraint violation' }
        })
      });

      await expect(vault.delete('org-123', 'woocommerce', 'api_key'))
        .rejects.toThrow('Failed to delete credential: Foreign key constraint violation');
    });
  });

  describe('rotate', () => {
    it('should re-encrypt credential with new key', async () => {
      // Mock get to return existing credential
      const mockGetResponse = {
        data: {
          id: 'cred-123',
          organization_id: 'org-123',
          service: 'woocommerce',
          credential_type: 'api_key',
          encrypted_credential: Buffer.from('encrypted_old_key'),
          encryption_key_id: 'v1',
          expires_at: null,
          credential_metadata: {},
          last_rotated_at: new Date('2024-01-01').toISOString(),
          rotation_required: true,
          created_at: new Date().toISOString()
        },
        error: null
      };

      // First call is for get, second is for update
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue(mockGetResponse)
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null })
        });

      await vault.rotate('org-123', 'woocommerce', 'api_key');

      expect(mockDecrypt).toHaveBeenCalled();
      expect(mockEncrypt).toHaveBeenCalled();
    });

    it('should throw error if credential not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      });

      await expect(vault.rotate('org-123', 'woocommerce', 'api_key'))
        .rejects.toThrow('Credential not found for rotation');
    });
  });

  describe('markStaleCredentialsForRotation', () => {
    it('should mark credentials older than 90 days', async () => {
      const mockUpdateResponse = {
        data: [{ id: 'cred-1' }, { id: 'cred-2' }, { id: 'cred-3' }],
        error: null
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockUpdateResponse)
      });

      const count = await vault.markStaleCredentialsForRotation();

      expect(count).toBe(3);
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({ rotation_required: true });
    });
  });

  describe('verify', () => {
    it('should return true for valid credential', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
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
          },
          error: null
        })
      });

      const isValid = await vault.verify('org-123', 'woocommerce', 'api_key');

      expect(isValid).toBe(true);
    });

    it('should return false for non-existent credential', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      });

      const isValid = await vault.verify('org-123', 'woocommerce', 'api_key');

      expect(isValid).toBe(false);
    });
  });
});
