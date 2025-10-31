/**
 * Credential Encryption Migration Tests
 *
 * Tests the new consolidated credential encryption system and ensures
 * backward compatibility with the legacy individual column format.
 */

import {
  encryptCredentials,
  decryptCredentials,
  tryDecryptCredentials,
  encrypt,
  decrypt,
} from '@/lib/encryption';
import type { EncryptedCredentials } from '@/types/encrypted-credentials';

describe('Consolidated Credential Encryption', () => {
  // Set up encryption key for tests (must be exactly 32 characters)
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // Exactly 32 chars
  });

  describe('encryptCredentials()', () => {
    it('should encrypt WooCommerce credentials', () => {
      const credentials: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_test123',
          consumer_secret: 'cs_test456',
          store_url: 'https://example.com',
        },
      };

      const encrypted = encryptCredentials(credentials);

      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);

      // Should be base64
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should encrypt Shopify credentials', () => {
      const credentials: EncryptedCredentials = {
        shopify: {
          access_token: 'shpat_test789',
          store_url: 'mystore.myshopify.com',
        },
      };

      const encrypted = encryptCredentials(credentials);

      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
    });

    it('should encrypt mixed credentials (both WooCommerce and Shopify)', () => {
      const credentials: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_test',
          consumer_secret: 'cs_test',
          store_url: 'https://woo.example.com',
        },
        shopify: {
          access_token: 'shpat_test',
          store_url: 'shop.myshopify.com',
        },
      };

      const encrypted = encryptCredentials(credentials);

      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
    });

    it('should return empty string for empty credentials', () => {
      const encrypted = encryptCredentials({});

      expect(encrypted).toBe('');
    });
  });

  describe('decryptCredentials()', () => {
    it('should decrypt WooCommerce credentials', () => {
      const original: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_test123',
          consumer_secret: 'cs_test456',
          store_url: 'https://example.com',
        },
      };

      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);

      expect(decrypted).toEqual(original);
    });

    it('should decrypt Shopify credentials', () => {
      const original: EncryptedCredentials = {
        shopify: {
          access_token: 'shpat_test789',
          store_url: 'mystore.myshopify.com',
        },
      };

      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);

      expect(decrypted).toEqual(original);
    });

    it('should decrypt mixed credentials', () => {
      const original: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_test',
          consumer_secret: 'cs_test',
          store_url: 'https://woo.example.com',
        },
        shopify: {
          access_token: 'shpat_test',
          store_url: 'shop.myshopify.com',
        },
      };

      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);

      expect(decrypted).toEqual(original);
    });

    it('should return empty object for empty string', () => {
      const decrypted = decryptCredentials('');

      expect(decrypted).toEqual({});
    });

    it('should return empty object for invalid encrypted data', () => {
      const decrypted = decryptCredentials('not-valid-encrypted-data');

      expect(decrypted).toEqual({});
    });
  });

  describe('tryDecryptCredentials()', () => {
    it('should decrypt valid credentials', () => {
      const original: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_test',
          consumer_secret: 'cs_test',
          store_url: 'https://example.com',
        },
      };

      const encrypted = encryptCredentials(original);
      const decrypted = tryDecryptCredentials(encrypted);

      expect(decrypted).toEqual(original);
    });

    it('should return empty object for null', () => {
      const decrypted = tryDecryptCredentials(null);

      expect(decrypted).toEqual({});
    });

    it('should return empty object for undefined', () => {
      const decrypted = tryDecryptCredentials(undefined);

      expect(decrypted).toEqual({});
    });

    it('should return empty object for invalid data (no error thrown)', () => {
      const decrypted = tryDecryptCredentials('invalid-data');

      expect(decrypted).toEqual({});
    });
  });

  describe('Round-trip encryption', () => {
    it('should preserve all WooCommerce fields', () => {
      const original: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_1234567890abcdef',
          consumer_secret: 'cs_fedcba0987654321',
          store_url: 'https://store.example.com',
        },
      };

      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);

      expect(decrypted.woocommerce?.consumer_key).toBe(original.woocommerce?.consumer_key);
      expect(decrypted.woocommerce?.consumer_secret).toBe(original.woocommerce?.consumer_secret);
      expect(decrypted.woocommerce?.store_url).toBe(original.woocommerce?.store_url);
    });

    it('should preserve all Shopify fields', () => {
      const original: EncryptedCredentials = {
        shopify: {
          access_token: 'shpat_1234567890abcdef',
          store_url: 'myshop.myshopify.com',
          api_version: '2024-01',
        },
      };

      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);

      expect(decrypted.shopify?.access_token).toBe(original.shopify?.access_token);
      expect(decrypted.shopify?.store_url).toBe(original.shopify?.store_url);
      expect(decrypted.shopify?.api_version).toBe(original.shopify?.api_version);
    });

    it('should handle multiple encrypt/decrypt cycles', () => {
      const original: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_test',
          consumer_secret: 'cs_test',
          store_url: 'https://example.com',
        },
      };

      // Encrypt and decrypt multiple times
      let encrypted = encryptCredentials(original);
      let decrypted = decryptCredentials(encrypted);

      encrypted = encryptCredentials(decrypted);
      decrypted = decryptCredentials(encrypted);

      encrypted = encryptCredentials(decrypted);
      decrypted = decryptCredentials(encrypted);

      expect(decrypted).toEqual(original);
    });
  });

  describe('Backward compatibility', () => {
    it('should work alongside legacy encryption functions', () => {
      // Test that new and old encryption systems can coexist
      const legacyEncrypted = encrypt('ck_legacy_key');
      const legacyDecrypted = decrypt(legacyEncrypted);

      expect(legacyDecrypted).toBe('ck_legacy_key');

      // New system should still work
      const newCredentials: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_new_key',
          consumer_secret: 'cs_new_secret',
          store_url: 'https://new.example.com',
        },
      };

      const newEncrypted = encryptCredentials(newCredentials);
      const newDecrypted = decryptCredentials(newEncrypted);

      expect(newDecrypted).toEqual(newCredentials);
    });
  });

  describe('Security properties', () => {
    it('should produce different encrypted strings for same input', () => {
      const credentials: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_test',
          consumer_secret: 'cs_test',
          store_url: 'https://example.com',
        },
      };

      const encrypted1 = encryptCredentials(credentials);
      const encrypted2 = encryptCredentials(credentials);

      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same value
      expect(decryptCredentials(encrypted1)).toEqual(credentials);
      expect(decryptCredentials(encrypted2)).toEqual(credentials);
    });

    it('should not contain plaintext data in encrypted output', () => {
      const credentials: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_very_secret_key',
          consumer_secret: 'cs_very_secret_secret',
          store_url: 'https://supersecret.example.com',
        },
      };

      const encrypted = encryptCredentials(credentials);

      // Encrypted string should not contain any plaintext
      expect(encrypted).not.toContain('ck_very_secret_key');
      expect(encrypted).not.toContain('cs_very_secret_secret');
      expect(encrypted).not.toContain('supersecret');
      expect(encrypted).not.toContain('consumer_key');
      expect(encrypted).not.toContain('woocommerce');
    });
  });

  describe('Edge cases', () => {
    it('should handle credentials with special characters', () => {
      const credentials: EncryptedCredentials = {
        woocommerce: {
          consumer_key: 'ck_!@#$%^&*()_+-=[]{}|;:,.<>?',
          consumer_secret: 'cs_"quotes"\n\t\r',
          store_url: 'https://example.com/path?param=value&other=123',
        },
      };

      const encrypted = encryptCredentials(credentials);
      const decrypted = decryptCredentials(encrypted);

      expect(decrypted).toEqual(credentials);
    });

    it('should handle credentials with unicode characters', () => {
      const credentials: EncryptedCredentials = {
        shopify: {
          access_token: 'shpat_émojis_🔐_日本語_中文',
          store_url: 'shop.myshopify.com',
        },
      };

      const encrypted = encryptCredentials(credentials);
      const decrypted = decryptCredentials(encrypted);

      expect(decrypted).toEqual(credentials);
    });

    it('should handle very long credential strings', () => {
      const longKey = 'ck_' + 'a'.repeat(1000);
      const longSecret = 'cs_' + 'b'.repeat(1000);

      const credentials: EncryptedCredentials = {
        woocommerce: {
          consumer_key: longKey,
          consumer_secret: longSecret,
          store_url: 'https://example.com',
        },
      };

      const encrypted = encryptCredentials(credentials);
      const decrypted = decryptCredentials(encrypted);

      expect(decrypted).toEqual(credentials);
    });

    it('should handle optional fields correctly', () => {
      const credentials: EncryptedCredentials = {
        shopify: {
          access_token: 'shpat_test',
          store_url: 'shop.myshopify.com',
          api_version: '2024-01', // Optional field
        },
      };

      const encrypted = encryptCredentials(credentials);
      const decrypted = decryptCredentials(encrypted);

      expect(decrypted.shopify?.api_version).toBe('2024-01');
    });
  });
});
