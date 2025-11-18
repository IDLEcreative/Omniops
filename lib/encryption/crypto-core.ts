/**
 * Core Encryption Functions
 */

import * as crypto from 'crypto';
import type { CipherGCM, DecipherGCM } from 'crypto';
import { ENCRYPTION_CONSTANTS, getEncryptionKey } from './constants';

const { ALGORITHM, IV_LENGTH, TAG_LENGTH } = ENCRYPTION_CONSTANTS;

export function encrypt(text: string): string {
  if (!text) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as CipherGCM;

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, tag, encrypted]);

    return combined.toString('base64');
  } catch (error: any) {
    if (error.message.includes('ENCRYPTION_KEY')) {
      throw error;
    }
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedText, 'base64');

    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as DecipherGCM;
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}

export function tryDecrypt(value: string): string {
  if (!value) {
    return '';
  }

  const expectedMinLength = Math.ceil((IV_LENGTH + TAG_LENGTH + 1) * 4 / 3);
  const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(value);
  const hasMinLength = value.length >= expectedMinLength;

  if (!isBase64 || !hasMinLength) {
    return value;
  }

  try {
    return decrypt(value);
  } catch (error) {
    return value;
  }
}

export function isEncrypted(text: string): boolean {
  if (!text) return false;

  try {
    const decoded = Buffer.from(text, 'base64');
    return decoded.length >= IV_LENGTH + TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

export function encryptObject<T extends Record<string, any>>(obj: T): T {
  const encrypted: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value) {
      encrypted[key] = encrypt(value);
    } else {
      encrypted[key] = value;
    }
  }

  return encrypted as T;
}

export function decryptObject<T extends Record<string, any>>(obj: T): T {
  const decrypted: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value) {
      try {
        decrypted[key] = decrypt(value);
      } catch {
        decrypted[key] = value;
      }
    } else {
      decrypted[key] = value;
    }
  }

  return decrypted as T;
}
