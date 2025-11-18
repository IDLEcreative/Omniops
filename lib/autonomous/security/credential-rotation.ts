/**
 * Credential Rotation Utilities
 *
 * Handles credential rotation operations including:
 * - Re-encryption with new keys
 * - Marking stale credentials
 * - Listing credentials requiring rotation
 *
 * @module lib/autonomous/security/credential-rotation
 */

import { encrypt } from '@/lib/encryption/crypto-core';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Rotate encryption key for a credential
 * Re-encrypts with new key version
 */
export async function rotateCredential(
  organizationId: string,
  service: string,
  credentialType: 'oauth_token' | 'api_key' | 'password' | 'session',
  currentValue: string,
  encryptionKeyId: string,
  supabase: SupabaseClient
): Promise<void> {
  // Re-encrypt with current key
  const encryptedValue = encrypt(currentValue);
  const encryptedBuffer = Buffer.from(encryptedValue, 'base64');

  // Update with new encryption
  const { error } = await supabase
    .from('autonomous_credentials')
    .update({
      encrypted_credential: encryptedBuffer,
      encryption_key_id: encryptionKeyId,
      last_rotated_at: new Date().toISOString(),
      rotation_required: false
    })
    .eq('organization_id', organizationId)
    .eq('service', service)
    .eq('credential_type', credentialType);

  if (error) {
    throw new Error(`Failed to rotate credential: ${error.message}`);
  }

  console.log('[CredentialRotation] Credential rotated:', {
    organizationId,
    service,
    credentialType
  });
}

/**
 * Mark credentials requiring rotation (90+ days old)
 * Should be run via cron job
 */
export async function markStaleCredentialsForRotation(
  supabase: SupabaseClient
): Promise<number> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data, error } = await supabase
    .from('autonomous_credentials')
    .update({ rotation_required: true })
    .lt('last_rotated_at', ninetyDaysAgo.toISOString())
    .eq('rotation_required', false)
    .select('id');

  if (error) {
    throw new Error(`Failed to mark stale credentials: ${error.message}`);
  }

  const count = data?.length || 0;
  return count;
}

/**
 * Get credentials requiring rotation
 */
export async function getCredentialsRequiringRotation(
  supabase: SupabaseClient
): Promise<any[]> {
  const { data, error } = await supabase
    .from('autonomous_credentials')
    .select('*')
    .eq('rotation_required', true);

  if (error) {
    throw new Error(`Failed to get credentials requiring rotation: ${error.message}`);
  }

  return data || [];
}
