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
  // Skip validation during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return Buffer.from('00000000000000000000000000000000');
  }

  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
  }

  return Buffer.from(key, 'utf8');
}
