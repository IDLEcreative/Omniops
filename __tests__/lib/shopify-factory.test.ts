/**
 * Shopify Factory Tests
 * Comprehensive tests for Shopify factory pattern and dependency injection
 */

import { ProductionShopifyFactory } from '@/lib/shopify-api/factory';
import type { Database } from '@/types/supabase';

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

describe('ProductionShopifyFactory', () => {
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

  describe('getConfigForDomain()', () => {
    it('should fetch config for valid domain', async () => {
      const mockConfig = {
        id: '123',
        domain: 'test.com',
        encrypted_credentials: {},
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockConfig,
        error: null,
      });

      const result = await factory.getConfigForDomain('test.com');

      expect(mockSupabase.from).toHaveBeenCalledWith('customer_configs');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('domain', 'test.com');
      expect(result).toEqual(mockConfig);
    });

    it('should return null when config not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await factory.getConfigForDomain('nonexistent.com');

      expect(result).toBeNull();
    });

    it('should return null when database error occurs', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await factory.getConfigForDomain('test.com');

      expect(result).toBeNull();
    });

    it('should return null when Supabase client is not available', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase-server');
      (createServiceRoleClient as jest.Mock).mockResolvedValueOnce(null);

      const result = await factory.getConfigForDomain('test.com');

      expect(result).toBeNull();
    });
  });

  describe('createClient()', () => {
    it('should create client with valid credentials', async () => {
      const credentials = {
        shop: 'test-store.myshopify.com',
        accessToken: 'shpat_token',
        apiVersion: '2025-01',
      };

      const client = await factory.createClient(credentials);

      expect(mockShopifyAPI).toHaveBeenCalledWith({
        shop: 'test-store.myshopify.com',
        accessToken: 'shpat_token',
        apiVersion: '2025-01',
      });
      expect(client).toBeDefined();
    });

    it('should use default API version if not provided', async () => {
      const credentials = {
        shop: 'test-store.myshopify.com',
        accessToken: 'shpat_token',
      };

      await factory.createClient(credentials);

      expect(mockShopifyAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          apiVersion: '2025-01',
        })
      );
    });

    it('should preserve custom API version', async () => {
      const credentials = {
        shop: 'test-store.myshopify.com',
        accessToken: 'shpat_token',
        apiVersion: '2024-10',
      };

      await factory.createClient(credentials);

      expect(mockShopifyAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          apiVersion: '2024-10',
        })
      );
    });
  });

  // See shopify-factory-decrypt.test.ts for decryptCredentials tests
});
