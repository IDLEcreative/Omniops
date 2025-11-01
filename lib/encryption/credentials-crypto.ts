/**
 * Generic Credential Encryption
 */

import { encrypt, decrypt } from './crypto-core';
import type { EncryptedCredentials } from './types';

export function encryptCredentials(credentials: EncryptedCredentials): string {
  if (!credentials || Object.keys(credentials).length === 0) {
    return '';
  }

  const json = JSON.stringify(credentials);
  return encrypt(json);
}

export function decryptCredentials(encryptedData: string): EncryptedCredentials {
  if (!encryptedData) {
    return {};
  }

  try {
    const decrypted = decrypt(encryptedData);
    return JSON.parse(decrypted) as EncryptedCredentials;
  } catch (error) {
    console.error('Failed to decrypt credentials:', error);
    return {};
  }
}

export function tryDecryptCredentials(encryptedData: string | null | undefined): EncryptedCredentials {
  if (!encryptedData) {
    return {};
  }

  try {
    return decryptCredentials(encryptedData);
  } catch (error) {
    console.warn('Failed to decrypt credentials, returning empty object:', error);
    return {};
  }
}
