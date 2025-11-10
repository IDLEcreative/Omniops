/**
 * Credential Vault Type Definitions
 *
 * Type definitions for credential vault operations.
 * Extracted from credential-vault.ts for LOC compliance.
 *
 * @module lib/autonomous/security/credential-vault-types
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';

// ============================================================================
// Credential Types
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
// Interfaces for Dependency Injection
// ============================================================================

export interface VaultOperations {
  encrypt: (text: string) => Promise<string>;
  decrypt: (text: string) => Promise<string>;
  upsertCredential: (supabase: ReturnType<typeof createServiceRoleClientSync>, data: any) => Promise<any>;
  selectCredential: (supabase: ReturnType<typeof createServiceRoleClientSync>, organizationId: string, service: string, credentialType: CredentialType) => Promise<any>;
  selectCredentials: (supabase: ReturnType<typeof createServiceRoleClientSync>, organizationId: string, service?: string) => Promise<any[]>;
  deleteCredential: (supabase: ReturnType<typeof createServiceRoleClientSync>, organizationId: string, service: string, credentialType: CredentialType) => Promise<void>;
  mapToStoredCredential: (data: any) => StoredCredential;
}
