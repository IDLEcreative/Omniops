/**
 * Credential Vault Database Operations
 *
 * Database CRUD operations for credential storage.
 * Extracted from credential-vault.ts for LOC compliance.
 *
 * @module lib/autonomous/security/credential-vault-operations
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import type { CredentialType, StoredCredential } from './credential-vault-types';

// ============================================================================
// Encryption Operations
// ============================================================================

/**
 * Default encryption function using crypto-core
 */
export const defaultEncrypt = async (text: string): Promise<string> => {
  const { encrypt } = await import('@/lib/encryption/crypto-core');
  return encrypt(text);
};

/**
 * Default decryption function using crypto-core
 */
export const defaultDecrypt = async (text: string): Promise<string> => {
  const { decrypt } = await import('@/lib/encryption/crypto-core');
  return decrypt(text);
};

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Upsert a credential into the database
 */
export const defaultUpsertCredential = async (
  supabase: ReturnType<typeof createServiceRoleClientSync>,
  data: any
): Promise<any> => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data: record, error } = await supabase
    .from('autonomous_credentials')
    .upsert(data, { onConflict: 'organization_id,service,credential_type' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store credential: ${error.message}`);
  }

  return record;
};

/**
 * Select a single credential from the database
 */
export const defaultSelectCredential = async (
  supabase: ReturnType<typeof createServiceRoleClientSync>,
  organizationId: string,
  service: string,
  credentialType: CredentialType
): Promise<any> => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
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

  return data;
};

/**
 * Select multiple credentials from the database
 */
export const defaultSelectCredentials = async (
  supabase: ReturnType<typeof createServiceRoleClientSync>,
  organizationId: string,
  service?: string
): Promise<any[]> => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  let query = supabase
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

  return data || [];
};

/**
 * Delete a credential from the database
 */
export const defaultDeleteCredential = async (
  supabase: ReturnType<typeof createServiceRoleClientSync>,
  organizationId: string,
  service: string,
  credentialType: CredentialType
): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabase
    .from('autonomous_credentials')
    .delete()
    .eq('organization_id', organizationId)
    .eq('service', service)
    .eq('credential_type', credentialType);

  if (error) {
    throw new Error(`Failed to delete credential: ${error.message}`);
  }
};

// ============================================================================
// Data Mapping
// ============================================================================

/**
 * Map database record to StoredCredential type
 */
export const defaultMapToStoredCredential = (data: any): StoredCredential => {
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
};
