/**
 * Unit Tests: WooCommerce Cart Test API
 *
 * Tests the /api/woocommerce/cart-test endpoint
 * for both informational and transactional modes.
 */

import { POST, GET } from '@/app/api/woocommerce/cart-test/route';
import {
  mockSupabaseClient,
  mockSessionManager,
  mockStoreAPIInstance,
  resetAllMocks,
  mockSupabaseNoConfig,
  createCartItem,
  createCartResponse,
  createGetRequest,
  createPostRequest,
} from '@/__tests__/utils/woocommerce/cart-test-fixtures';

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/lib/cart-session-manager', () => ({
  getCartSessionManager: jest.fn(() => mockSessionManager),
}));

jest.mock('@/lib/woocommerce-store-api', () => ({
  WooCommerceStoreAPI: jest.fn(() => mockStoreAPIInstance),
}));

describe('/api/woocommerce/cart-test', () => {

  beforeEach(() => {
    resetAllMocks();
  });

  describe('GET endpoint', () => {
    it('should return disabled status when Store API is not enabled', async () => {
      const response = await GET(createGetRequest());
      const data = await response.json();

      expect(data.enabled).toBe(false);
      expect(data.mode).toBe('informational');
      expect(data.message).toContain('disabled');
      expect(data.instructions).toBeDefined();
    });

    it('should return enabled status when Store API is enabled', async () => {
      process.env.WOOCOMMERCE_STORE_API_ENABLED = 'true';

      const response = await GET(createGetRequest());
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
      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'add',
        productId: 123,
        quantity: 2,
      }));
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
      const item = createCartItem({ quantity: 2 });
      mockStoreAPIInstance.addItem.mockResolvedValue(
        createCartResponse([item], '100.00')
      );

      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'add',
        productId: 123,
        quantity: 2,
      }));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.mode).toBe('transactional');
      expect(data.message).toContain('Successfully added');
      expect(data.cart).toBeDefined();
      expect(mockStoreAPIInstance.addItem).toHaveBeenCalledWith(123, 2);
    });

    it('should handle get cart action', async () => {
      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'get',
      }));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Cart retrieved successfully');
      expect(data.cart).toBeDefined();
      expect(mockStoreAPIInstance.getCart).toHaveBeenCalled();
    });

    it('should handle update cart quantity action', async () => {
      mockStoreAPIInstance.updateItem.mockResolvedValue(
        createCartResponse([], '150.00')
      );

      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'update',
        cartItemKey: 'abc123',
        quantity: 3,
      }));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Successfully updated quantity to 3');
      expect(mockStoreAPIInstance.updateItem).toHaveBeenCalledWith('abc123', 3);
    });

    it('should handle remove from cart action', async () => {
      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'remove',
        cartItemKey: 'abc123',
      }));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Item removed from cart successfully');
      expect(mockStoreAPIInstance.removeItem).toHaveBeenCalledWith('abc123');
    });

    it('should handle apply coupon action', async () => {
      mockStoreAPIInstance.applyCoupon.mockResolvedValue(
        createCartResponse([], '90.00', [{ code: 'SAVE10' }])
      );

      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'apply_coupon',
        couponCode: 'SAVE10',
      }));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Coupon "SAVE10" applied successfully');
      expect(mockStoreAPIInstance.applyCoupon).toHaveBeenCalledWith('SAVE10');
    });

    it('should handle Store API not available', async () => {
      mockStoreAPIInstance.isAvailable.mockResolvedValue(false);

      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'add',
        productId: 123,
      }));
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toContain('Store API is not responding');
    });

    it('should handle Store API client initialization failure', async () => {
      mockSupabaseNoConfig();

      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'add',
        productId: 123,
      }));
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toContain('could not be initialized');
    });

    it('should validate required parameters for add action', async () => {
      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'add',
        // Missing productId
      }));
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toContain('Product ID is required');
    });

    it('should handle validation errors', async () => {
      const response = await POST(createPostRequest({
        action: 'invalid_action',
      }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid request parameters');
      expect(data.errors).toBeDefined();
    });

    it('should handle unknown action', async () => {
      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'unknown_action' as any,
      }));
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

      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'add',
        productId: 123,
        quantity: 1,
      }));
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toContain('Product out of stock');
    });

    it('should handle unexpected errors', async () => {
      process.env.WOOCOMMERCE_STORE_API_ENABLED = 'true';
      mockSessionManager.getSession.mockRejectedValue(new Error('Network error'));

      const response = await POST(createPostRequest({
        domain: 'test.com',
        action: 'add',
        productId: 123,
      }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Network error');
    });
  });
});