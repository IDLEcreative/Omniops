/**
 * Shopify Factory - Credential Decryption Tests - Core Functionality
 *
 * Tests for basic decryption workflows (new format, legacy format, integration)
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

describe('ProductionShopifyFactory - Credential Decryption - Core', () => {
  let factory: ProductionShopifyFactory;
  let mockSupabase: any;
  let mockTryDecryptCredentials: jest.Mock;
  let mockDecrypt: jest.Mock;
  let mockShopifyAPI: jest.Mock;

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

    const { ShopifyAPI } = await import('@/lib/shopify-api');
    mockShopifyAPI = ShopifyAPI as jest.Mock;

    jest.clearAllMocks();
  });

  describe('decryptCredentials() - New Format', () => {
    it('should decrypt credentials from new format', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: {
          shopify: {
            store_url: 'test-store.myshopify.com',
            access_token: 'encrypted_token',
          },
        },
      } as any;

      mockTryDecryptCredentials.mockReturnValueOnce({
        shopify: {
          store_url: 'test-store.myshopify.com',
          access_token: 'decrypted_token',
        },
      });

      const result = await factory.decryptCredentials(config);

      expect(result).toEqual({
        shop: 'test-store.myshopify.com',
        accessToken: 'decrypted_token',
        apiVersion: '2025-01',
      });
    });

    it('should handle JSON string format', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: JSON.stringify({
          shopify: {
            store_url: 'test-store.myshopify.com',
            access_token: 'encrypted_token',
          },
        }),
      } as any;

      mockTryDecryptCredentials.mockReturnValueOnce({
        shopify: {
          store_url: 'test-store.myshopify.com',
          access_token: 'decrypted_token',
        },
      });

      const result = await factory.decryptCredentials(config);

      expect(result).toEqual({
        shop: 'test-store.myshopify.com',
        accessToken: 'decrypted_token',
        apiVersion: '2025-01',
      });
    });
  });

  describe('decryptCredentials() - Legacy Format', () => {
    it('should decrypt credentials from legacy format', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        shopify_shop: 'test-store.myshopify.com',
        shopify_access_token: 'encrypted_token',
        encrypted_credentials: null,
      } as any;

      mockDecrypt.mockReturnValueOnce('decrypted_token');

      const result = await factory.decryptCredentials(config);

      expect(mockDecrypt).toHaveBeenCalledWith('encrypted_token');
      expect(result).toEqual({
        shop: 'test-store.myshopify.com',
        accessToken: 'decrypted_token',
        apiVersion: '2025-01',
      });
    });

    it('should handle legacy decryption errors', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        shopify_shop: 'test-store.myshopify.com',
        shopify_access_token: 'encrypted_token',
        encrypted_credentials: null,
      } as any;

      mockDecrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await factory.decryptCredentials(config);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to decrypt legacy Shopify credentials:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('decryptCredentials() - Format Priority', () => {
    it('should prioritize new format over legacy format', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: {
          shopify: {
            store_url: 'new-store.myshopify.com',
            access_token: 'new_token',
          },
        },
        shopify_shop: 'old-store.myshopify.com',
        shopify_access_token: 'old_token',
      } as any;

      mockTryDecryptCredentials.mockReturnValueOnce({
        shopify: {
          store_url: 'new-store.myshopify.com',
          access_token: 'new_token',
        },
      });

      const result = await factory.decryptCredentials(config);

      expect(result?.shop).toBe('new-store.myshopify.com');
      expect(result?.accessToken).toBe('new_token');
      expect(mockDecrypt).not.toHaveBeenCalled();
    });

    it('should fall back to legacy if new format has no Shopify config', async () => {
      const config = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: { woocommerce: {} },
        shopify_shop: 'legacy-store.myshopify.com',
        shopify_access_token: 'encrypted_legacy_token',
      } as any;

      mockTryDecryptCredentials.mockReturnValueOnce({ woocommerce: {} });
      mockDecrypt.mockReturnValueOnce('decrypted_legacy_token');

      const result = await factory.decryptCredentials(config);

      expect(result?.shop).toBe('legacy-store.myshopify.com');
      expect(result?.accessToken).toBe('decrypted_legacy_token');
    });
  });

  describe('Integration Workflow', () => {
    it('should complete full workflow from config to client', async () => {
      const mockConfig = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: {
          shopify: {
            store_url: 'test-store.myshopify.com',
            access_token: 'encrypted_token',
          },
        },
      } as any;

      mockSupabase.single.mockResolvedValueOnce({
        data: mockConfig,
        error: null,
      });

      mockTryDecryptCredentials.mockReturnValueOnce({
        shopify: {
          store_url: 'test-store.myshopify.com',
          access_token: 'decrypted_token',
        },
      });

      // Step 1: Get config
      const config = await factory.getConfigForDomain('test.com');
      expect(config).toEqual(mockConfig);

      // Step 2: Decrypt credentials
      const credentials = await factory.decryptCredentials(config!);
      expect(credentials).toEqual({
        shop: 'test-store.myshopify.com',
        accessToken: 'decrypted_token',
        apiVersion: '2025-01',
      });

      // Step 3: Create client
      const client = await factory.createClient(credentials!);
      expect(client).toBeDefined();
    });
  });
});
