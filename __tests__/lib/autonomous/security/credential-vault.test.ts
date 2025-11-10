/**
 * Tests for CredentialVault
 * Tests AES-256 encryption/decryption and credential storage
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CredentialVault, type CredentialData, type VaultOperations } from '@/lib/autonomous/security/credential-vault';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  order: jest.fn()
};

describe('CredentialVault', () => {
  let vault: CredentialVault;
  let mockEncrypt: jest.Mock;
  let mockDecrypt: jest.Mock;
  let mockOperations: Partial<VaultOperations>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock encryption functions
    mockEncrypt = jest.fn().mockResolvedValue('encrypted_base64_value');
    mockDecrypt = jest.fn().mockResolvedValue('decrypted_value');

    // Create mock operations for dependency injection
    mockOperations = {
      encrypt: mockEncrypt,
      decrypt: mockDecrypt,
      upsertCredential: jest.fn().mockResolvedValue({
        id: 'cred-123',
        organization_id: 'org-123',
        service: 'woocommerce',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('encrypted_ck_abc123def456'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      }),
      selectCredential: jest.fn().mockResolvedValue(null),
      selectCredentials: jest.fn().mockResolvedValue([]),
      deleteCredential: jest.fn().mockResolvedValue(undefined),
      mapToStoredCredential: (data: any) => ({
        id: data.id,
        organizationId: data.organization_id,
        service: data.service,
        credentialType: data.credential_type,
        metadata: data.credential_metadata,
        expiresAt: data.expires_at,
        lastRotatedAt: data.last_rotated_at,
        rotationRequired: data.rotation_required,
        createdAt: data.created_at
      })
    };

    // Pass mock Supabase client and mock operations to CredentialVault constructor
    vault = new CredentialVault(mockSupabaseClient as any, mockOperations);
  });

  describe('store', () => {
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

      (mockOperations.upsertCredential as jest.Mock).mockResolvedValue(mockUpsertResponse);

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

      (mockOperations.upsertCredential as jest.Mock).mockResolvedValue(mockUpsertResponse);

      const stored = await vault.store('org-123', 'stripe', 'api_key', credential);

      // expiresAt is null when not provided
      expect(stored.expiresAt).toBeNull();
    });

    it('should handle database errors', async () => {
      const credential: CredentialData = { value: 'test_key' };

      (mockOperations.upsertCredential as jest.Mock).mockRejectedValue(
        new Error('Failed to store credential: Unique constraint violation')
      );

      await expect(vault.store('org-123', 'woocommerce', 'api_key', credential))
        .rejects.toThrow('Failed to store credential: Unique constraint violation');
    });

    it('should pass encryption data to upsertCredential', async () => {
      const credential: CredentialData = { value: 'new_key' };

      (mockOperations.upsertCredential as jest.Mock).mockResolvedValue({
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

      expect((mockOperations.upsertCredential as jest.Mock)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          organization_id: 'org-123',
          service: 'woocommerce',
          credential_type: 'api_key'
        })
      );
    });
  });

  describe('get', () => {
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

      (mockOperations.selectCredential as jest.Mock).mockResolvedValue(mockSelectResponse);

      const credential = await vault.get('org-123', 'woocommerce', 'api_key');

      expect(credential).not.toBeNull();
      expect(credential?.value).toBe('decrypted_value');
      expect(mockDecrypt).toHaveBeenCalled();
    });

    it('should return null for non-existent credential', async () => {
      (mockOperations.selectCredential as jest.Mock).mockResolvedValue(null);

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

      (mockOperations.selectCredential as jest.Mock).mockResolvedValue(mockSelectResponse);

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

      (mockOperations.selectCredential as jest.Mock).mockResolvedValue(mockSelectResponse);
      mockDecrypt.mockRejectedValueOnce(new Error('Invalid encryption key'));

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

      (mockOperations.selectCredentials as jest.Mock).mockResolvedValue(mockData);

      const credentials = await vault.list('org-123');

      expect(credentials).toHaveLength(2);
      expect(credentials[0].service).toBe('woocommerce');
      expect(credentials[1].service).toBe('shopify');
    });

    it('should filter by service', async () => {
      (mockOperations.selectCredentials as jest.Mock).mockResolvedValue([]);

      await vault.list('org-123', 'woocommerce');

      expect((mockOperations.selectCredentials as jest.Mock)).toHaveBeenCalledWith(
        expect.anything(),
        'org-123',
        'woocommerce'
      );
    });
  });

  describe('delete', () => {
    it('should delete credential', async () => {
      await expect(vault.delete('org-123', 'woocommerce', 'api_key')).resolves.not.toThrow();

      expect((mockOperations.deleteCredential as jest.Mock)).toHaveBeenCalledWith(
        expect.anything(),
        'org-123',
        'woocommerce',
        'api_key'
      );
    });

    it('should handle deletion errors', async () => {
      (mockOperations.deleteCredential as jest.Mock).mockRejectedValue(
        new Error('Failed to delete credential: Foreign key constraint violation')
      );

      await expect(vault.delete('org-123', 'woocommerce', 'api_key'))
        .rejects.toThrow('Failed to delete credential: Foreign key constraint violation');
    });
  });

  describe('verify', () => {
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

      (mockOperations.selectCredential as jest.Mock).mockResolvedValue(mockSelectResponse);

      const isValid = await vault.verify('org-123', 'woocommerce', 'api_key');

      expect(isValid).toBe(true);
    });

    it('should return false for non-existent credential', async () => {
      (mockOperations.selectCredential as jest.Mock).mockResolvedValue(null);

      const isValid = await vault.verify('org-123', 'woocommerce', 'api_key');

      expect(isValid).toBe(false);
    });
  });
});
