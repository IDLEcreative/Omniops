/**
 * Shopify Factory - Credential Decryption Tests - Edge Cases
 *
 * Tests for validation, missing fields, and error conditions
 */

// Mock modules
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

jest.mock('@/lib/encryption', () => ({
  tryDecryptCredentials: jest.fn(),
  decrypt: jest.fn(),
}));

jest.mock('@/lib/shopify-api', () => ({
  ShopifyAPI: jest.fn().mockImplementation((config) => ({
    config,
    getProducts: jest.fn(),
  })),
}));

import { ProductionShopifyFactory } from '@/lib/shopify-api/factory';
import type { Database } from '@/types/supabase';

describe('ProductionShopifyFactory - Credential Decryption - Edge Cases', () => {
  let factory: ProductionShopifyFactory;
  let mockSupabase: any;
  let mockTryDecryptCredentials: jest.Mock;
  let mockDecrypt: jest.Mock;

  beforeEach(async () => {
    factory = new ProductionShopifyFactory();

    // Setup mocks
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    };

    const { createServiceRoleClient } = await import('@/lib/supabase-server');
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);

    const { tryDecryptCredentials, decrypt } = await import('@/lib/encryption');
    mockTryDecryptCredentials = tryDecryptCredentials as jest.Mock;
    mockDecrypt = decrypt as jest.Mock;

    jest.clearAllMocks();
  });

  describe('decryptCredentials() - Missing Fields', () => {
    it('should return null if Shopify config missing in new format', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: {},
      } as any;

      mockTryDecryptCredentials.mockReturnValueOnce({});

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
    });

    it('should handle missing legacy shop URL', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        shopify_shop: null,
        shopify_access_token: 'encrypted_token',
        encrypted_credentials: null,
      } as any;

      mockDecrypt.mockReturnValueOnce('decrypted_token');

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
    });

    it('should handle missing legacy access token', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        shopify_shop: 'test-store.myshopify.com',
        shopify_access_token: null,
        encrypted_credentials: null,
      } as any;

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
      expect(mockDecrypt).not.toHaveBeenCalled();
    });
  });

  describe('decryptCredentials() - Validation', () => {
    it('should return null if both shop and access token are missing', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: null,
        shopify_shop: null,
        shopify_access_token: null,
      } as any;

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
    });

    it('should return null if shop is missing but access token exists', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: {
          shopify: {
            store_url: undefined,
            access_token: 'token',
          },
        },
      } as any;

      mockTryDecryptCredentials.mockReturnValueOnce({
        shopify: {
          store_url: undefined,
          access_token: 'token',
        },
      });

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
    });

    it('should return null if access token is missing but shop exists', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: {
          shopify: {
            store_url: 'test-store.myshopify.com',
            access_token: undefined,
          },
        },
      } as any;

      mockTryDecryptCredentials.mockReturnValueOnce({
        shopify: {
          store_url: 'test-store.myshopify.com',
          access_token: undefined,
        },
      });

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
    });

    it('should handle empty strings for credentials', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: {
          shopify: {
            store_url: '',
            access_token: '',
          },
        },
      } as any;

      mockTryDecryptCredentials.mockReturnValueOnce({
        shopify: {
          store_url: '',
          access_token: '',
        },
      });

      const result = await factory.decryptCredentials(config);

      // Empty strings are falsy, should return null
      expect(result).toBeNull();
    });
  });

  describe('decryptCredentials() - Error Handling', () => {
    it('should handle malformed JSON in encrypted_credentials', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: 'invalid-json{',
      } as any;

      mockTryDecryptCredentials.mockReturnValueOnce({});

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
    });

    it('should handle null encrypted_credentials gracefully', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: null,
        shopify_shop: null,
        shopify_access_token: null,
      } as any;

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
      expect(mockTryDecryptCredentials).not.toHaveBeenCalled();
    });

    it('should handle config with all null values', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: null,
        shopify_shop: null,
        shopify_access_token: null,
      } as any;

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
    });
  });
});
