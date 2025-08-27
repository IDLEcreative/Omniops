import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment variable
 * @throws Error if ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
  }
  
  return Buffer.from(key, 'utf8');
}

/**
 * Encrypt a string using AES-256-GCM
 * @param text The plain text to encrypt
 * @returns Base64 encoded string containing IV, tag, and encrypted data
 */
export function encrypt(text: string): string {
  if (!text) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine IV, tag, and encrypted data
    const combined = Buffer.concat([iv, tag, encrypted]);
    
    // Return base64 encoded string
    return combined.toString('base64');
  } catch (error: any) {
    // Re-throw specific errors from getEncryptionKey
    if (error.message.includes('ENCRYPTION_KEY')) {
      throw error;
    }
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 * @param encryptedText Base64 encoded string containing IV, tag, and encrypted data
 * @returns The decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    
    // Decode from base64
    const combined = Buffer.from(encryptedText, 'base64');
    
    // Extract IV, tag, and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    // Don't log here as tryDecrypt will handle the fallback
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt an object by encrypting all its string values
 * @param obj Object with string values to encrypt
 * @returns Object with encrypted values
 */
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

/**
 * Decrypt an object by decrypting all its string values
 * @param obj Object with encrypted string values
 * @returns Object with decrypted values
 */
export function decryptObject<T extends Record<string, any>>(obj: T): T {
  const decrypted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value) {
      try {
        decrypted[key] = decrypt(value);
      } catch {
        // If decryption fails, keep the original value
        // This allows backward compatibility with unencrypted data
        decrypted[key] = value;
      }
    } else {
      decrypted[key] = value;
    }
  }
  
  return decrypted as T;
}

/**
 * Check if a string appears to be encrypted (base64 with proper length)
 * @param text String to check
 * @returns true if the string appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  
  try {
    const decoded = Buffer.from(text, 'base64');
    // Encrypted data should have at least IV + TAG + 1 byte of data
    return decoded.length >= IV_LENGTH + TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

/**
 * Try to decrypt a value, returning the original if decryption fails
 * This allows backward compatibility with unencrypted data
 */
function tryDecrypt(value: string): string {
  if (!value) {
    return '';
  }
  
  // Check if the value looks like it might be encrypted (base64 with sufficient length)
  // Encrypted values should be base64 and have IV + TAG + data
  const expectedMinLength = Math.ceil((IV_LENGTH + TAG_LENGTH + 1) * 4 / 3);
  const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(value);
  const hasMinLength = value.length >= expectedMinLength;
  
  if (!isBase64 || !hasMinLength) {
    // Doesn't look encrypted, return as-is
    return value;
  }
  
  try {
    return decrypt(value);
  } catch (error) {
    // If decryption fails, return original value (might be unencrypted or encrypted with different key)
    console.log('Falling back to unencrypted value for backward compatibility');
    return value;
  }
}

/**
 * Encrypt sensitive fields in WooCommerce configuration
 * @param config WooCommerce configuration object
 * @returns Configuration with encrypted sensitive fields
 */
export function encryptWooCommerceConfig(config: {
  enabled: boolean;
  url?: string;
  consumer_key?: string;
  consumer_secret?: string;
}) {
  return {
    enabled: config.enabled,
    url: config.url, // URL is not sensitive
    consumer_key: config.consumer_key ? encrypt(config.consumer_key) : undefined,
    consumer_secret: config.consumer_secret ? encrypt(config.consumer_secret) : undefined,
  };
}

/**
 * Decrypt sensitive fields in WooCommerce configuration
 * @param config WooCommerce configuration object with encrypted fields
 * @returns Configuration with decrypted sensitive fields
 */
export function decryptWooCommerceConfig(config: {
  enabled: boolean;
  url?: string;
  consumer_key?: string;
  consumer_secret?: string;
}) {
  return {
    enabled: config.enabled,
    url: config.url,
    consumer_key: config.consumer_key ? tryDecrypt(config.consumer_key) : undefined,
    consumer_secret: config.consumer_secret ? tryDecrypt(config.consumer_secret) : undefined,
  };
}

/**
 * Encrypt sensitive fields in Shopify configuration
 * @param config Shopify configuration object
 * @returns Configuration with encrypted sensitive fields
 */
export function encryptShopifyConfig(config: {
  enabled: boolean;
  domain?: string;
  access_token?: string;
}) {
  return {
    enabled: config.enabled,
    domain: config.domain, // Domain is not sensitive
    access_token: config.access_token ? encrypt(config.access_token) : undefined,
  };
}

/**
 * Decrypt sensitive fields in Shopify configuration
 * @param config Shopify configuration object with encrypted fields
 * @returns Configuration with decrypted sensitive fields
 */
export function decryptShopifyConfig(config: {
  enabled: boolean;
  domain?: string;
  access_token?: string;
}) {
  return {
    enabled: config.enabled,
    domain: config.domain,
    access_token: config.access_token ? decrypt(config.access_token) : undefined,
  };
}