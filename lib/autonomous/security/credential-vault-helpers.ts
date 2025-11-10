/**
 * Credential Vault Convenience Functions
 *
 * Standalone helper functions for credential operations.
 * These wrap the CredentialVault class for simplified usage.
 *
 * @module lib/autonomous/security/credential-vault-helpers
 */

import { getCredentialVault } from './credential-vault';
import type { CredentialType, CredentialData, StoredCredential, DecryptedCredential } from './credential-vault';

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
