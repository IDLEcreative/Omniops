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

  constructor() {
    this.supabase = createServerClient();
    // Track encryption key version for rotation purposes
    this.encryptionKeyId = process.env.ENCRYPTION_KEY_VERSION || 'v1';
  }

  /**
   * Store a new credential or update existing one
   *
   * @example
   * await vault.store('customer-123', 'woocommerce', 'api_key', {
   *   value: 'ck_abc123...',
   *   metadata: { scopes: ['read_products', 'write_orders'] },
   *   expiresAt: new Date('2025-12-31')
   * });
   */
  async store(
    organizationId: string,
    service: string,
    credentialType: CredentialType,
    credential: CredentialData
  ): Promise<StoredCredential> {
    try {
      // Encrypt the credential value
      const encryptedValue = encrypt(credential.value);
      const encryptedBuffer = Buffer.from(encryptedValue, 'base64');

      // Upsert credential
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
        }, {
          onConflict: 'organization_id,service,credential_type'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store credential: ${error.message}`);
      }

      return this.mapToStoredCredential(data);
    } catch (error) {
      console.error('[CredentialVault] Store error:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt a credential
   *
   * @example
   * const credential = await vault.get('customer-123', 'woocommerce', 'api_key');
   * console.log(credential.value); // Decrypted API key
   */
  async get(
    organizationId: string,
    service: string,
    credentialType: CredentialType
  ): Promise<DecryptedCredential | null> {
    try {
      const { data, error } = await this.supabase
        .from('autonomous_credentials')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('service', service)
        .eq('credential_type', credentialType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No credential found
          return null;
        }
        throw new Error(`Failed to get credential: ${error.message}`);
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        console.warn('[CredentialVault] Credential expired:', {
          service,
          credentialType,
          expiredAt: data.expires_at
        });
        return null;
      }

      // Decrypt credential
      const encryptedValue = Buffer.from(data.encrypted_credential).toString('base64');
      const decryptedValue = decrypt(encryptedValue);

      return {
        ...this.mapToStoredCredential(data),
        value: decryptedValue
      };
    } catch (error) {
      console.error('[CredentialVault] Get error:', error);
      throw error;
    }
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
   *
   * @example
   * await vault.rotate('customer-123', 'woocommerce', 'api_key');
   */
  async rotate(
    organizationId: string,
    service: string,
    credentialType: CredentialType
  ): Promise<void> {
    try {
      // Get and decrypt current credential
      const current = await this.get(organizationId, service, credentialType);

      if (!current) {
        throw new Error('Credential not found for rotation');
      }

      // Re-encrypt with current key
      const encryptedValue = encrypt(current.value);
      const encryptedBuffer = Buffer.from(encryptedValue, 'base64');

      // Update with new encryption
      const { error } = await this.supabase
        .from('autonomous_credentials')
        .update({
          encrypted_credential: encryptedBuffer,
          encryption_key_id: this.encryptionKeyId,
          last_rotated_at: new Date().toISOString(),
          rotation_required: false
        })
        .eq('organization_id', organizationId)
        .eq('service', service)
        .eq('credential_type', credentialType);

      if (error) {
        throw new Error(`Failed to rotate credential: ${error.message}`);
      }

      console.log('[CredentialVault] Credential rotated:', {
        organizationId,
        service,
        credentialType
      });
    } catch (error) {
      console.error('[CredentialVault] Rotate error:', error);
      throw error;
    }
  }

  /**
   * Mark credentials requiring rotation (90+ days old)
   * Should be run via cron job
   */
  async markStaleCredentialsForRotation(): Promise<number> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await this.supabase
        .from('autonomous_credentials')
        .update({ rotation_required: true })
        .lt('last_rotated_at', ninetyDaysAgo.toISOString())
        .eq('rotation_required', false)
        .select('id');

      if (error) {
        throw new Error(`Failed to mark stale credentials: ${error.message}`);
      }

      const count = data?.length || 0;
      console.log(`[CredentialVault] Marked ${count} credentials for rotation`);
      return count;
    } catch (error) {
      console.error('[CredentialVault] markStaleCredentialsForRotation error:', error);
      throw error;
    }
  }

  /**
   * Get credentials requiring rotation
   */
  async getCredentialsRequiringRotation(): Promise<StoredCredential[]> {
    try {
      const { data, error } = await this.supabase
        .from('autonomous_credentials')
        .select('*')
        .eq('rotation_required', true);

      if (error) {
        throw new Error(`Failed to get credentials requiring rotation: ${error.message}`);
      }

      return (data || []).map(this.mapToStoredCredential);
    } catch (error) {
      console.error('[CredentialVault] getCredentialsRequiringRotation error:', error);
      throw error;
    }
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
 *
 * @example
 * const vault = getCredentialVault();
 * await vault.store(...);
 */
export function getCredentialVault(): CredentialVault {
  if (!vaultInstance) {
    vaultInstance = new CredentialVault();
  }
  return vaultInstance;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Store credential (convenience function)
 */
export async function storeCredential(
  organizationId: string,
  service: string,
  credentialType: CredentialType,
  credential: CredentialData
): Promise<StoredCredential> {
  const vault = getCredentialVault();
  return vault.store(organizationId, service, credentialType, credential);
}

/**
 * Get credential (convenience function)
 */
export async function getCredential(
  organizationId: string,
  service: string,
  credentialType: CredentialType
): Promise<DecryptedCredential | null> {
  const vault = getCredentialVault();
  return vault.get(organizationId, service, credentialType);
}

/**
 * Delete credential (convenience function)
 */
export async function deleteCredential(
  organizationId: string,
  service: string,
  credentialType: CredentialType
): Promise<void> {
  const vault = getCredentialVault();
  return vault.delete(organizationId, service, credentialType);
}
