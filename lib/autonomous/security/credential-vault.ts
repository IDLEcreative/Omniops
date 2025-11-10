/**
 * Autonomous Credential Vault
 *
 * Secure storage for credentials used by autonomous agents.
 * Uses AES-256-GCM encryption with key rotation support.
 *
 * @module lib/autonomous/security/credential-vault
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import type {
  CredentialType,
  CredentialData,
  StoredCredential,
  DecryptedCredential,
  VaultOperations
} from './credential-vault-types';
import {
  defaultEncrypt,
  defaultDecrypt,
  defaultUpsertCredential,
  defaultSelectCredential,
  defaultSelectCredentials,
  defaultDeleteCredential,
  defaultMapToStoredCredential
} from './credential-vault-operations';

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  CredentialType,
  CredentialData,
  StoredCredential,
  DecryptedCredential,
  VaultOperations
} from './credential-vault-types';

// ============================================================================
// Credential Vault Service
// ============================================================================

export class CredentialVault {
  private supabase: ReturnType<typeof createServiceRoleClientSync>;
  private encryptionKeyId: string;
  private operations: VaultOperations;

  /**
   * Create CredentialVault instance
   * @param client Optional Supabase client (for testing). If not provided, creates one.
   * @param operations Optional vault operations (for testing). If not provided, uses defaults.
   */
  constructor(
    client?: ReturnType<typeof createServiceRoleClientSync>,
    operations?: Partial<VaultOperations>
  ) {
    this.supabase = client || createServiceRoleClientSync()!
    // Track encryption key version for rotation purposes
    this.encryptionKeyId = process.env.ENCRYPTION_KEY_VERSION || 'v1';

    // Use provided operations or defaults
    this.operations = {
      encrypt: operations?.encrypt || defaultEncrypt,
      decrypt: operations?.decrypt || defaultDecrypt,
      upsertCredential: operations?.upsertCredential || defaultUpsertCredential,
      selectCredential: operations?.selectCredential || defaultSelectCredential,
      selectCredentials: operations?.selectCredentials || defaultSelectCredentials,
      deleteCredential: operations?.deleteCredential || defaultDeleteCredential,
      mapToStoredCredential: operations?.mapToStoredCredential || defaultMapToStoredCredential
    };
  }

  /**
   * Store a new credential or update existing one
   */
  async store(
    organizationId: string,
    service: string,
    credentialType: CredentialType,
    credential: CredentialData
  ): Promise<StoredCredential> {
    const encryptedValue = await this.operations.encrypt(credential.value);
    const encryptedBuffer = Buffer.from(encryptedValue, 'base64');

    const data = await this.operations.upsertCredential(this.supabase, {
      organization_id: organizationId,
      service,
      credential_type: credentialType,
      encrypted_credential: encryptedBuffer,
      encryption_key_id: this.encryptionKeyId,
      expires_at: credential.expiresAt?.toISOString(),
      credential_metadata: credential.metadata || {},
      last_rotated_at: new Date().toISOString(),
      rotation_required: false
    });

    return this.operations.mapToStoredCredential(data);
  }

  /**
   * Retrieve and decrypt a credential
   */
  async get(
    organizationId: string,
    service: string,
    credentialType: CredentialType
  ): Promise<DecryptedCredential | null> {
    const data = await this.operations.selectCredential(
      this.supabase,
      organizationId,
      service,
      credentialType
    );

    if (data === null) return null;

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.warn('[CredentialVault] Credential expired:', {
        service,
        credentialType,
        expiredAt: data.expires_at
      });
      return null;
    }

    const encryptedValue = Buffer.from(data.encrypted_credential).toString('base64');
    const decryptedValue = await this.operations.decrypt(encryptedValue);

    return {
      ...this.operations.mapToStoredCredential(data),
      value: decryptedValue
    };
  }

  /**
   * List all credentials for a customer (without decrypting values)
   *
   * @example
   * const credentials = await vault.list('customer-123');
   * credentials.forEach(c => console.log(c.service, c.credentialType));
   */
  async list(organizationId: string, service?: string): Promise<StoredCredential[]> {
    try {
      const data = await this.operations.selectCredentials(
        this.supabase,
        organizationId,
        service
      );
      return data.map(this.operations.mapToStoredCredential);
    } catch (error) {
      console.error('[CredentialVault] List error:', error);
      throw error;
    }
  }

  /**
   * Delete a credential
   *
   * @example
   * await vault.delete('customer-123', 'woocommerce', 'api_key');
   */
  async delete(
    organizationId: string,
    service: string,
    credentialType: CredentialType
  ): Promise<void> {
    try {
      await this.operations.deleteCredential(
        this.supabase,
        organizationId,
        service,
        credentialType
      );
    } catch (error) {
      console.error('[CredentialVault] Delete error:', error);
      throw error;
    }
  }

  /**
   * Rotate encryption key for a credential
   * Re-encrypts with new key version
   */
  async rotate(
    organizationId: string,
    service: string,
    credentialType: CredentialType
  ): Promise<void> {
    const { rotateCredential } = await import('./credential-rotation');
    const current = await this.get(organizationId, service, credentialType);

    if (!current) {
      throw new Error('Credential not found for rotation');
    }

    await rotateCredential(
      organizationId,
      service,
      credentialType,
      current.value,
      this.encryptionKeyId,
      this.supabase
    );
  }

  /**
   * Mark credentials requiring rotation (90+ days old)
   */
  async markStaleCredentialsForRotation(): Promise<number> {
    const { markStaleCredentialsForRotation } = await import('./credential-rotation');
    return markStaleCredentialsForRotation(this.supabase);
  }

  /**
   * Get credentials requiring rotation
   */
  async getCredentialsRequiringRotation(): Promise<StoredCredential[]> {
    const { getCredentialsRequiringRotation } = await import('./credential-rotation');
    const data = await getCredentialsRequiringRotation(this.supabase);
    return data.map(this.operations.mapToStoredCredential);
  }

  /**
   * Verify credential is valid and not expired
   */
  async verify(
    organizationId: string,
    service: string,
    credentialType: CredentialType
  ): Promise<boolean> {
    const credential = await this.get(organizationId, service, credentialType);
    return credential !== null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let vaultInstance: CredentialVault | null = null;

/**
 * Get singleton vault instance
 * @param client Optional Supabase client (for testing)
 *
 * @example
 * const vault = getCredentialVault();
 * await vault.store(...);
 */
export function getCredentialVault(
  client?: ReturnType<typeof createServiceRoleClientSync>
): CredentialVault {
  if (!vaultInstance) {
    vaultInstance = new CredentialVault(client);
  }
  return vaultInstance;
}

// ============================================================================
// Convenience Functions (Re-exported from helpers)
// ============================================================================

export { storeCredential, getCredential, deleteCredential } from './credential-vault-helpers';
