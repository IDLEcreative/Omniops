/**
 * CredentialVault - Concurrent Operations Tests
 * Tests concurrent CRUD operations and race conditions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CredentialVault, type CredentialData } from '@/lib/autonomous/security/credential-vault';
import { createMockOperations, mockSupabaseClient } from './setup';

describe('CredentialVault - Concurrent Operations', () => {
  let vault: CredentialVault;
  let mockOperations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperations = createMockOperations();
    vault = new CredentialVault(mockSupabaseClient as any, mockOperations);
  });

  describe('Concurrent CRUD', () => {
    it('should handle concurrent store operations', async () => {
      const credentials: CredentialData[] = Array.from({ length: 10 }, (_, i) => ({
        value: `key_${i}`
      }));

      let callCount = 0;
      mockOperations.upsertCredential.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          id: `cred-${callCount}`,
          organization_id: 'org-123',
          service: 'concurrent-test',
          credential_type: 'api_key',
          encrypted_credential: Buffer.from(`encrypted_${callCount}`),
          encryption_key_id: 'v1',
          expires_at: null,
          credential_metadata: {},
          last_rotated_at: new Date().toISOString(),
          rotation_required: false,
          created_at: new Date().toISOString()
        });
      });

      // Store all credentials concurrently
      const promises = credentials.map((cred, i) =>
        vault.store('org-123', 'concurrent-test', 'api_key', cred)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockOperations.upsertCredential).toHaveBeenCalledTimes(10);
    });

    it('should handle concurrent get operations', async () => {
      mockOperations.selectCredential.mockResolvedValue({
        id: 'cred-123',
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
      });

      mockOperations.decrypt.mockResolvedValue('decrypted_key');

      // Multiple concurrent reads
      const promises = Array.from({ length: 20 }, () =>
        vault.get('org-123', 'test', 'api_key')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(20);
      expect(results.every(r => r?.value === 'decrypted_key')).toBe(true);
    });

    it('should handle concurrent delete operations', async () => {
      mockOperations.deleteCredential.mockResolvedValue(undefined);

      const deletePromises = Array.from({ length: 5 }, (_, i) =>
        vault.delete('org-123', `service-${i}`, 'api_key')
      );

      await Promise.all(deletePromises);

      expect(mockOperations.deleteCredential).toHaveBeenCalledTimes(5);
    });

    it('should handle mixed concurrent operations (store, get, delete)', async () => {
      let storeCount = 0;
      mockOperations.upsertCredential.mockImplementation(() => {
        storeCount++;
        return Promise.resolve({
          id: `cred-${storeCount}`,
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
      });

      mockOperations.selectCredential.mockResolvedValue({
        id: 'cred-read',
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
      });

      mockOperations.decrypt.mockResolvedValue('decrypted');
      mockOperations.deleteCredential.mockResolvedValue(undefined);

      const mixedOps = [
        vault.store('org-123', 'test-1', 'api_key', { value: 'key1' }),
        vault.get('org-123', 'test-2', 'api_key'),
        vault.store('org-123', 'test-3', 'api_key', { value: 'key3' }),
        vault.delete('org-123', 'test-4', 'api_key'),
        vault.get('org-123', 'test-5', 'api_key')
      ];

      await Promise.all(mixedOps);

      expect(mockOperations.upsertCredential).toHaveBeenCalledTimes(2);
      expect(mockOperations.selectCredential).toHaveBeenCalledTimes(2);
      expect(mockOperations.deleteCredential).toHaveBeenCalledTimes(1);
    });
  });

  describe('Race Conditions', () => {
    it('should handle simultaneous updates to same credential', async () => {
      const credential1: CredentialData = { value: 'key_version_1' };
      const credential2: CredentialData = { value: 'key_version_2' };

      let updateCount = 0;
      mockOperations.upsertCredential.mockImplementation(() => {
        updateCount++;
        return Promise.resolve({
          id: 'cred-same',
          organization_id: 'org-123',
          service: 'woocommerce',
          credential_type: 'api_key',
          encrypted_credential: Buffer.from(`encrypted_v${updateCount}`),
          encryption_key_id: 'v1',
          expires_at: null,
          credential_metadata: {},
          last_rotated_at: new Date().toISOString(),
          rotation_required: false,
          created_at: new Date().toISOString()
        });
      });

      // Simultaneous updates to same credential
      const [result1, result2] = await Promise.all([
        vault.store('org-123', 'woocommerce', 'api_key', credential1),
        vault.store('org-123', 'woocommerce', 'api_key', credential2)
      ]);

      // Both operations should complete (database will handle conflict resolution)
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(mockOperations.upsertCredential).toHaveBeenCalledTimes(2);
    });

    it('should handle read during write operation', async () => {
      // Simulate slow write operation
      mockOperations.upsertCredential.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id: 'cred-writing',
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
        }), 100))
      );

      // Return old value during read
      mockOperations.selectCredential.mockResolvedValue({
        id: 'cred-old',
        organization_id: 'org-123',
        service: 'test',
        credential_type: 'api_key',
        encrypted_credential: Buffer.from('old_encrypted', 'base64'),
        encryption_key_id: 'v1',
        expires_at: null,
        credential_metadata: {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false,
        created_at: new Date().toISOString()
      });

      mockOperations.decrypt.mockResolvedValue('old_key');

      // Start write, immediately read
      const writePromise = vault.store('org-123', 'test', 'api_key', { value: 'new_key' });
      const readPromise = vault.get('org-123', 'test', 'api_key');

      const [writeResult, readResult] = await Promise.all([writePromise, readPromise]);

      // Read should return old value (before write completes)
      expect(readResult?.value).toBe('old_key');
      expect(writeResult).toBeDefined();
    });

    it('should handle delete during read operation', async () => {
      // Simulate credential exists initially
      mockOperations.selectCredential.mockResolvedValueOnce({
        id: 'cred-exists',
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
      });

      mockOperations.decrypt.mockResolvedValue('key_value');
      mockOperations.deleteCredential.mockResolvedValue(undefined);

      // Read and delete simultaneously
      const readPromise = vault.get('org-123', 'test', 'api_key');
      const deletePromise = vault.delete('org-123', 'test', 'api_key');

      await Promise.all([readPromise, deletePromise]);

      // Both operations should complete
      expect(mockOperations.selectCredential).toHaveBeenCalled();
      expect(mockOperations.deleteCredential).toHaveBeenCalled();
    });
  });
});
