/**
 * Unit Tests: WooCommerce Cart Test API
 *
 * Tests the /api/woocommerce/cart-test endpoint
 * for both informational and transactional modes.
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/woocommerce/cart-test/route';

// Mock the dependencies
const mockGetDynamicStoreAPIClient = jest.fn();

jest.mock('@/lib/woocommerce-dynamic', () => ({
  getDynamicStoreAPIClient: jest.fn(() => mockGetDynamicStoreAPIClient()),
}));

describe('/api/woocommerce/cart-test', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.WOOCOMMERCE_STORE_API_ENABLED = 'false';
  });

  describe('GET endpoint', () => {
    it('should return disabled status when Store API is not enabled', async () => {
      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test');

      const response = await GET(request);
      const data = await response.json();

      expect(data.enabled).toBe(false);
      expect(data.mode).toBe('informational');
      expect(data.message).toContain('disabled');
      expect(data.instructions).toBeDefined();
    });

    it('should return enabled status when Store API is enabled', async () => {
      process.env.WOOCOMMERCE_STORE_API_ENABLED = 'true';

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test');

      const response = await GET(request);
      const data = await response.json();

      expect(data.enabled).toBe(true);
      expect(data.mode).toBe('transactional');
      expect(data.message).toContain('enabled');
    });
  });

  describe('POST endpoint - Informational Mode', () => {
    beforeEach(() => {
      process.env.WOOCOMMERCE_STORE_API_ENABLED = 'false';
    });

    it('should return informational mode message when Store API is disabled', async () => {
      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'add',
          productId: 123,
          quantity: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.mode).toBe('informational');
      expect(data.message).toContain('not enabled');
    });
  });

  describe('POST endpoint - Transactional Mode', () => {
    beforeEach(() => {
      process.env.WOOCOMMERCE_STORE_API_ENABLED = 'true';
    });

    it('should handle add to cart action', async () => {
      const mockStoreAPI = {
        isAvailable: jest.fn().mockResolvedValue(true),
        addItem: jest.fn().mockResolvedValue({
          success: true,
          data: {
            items: [
              {
                id: 123,
                name: 'Test Product',
                quantity: 2,
                prices: { price: '50.00' },
              },
            ],
            totals: { total: '100.00' },
          },
        }),
      };

      mockGetDynamicStoreAPIClient.mockResolvedValue(mockStoreAPI as any);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'add',
          productId: 123,
          quantity: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.mode).toBe('transactional');
      expect(data.message).toContain('Successfully added');
      expect(data.cart).toBeDefined();
      expect(mockStoreAPI.addItem).toHaveBeenCalledWith(123, 2);
    });

    it('should handle get cart action', async () => {
      const mockStoreAPI = {
        isAvailable: jest.fn().mockResolvedValue(true),
        getCart: jest.fn().mockResolvedValue({
          success: true,
          data: {
            items: [],
            totals: { total: '0.00' },
          },
        }),
      };

      mockGetDynamicStoreAPIClient.mockResolvedValue(mockStoreAPI as any);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'get',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Cart retrieved successfully');
      expect(data.cart).toBeDefined();
      expect(mockStoreAPI.getCart).toHaveBeenCalled();
    });

    it('should handle update cart quantity action', async () => {
      const mockStoreAPI = {
        isAvailable: jest.fn().mockResolvedValue(true),
        updateItem: jest.fn().mockResolvedValue({
          success: true,
          data: {
            items: [],
            totals: { total: '150.00' },
          },
        }),
      };

      mockGetDynamicStoreAPIClient.mockResolvedValue(mockStoreAPI as any);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'update',
          cartItemKey: 'abc123',
          quantity: 3,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Successfully updated quantity to 3');
      expect(mockStoreAPI.updateItem).toHaveBeenCalledWith('abc123', 3);
    });

    it('should handle remove from cart action', async () => {
      const mockStoreAPI = {
        isAvailable: jest.fn().mockResolvedValue(true),
        removeItem: jest.fn().mockResolvedValue({
          success: true,
          data: {
            items: [],
            totals: { total: '0.00' },
          },
        }),
      };

      mockGetDynamicStoreAPIClient.mockResolvedValue(mockStoreAPI as any);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'remove',
          cartItemKey: 'abc123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Item removed from cart successfully');
      expect(mockStoreAPI.removeItem).toHaveBeenCalledWith('abc123');
    });

    it('should handle apply coupon action', async () => {
      const mockStoreAPI = {
        isAvailable: jest.fn().mockResolvedValue(true),
        applyCoupon: jest.fn().mockResolvedValue({
          success: true,
          data: {
            items: [],
            totals: { total: '90.00' },
            coupons: [{ code: 'SAVE10' }],
          },
        }),
      };

      mockGetDynamicStoreAPIClient.mockResolvedValue(mockStoreAPI as any);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'apply_coupon',
          couponCode: 'SAVE10',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Coupon "SAVE10" applied successfully');
      expect(mockStoreAPI.applyCoupon).toHaveBeenCalledWith('SAVE10');
    });

    it('should handle Store API not available', async () => {
      const mockStoreAPI = {
        isAvailable: jest.fn().mockResolvedValue(false),
      };

      mockGetDynamicStoreAPIClient.mockResolvedValue(mockStoreAPI as any);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'add',
          productId: 123,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toContain('Store API is not responding');
    });

    it('should handle Store API client initialization failure', async () => {
      mockGetDynamicStoreAPIClient.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'add',
          productId: 123,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toContain('could not be initialized');
    });

    it('should validate required parameters for add action', async () => {
      const mockStoreAPI = {
        isAvailable: jest.fn().mockResolvedValue(true),
      };

      mockGetDynamicStoreAPIClient.mockResolvedValue(mockStoreAPI as any);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'add',
          // Missing productId
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toContain('Product ID is required');
    });

    it('should handle validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          action: 'invalid_action',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid request parameters');
      expect(data.errors).toBeDefined();
    });

    it('should handle unknown action', async () => {
      const mockStoreAPI = {
        isAvailable: jest.fn().mockResolvedValue(true),
      };

      mockGetDynamicStoreAPIClient.mockResolvedValue(mockStoreAPI as any);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'unknown_action' as any,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle Store API errors gracefully', async () => {
      process.env.WOOCOMMERCE_STORE_API_ENABLED = 'true';

      const mockStoreAPI = {
        isAvailable: jest.fn().mockResolvedValue(true),
        addItem: jest.fn().mockResolvedValue({
          success: false,
          error: { message: 'Product out of stock' },
        }),
      };

      mockGetDynamicStoreAPIClient.mockResolvedValue(mockStoreAPI as any);

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'add',
          productId: 123,
          quantity: 1,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toContain('Product out of stock');
    });

    it('should handle unexpected errors', async () => {
      process.env.WOOCOMMERCE_STORE_API_ENABLED = 'true';

      mockGetDynamicStoreAPIClient.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/woocommerce/cart-test', {
        method: 'POST',
        body: JSON.stringify({
          domain: 'test.com',
          action: 'add',
          productId: 123,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Network error');
    });
  });
});