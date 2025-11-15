/**
 * Shopify Dynamic - Client Creation Tests
 * Tests for successful client creation and configuration
 */

import { getDynamicShopifyClient } from '@/lib/shopify-dynamic';
import {
  createMockShopifyFactory,
  createMockShopifyFactoryWithDecryptionError,
  createMockShopifyFactoryWithDatabaseError,
} from '@/test-utils/create-shopify-factory';

describe('Shopify Dynamic - Client Creation', () => {
  describe('Successful client creation', () => {
    it('returns client when config exists with valid credentials', async () => {
      const factory = createMockShopifyFactory({ hasConfig: true });
      const client = await getDynamicShopifyClient('test.com', factory);

      expect(client).not.toBeNull();
      expect(client).toHaveProperty('getProducts');
      expect(client).toHaveProperty('getOrders');
    });

    it('uses factory to get config for domain', async () => {
      const factory = createMockShopifyFactory({ hasConfig: true });
      const spy = jest.spyOn(factory, 'getConfigForDomain');

      await getDynamicShopifyClient('test.com', factory);

      expect(spy).toHaveBeenCalledWith('test.com');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('uses factory to decrypt credentials', async () => {
      const factory = createMockShopifyFactory({ hasConfig: true, domain: 'test.com' });
      const spy = jest.spyOn(factory, 'decryptCredentials');

      await getDynamicShopifyClient('test.com', factory);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        domain: 'test.com',
      }));
    });

    it('uses factory to create client with credentials', async () => {
      const factory = createMockShopifyFactory({ hasConfig: true });
      const spy = jest.spyOn(factory, 'createClient');

      await getDynamicShopifyClient('test.com', factory);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        shop: expect.any(String),
        accessToken: expect.any(String),
      }));
    });

    it('creates client with correct Shopify shop domain', async () => {
      const factory = createMockShopifyFactory({
        hasConfig: true,
        domain: 'example.com'
      });
      const spy = jest.spyOn(factory, 'createClient');

      await getDynamicShopifyClient('example.com', factory);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          shop: 'test-shop.myshopify.com',
        })
      );
    });

    it('creates client with correct access token', async () => {
      const factory = createMockShopifyFactory({ hasConfig: true });
      const spy = jest.spyOn(factory, 'createClient');

      await getDynamicShopifyClient('test.com', factory);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.stringMatching(/^shpat_/),
        })
      );
    });

    it('creates client with API version', async () => {
      const factory = createMockShopifyFactory({ hasConfig: true });
      const spy = jest.spyOn(factory, 'createClient');

      await getDynamicShopifyClient('test.com', factory);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          apiVersion: '2025-01',
        })
      );
    });
  });

  describe('Failure scenarios', () => {
    it('returns null when config does not exist', async () => {
      const factory = createMockShopifyFactory({ hasConfig: false });
      const client = await getDynamicShopifyClient('test.com', factory);

      expect(client).toBeNull();
    });

    it('returns null when credentials cannot be decrypted', async () => {
      const factory = createMockShopifyFactoryWithDecryptionError();
      const client = await getDynamicShopifyClient('test.com', factory);

      expect(client).toBeNull();
    });

    it('returns null when database connection fails', async () => {
      const factory = createMockShopifyFactoryWithDatabaseError();
      const client = await getDynamicShopifyClient('test.com', factory);

      expect(client).toBeNull();
    });

    it('handles factory.getConfigForDomain throwing error', async () => {
      const factory = createMockShopifyFactory({ hasConfig: true });
      factory.getConfigForDomain = jest.fn().mockRejectedValue(new Error('Network error'));

      const client = await getDynamicShopifyClient('test.com', factory);

      expect(client).toBeNull();
    });

    it('handles factory.decryptCredentials throwing error', async () => {
      const factory = createMockShopifyFactory({ hasConfig: true });
      factory.decryptCredentials = jest.fn().mockRejectedValue(new Error('Decryption error'));

      const client = await getDynamicShopifyClient('test.com', factory);

      expect(client).toBeNull();
    });

    it('handles factory.createClient throwing error', async () => {
      const factory = createMockShopifyFactory({ hasConfig: true });
      factory.createClient = jest.fn().mockImplementation(() => {
        throw new Error('Client creation error');
      });

      const client = await getDynamicShopifyClient('test.com', factory);

      expect(client).toBeNull();
    });

    it('logs error when client creation fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const factory = createMockShopifyFactory({ hasConfig: true });
      factory.createClient = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      await getDynamicShopifyClient('test.com', factory);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating Shopify client:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});
