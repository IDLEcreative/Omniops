/**
 * Autonomous Credential Vault
 *
 * Secure storage for credentials used by autonomous agents.
 * Uses AES-256-GCM encryption with key rotation support.
 *
 * @module lib/autonomous/security/credential-vault
 */

import { encrypt, decrypt } from '@/lib/encryption/crypto-core';
import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

// ============================================================================
// Types
// ============================================================================

export type CredentialType = 'oauth_token' | 'api_key' | 'password' | 'session';

export interface CredentialData {
  value: string; // Will be encrypted before storage
  metadata?: Record<string, any>; // Additional data (scopes, permissions, etc.)
  expiresAt?: Date;
}

export interface StoredCredential {
  id: string;
  organizationId: string;
  service: string;
  credentialType: CredentialType;
  metadata?: Record<string, any>;
  expiresAt?: string;
  lastRotatedAt: string;
  rotationRequired: boolean;
  createdAt: string;
}

export interface DecryptedCredential extends StoredCredential {
  value: string; // Decrypted credential value
}

// ============================================================================
// Credential Vault Service
// ============================================================================

export class CredentialVault {
  private supabase: ReturnType<typeof createServerClient>;
  private encryptionKeyId: string;

  /**
   * Create CredentialVault instance
   * @param client Optional Supabase client (for testing). If not provided, creates one.
   */
  constructor(client?: ReturnType<typeof createServerClient>) {
    this.supabase = client || createServerClient();
    // Track encryption key version for rotation purposes
    this.encryptionKeyId = process.env.ENCRYPTION_KEY_VERSION || 'v1';
  }

  /**
   * Store a new credential or update existing one
   */
  async store(organizationId: string, service: string, credentialType: CredentialType, credential: CredentialData): Promise<StoredCredential> {
    const encryptedValue = encrypt(credential.value);
    const encryptedBuffer = Buffer.from(encryptedValue, 'base64');

    const { data, error } = await this.supabase
      .from('autonomous_credentials')
      .upsert({
        organization_id: organizationId,
        service,
        credential_type: credentialType,
        encrypted_credential: encryptedBuffer,
        encryption_key_id: this.encryptionKeyId,
        expires_at: credential.expiresAt?.toISOString(),
        credential_metadata: credential.metadata || {},
        last_rotated_at: new Date().toISOString(),
        rotation_required: false
      }, { onConflict: 'organization_id,service,credential_type' })
      .select()
      .single();

    if (error) throw new Error(`Failed to store credential: ${error.message}`);
    return this.mapToStoredCredential(data);
  }

  /**
   * Retrieve and decrypt a credential
   */
  async get(organizationId: string, service: string, credentialType: CredentialType): Promise<DecryptedCredential | null> {
    const { data, error } = await this.supabase
      .from('autonomous_credentials')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('service', service)
      .eq('credential_type', credentialType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get credential: ${error.message}`);
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.warn('[CredentialVault] Credential expired:', { service, credentialType, expiredAt: data.expires_at });
      return null;
    }

    const encryptedValue = Buffer.from(data.encrypted_credential).toString('base64');
    const decryptedValue = decrypt(encryptedValue);
    return { ...this.mapToStoredCredential(data), value: decryptedValue };
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
      let query = this.supabase
        .from('autonomous_credentials')
        .select('*')
        .eq('organization_id', organizationId);

      if (service) {
        query = query.eq('service', service);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list credentials: ${error.message}`);
      }

      return (data || []).map(this.mapToStoredCredential);
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
      const { error } = await this.supabase
        .from('autonomous_credentials')
        .delete()
        .eq('organization_id', organizationId)
        .eq('service', service)
        .eq('credential_type', credentialType);

      if (error) {
        throw new Error(`Failed to delete credential: ${error.message}`);
      }
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
    if (!current) throw new Error('Credential not found for rotation');
    await rotateCredential(organizationId, service, credentialType, current.value, this.encryptionKeyId, this.supabase);
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
    return data.map(this.mapToStoredCredential);
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

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private mapToStoredCredential(data: any): StoredCredential {
    return {
      id: data.id,
      organizationId: data.organization_id,
      service: data.service,
      credentialType: data.credential_type,
      metadata: data.credential_metadata,
      expiresAt: data.expires_at,
      lastRotatedAt: data.last_rotated_at,
      rotationRequired: data.rotation_required,
      createdAt: data.created_at
    };
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
export function getCredentialVault(client?: ReturnType<typeof createServerClient>): CredentialVault {
  if (!vaultInstance) {
    vaultInstance = new CredentialVault(client);
  }
  return vaultInstance;
}

// ============================================================================
// Convenience Functions (Re-exported from helpers)
// ============================================================================

export { storeCredential, getCredential, deleteCredential } from './credential-vault-helpers';
