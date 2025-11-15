/**
 * Shared test setup for credential-vault tests
 */

import { VaultOperations } from '@/lib/autonomous/security/credential-vault';

export function createMockOperations(): Partial<VaultOperations> {
  const mockEncrypt = jest.fn().mockResolvedValue('encrypted_base64_value');
  const mockDecrypt = jest.fn().mockResolvedValue('decrypted_value');

  return {
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
}

export const mockSupabaseClient = {
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
