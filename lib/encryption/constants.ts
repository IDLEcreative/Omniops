/**
 * Encryption Constants
 */

import type { EncryptionConstants } from './types';

export const ENCRYPTION_CONSTANTS: EncryptionConstants = {
  ALGORITHM: 'aes-256-gcm',
  IV_LENGTH: 16, // 128 bits
  TAG_LENGTH: 16, // 128 bits
  SALT_LENGTH: 32, // 256 bits
};

export function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
  }

  // Validate entropy - key should not be too repetitive
  // Skip validation in test environments to allow simple test keys
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  if (!isTestEnv) {
    const uniqueChars = new Set(key.split('')).size;
    if (uniqueChars < 16) {
      throw new Error('ENCRYPTION_KEY has insufficient entropy (too repetitive)');
    }
  }

  return Buffer.from(key, 'utf8');
}
