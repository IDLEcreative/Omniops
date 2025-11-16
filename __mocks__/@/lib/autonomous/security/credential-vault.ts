// Mock for @/lib/autonomous/security/credential-vault
import { jest } from '@jest/globals';

export class CredentialVault {
  constructor(supabaseClient?: any) {
    // Accept supabaseClient but don't use it in mock
  }

  store = jest.fn();
  get = jest.fn();
  list = jest.fn();
  delete = jest.fn();
  rotate = jest.fn();
  markStaleCredentialsForRotation = jest.fn();
  getCredentialsRequiringRotation = jest.fn();
  verify = jest.fn();
}

// Mock convenience functions - these MUST match the ones in credential-vault-helpers.ts mock
export const getCredential = jest.fn();
export const storeCredential = jest.fn();
export const deleteCredential = jest.fn();
export const getCredentialVault = jest.fn();

// Export any types that might be imported
export type CredentialData = any;
export type CredentialType = 'api_key' | 'api_secret' | 'access_token' | 'admin_email' | 'admin_password';
export type StoredCredential = any;
export type DecryptedCredential = any;
