/**
 * Shopify API Client Tests
 * Tests the core HTTP client functionality for Shopify Admin API
 */

import { ShopifyAPIClient } from '@/lib/shopify-api-client';

describe('ShopifyAPIClient', () => {
  let client: ShopifyAPIClient;
  let fetchSpy: jest.SpyInstance;

  const mockConfig = {
    shop: 'test-store.myshopify.com',
    accessToken: 'shpat_test_token_12345',
    apiVersion: '2025-01',
  };

  beforeEach(() => {
    client = new ShopifyAPIClient(mockConfig);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('Constructor', () => {
    it('should initialize with provided configuration', () => {
      expect(client).toBeDefined();
      // @ts-expect-error - accessing protected property for testing
      expect(client.shop).toBe('test-store.myshopify.com');
      // @ts-expect-error - accessing protected property for testing
      expect(client.accessToken).toBe('shpat_test_token_12345');
      // @ts-expect-error - accessing protected property for testing
      expect(client.apiVersion).toBe('2025-01');
    });

    it('should use default API version if not provided', () => {
      const clientWithDefaults = new ShopifyAPIClient({
        shop: 'test.myshopify.com',
        accessToken: 'token',
      });
      // @ts-expect-error - accessing protected property for testing
      expect(clientWithDefaults.apiVersion).toBe('2025-01');
    });

    it('should construct correct base URL', () => {
      // @ts-expect-error - accessing protected property for testing
      const baseUrl = client.baseUrl;
      expect(baseUrl).toBe('https://test-store.myshopify.com/admin/api/2025-01');
    });

    it('should handle custom API version', () => {
      const customClient = new ShopifyAPIClient({
        ...mockConfig,
        apiVersion: '2024-10',
      });
      // @ts-expect-error - accessing protected property for testing
      expect(customClient.baseUrl).toBe(
        'https://test-store.myshopify.com/admin/api/2024-10'
      );
    });
  });

  describe('request()', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { products: [{ id: 1, title: 'Test Product' }] };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // @ts-expect-error - accessing protected method for testing
      const result = await client.request('/products.json');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/api/2025-01/products.json',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Shopify-Access-Token': 'shpat_test_token_12345',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should include access token in headers', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // @ts-expect-error - accessing protected method for testing
      await client.request('/products.json');

      const fetchCall = fetchSpy.mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['X-Shopify-Access-Token']).toBe('shpat_test_token_12345');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should allow custom headers', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // @ts-expect-error - accessing protected method for testing
      await client.request('/products.json', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      const fetchCall = fetchSpy.mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['X-Custom-Header']).toBe('custom-value');
      expect(headers['X-Shopify-Access-Token']).toBe('shpat_test_token_12345');
    });

    it('should handle 404 errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Product not found',
      });

      // @ts-expect-error - accessing protected method for testing
      await expect(client.request('/products/999.json')).rejects.toThrow(
        'Shopify API Error (404): Product not found'
      );
    });

    it('should handle 401 unauthorized errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      // @ts-expect-error - accessing protected method for testing
      await expect(client.request('/products.json')).rejects.toThrow(
        'Shopify API Error (401): Unauthorized'
      );
    });

    it('should handle 429 rate limit errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      });

      // @ts-expect-error - accessing protected method for testing
      await expect(client.request('/products.json')).rejects.toThrow(
        'Shopify API Error (429): Rate limit exceeded'
      );
    });

    it('should handle 500 server errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      // @ts-expect-error - accessing protected method for testing
      await expect(client.request('/products.json')).rejects.toThrow(
        'Shopify API Error (500): Internal server error'
      );
    });

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValueOnce(
        new Error('Network request failed')
      );

      // @ts-expect-error - accessing protected method for testing
      await expect(client.request('/products.json')).rejects.toThrow(
        'Network request failed'
      );
    });

    it('should handle POST requests', async () => {
      const mockResponse = { product: { id: 1, title: 'New Product' } };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // @ts-expect-error - accessing protected method for testing
      const result = await client.request('/products.json', {
        method: 'POST',
        body: JSON.stringify({ product: { title: 'New Product' } }),
      });

      expect(result).toEqual(mockResponse);

      const fetchCall = fetchSpy.mock.calls[0];
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].body).toBeDefined();
    });

    it('should handle PUT requests', async () => {
      const mockResponse = { product: { id: 1, title: 'Updated Product' } };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // @ts-expect-error - accessing protected method for testing
      const result = await client.request('/products/1.json', {
        method: 'PUT',
        body: JSON.stringify({ product: { title: 'Updated Product' } }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle DELETE requests', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // @ts-expect-error - accessing protected method for testing
      await client.request('/products/1.json', {
        method: 'DELETE',
      });

      const fetchCall = fetchSpy.mock.calls[0];
      expect(fetchCall[1].method).toBe('DELETE');
    });
  });

  describe('buildQueryParams()', () => {
    it('should build empty query params for undefined input', () => {
      // @ts-expect-error - accessing protected method for testing
      const params = client.buildQueryParams();
      expect(params.toString()).toBe('');
    });

    it('should build query params from object', () => {
      // @ts-expect-error - accessing protected method for testing
      const params = client.buildQueryParams({
        limit: 10,
        status: 'active',
      });

      expect(params.get('limit')).toBe('10');
      expect(params.get('status')).toBe('active');
    });

    it('should skip undefined values', () => {
      // @ts-expect-error - accessing protected method for testing
      const params = client.buildQueryParams({
        limit: 10,
        status: undefined,
        title: 'test',
      });

      expect(params.get('limit')).toBe('10');
      expect(params.get('status')).toBeNull();
      expect(params.get('title')).toBe('test');
    });

    it('should convert numbers to strings', () => {
      // @ts-expect-error - accessing protected method for testing
      const params = client.buildQueryParams({
        limit: 50,
        since_id: 12345,
      });

      expect(params.get('limit')).toBe('50');
      expect(params.get('since_id')).toBe('12345');
    });

    it('should handle boolean values', () => {
      // @ts-expect-error - accessing protected method for testing
      const params = client.buildQueryParams({
        published: true,
        archived: false,
      });

      expect(params.get('published')).toBe('true');
      expect(params.get('archived')).toBe('false');
    });

    it('should handle date strings', () => {
      const dateStr = '2025-01-01T00:00:00Z';
      // @ts-expect-error - accessing protected method for testing
      const params = client.buildQueryParams({
        created_at_min: dateStr,
      });

      expect(params.get('created_at_min')).toBe(dateStr);
    });

    it('should handle multiple parameters', () => {
      // @ts-expect-error - accessing protected method for testing
      const params = client.buildQueryParams({
        limit: 20,
        status: 'open',
        financial_status: 'paid',
        created_at_min: '2025-01-01',
      });

      expect(params.get('limit')).toBe('20');
      expect(params.get('status')).toBe('open');
      expect(params.get('financial_status')).toBe('paid');
      expect(params.get('created_at_min')).toBe('2025-01-01');
    });

    it('should handle special characters in values', () => {
      // @ts-expect-error - accessing protected method for testing
      const params = client.buildQueryParams({
        title: 'Test & Product',
        vendor: 'Acme Inc.',
      });

      // URLSearchParams automatically encodes special characters
      expect(params.toString()).toContain('title=Test+%26+Product');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON response', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // @ts-expect-error - accessing protected method for testing
      await expect(client.request('/products.json')).rejects.toThrow(
        'Invalid JSON'
      );
    });

    it('should handle timeout errors', async () => {
      fetchSpy.mockRejectedValueOnce(
        new Error('Request timeout')
      );

      // @ts-expect-error - accessing protected method for testing
      await expect(client.request('/products.json')).rejects.toThrow(
        'Request timeout'
      );
    });
  });

  describe('Authentication', () => {
    it('should use correct access token format', async () => {
      const tokenFormats = [
        'shpat_abc123',
        'shpca_abc123',
        'shpss_abc123',
      ];

      for (const token of tokenFormats) {
        const testClient = new ShopifyAPIClient({
          ...mockConfig,
          accessToken: token,
        } as any);

        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as any);

        // @ts-expect-error - accessing protected method for testing
        await testClient.request('/products.json');

        const headers = fetchSpy.mock.calls[0][1].headers;
        expect(headers['X-Shopify-Access-Token']).toBe(token);

        jest.clearAllMocks();
      }
    });
  });
} as any);
