/**
 * POST /api/woocommerce/cart-test - Cart Actions Tests
 * Tests cart operations: add, get, update, remove, apply coupon
 */

import { POST } from '@/app/api/woocommerce/cart-test/route';
import {
  mockStoreAPIInstance,
  resetAllMocks,
  createCartItem,
  createCartResponse,
  createPostRequest,
} from '@/__tests__/utils/woocommerce/cart-test-fixtures';

describe('POST /api/woocommerce/cart-test - Cart Actions', () => {
  beforeEach(() => {
    process.env.WOOCOMMERCE_STORE_API_ENABLED = 'true';
    resetAllMocks();
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
});
