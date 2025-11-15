/**
 * Unit Tests: WooCommerce Cart Test API
 *
 * Tests the /api/woocommerce/cart-test endpoint
 * for both informational and transactional modes.
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/woocommerce/cart-test/route';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: {
            id: 'domain-1',
            domain: 'test.com',
            woocommerce_url: 'https://test.com',
          },
          error: null,
        })),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Cart Session Manager
const mockSessionManager = {
  generateGuestId: jest.fn(() => 'guest-123'),
  getSession: jest.fn(() => Promise.resolve({
    userId: 'guest-123',
    domain: 'test.com',
    nonce: 'test-nonce',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    isGuest: true,
  })),
};

jest.mock('@/lib/cart-session-manager', () => ({
  getCartSessionManager: jest.fn(() => mockSessionManager),
}));

// Mock WooCommerceStoreAPI class
const mockStoreAPIInstance = {
  isAvailable: jest.fn().mockResolvedValue(true),
  addItem: jest.fn(),
  getCart: jest.fn(),
  updateItem: jest.fn(),
  removeItem: jest.fn(),
  applyCoupon: jest.fn(),
  removeCoupon: jest.fn(),
  setNonce: jest.fn(),
};

jest.mock('@/lib/woocommerce-store-api', () => ({
  WooCommerceStoreAPI: jest.fn(() => mockStoreAPIInstance),
}));

describe('/api/woocommerce/cart-test', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.WOOCOMMERCE_STORE_API_ENABLED = 'false';

    // Reset Supabase mock to default successful state
    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'domain-1',
              domain: 'test.com',
              woocommerce_url: 'https://test.com',
            },
            error: null,
          })),
        })),
      })),
    }));

    // Reset Store API mock to default successful state
    mockStoreAPIInstance.isAvailable.mockResolvedValue(true);
    mockStoreAPIInstance.addItem.mockResolvedValue({
      success: true,
      data: { items: [], totals: { total: '0.00' } },
    });
    mockStoreAPIInstance.getCart.mockResolvedValue({
      success: true,
      data: { items: [], totals: { total: '0.00' } },
    });
    mockStoreAPIInstance.updateItem.mockResolvedValue({
      success: true,
      data: { items: [], totals: { total: '0.00' } },
    });
    mockStoreAPIInstance.removeItem.mockResolvedValue({
      success: true,
      data: { items: [], totals: { total: '0.00' } },
    });
    mockStoreAPIInstance.applyCoupon.mockResolvedValue({
      success: true,
      data: { items: [], totals: { total: '0.00' }, coupons: [] },
    });
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
      mockStoreAPIInstance.addItem.mockResolvedValue({
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
      });

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
      expect(mockStoreAPIInstance.addItem).toHaveBeenCalledWith(123, 2);
    });

    it('should handle get cart action', async () => {
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
      expect(mockStoreAPIInstance.getCart).toHaveBeenCalled();
    });

    it('should handle update cart quantity action', async () => {
      mockStoreAPIInstance.updateItem.mockResolvedValue({
        success: true,
        data: {
          items: [],
          totals: { total: '150.00' },
        },
      });

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
      expect(mockStoreAPIInstance.updateItem).toHaveBeenCalledWith('abc123', 3);
    });

    it('should handle remove from cart action', async () => {
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
      expect(mockStoreAPIInstance.removeItem).toHaveBeenCalledWith('abc123');
    });

    it('should handle apply coupon action', async () => {
      mockStoreAPIInstance.applyCoupon.mockResolvedValue({
        success: true,
        data: {
          items: [],
          totals: { total: '90.00' },
          coupons: [{ code: 'SAVE10' }],
        },
      });

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
      expect(mockStoreAPIInstance.applyCoupon).toHaveBeenCalledWith('SAVE10');
    });

    it('should handle Store API not available', async () => {
      mockStoreAPIInstance.isAvailable.mockResolvedValue(false);

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
      // Mock Supabase to return no config
      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'No config found' },
            })),
          })),
        })),
      }));

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

      mockStoreAPIInstance.addItem.mockResolvedValue({
        success: false,
        error: { message: 'Product out of stock' },
      });

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

      // Mock the session manager to throw an error
      mockSessionManager.getSession.mockRejectedValue(new Error('Network error'));

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