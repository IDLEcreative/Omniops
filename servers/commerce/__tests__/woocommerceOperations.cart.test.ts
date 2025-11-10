/**
 * Tests for woocommerceOperations MCP Tool - Cart Operations
 *
 * Coverage: All cart-related operations (4 tests)
 */

import { woocommerceOperations } from '../woocommerceOperations';
import {
  mockContext,
  mockExecuteWooCommerceOperation,
  setupMocks,
  createMockCart,
  createSuccessResponse,
  expectSuccessResult
} from './woocommerceOperations.test-utils';

describe('woocommerceOperations - Cart Operations', () => {
  beforeEach(setupMocks);

  it('should add product to cart', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        cartId: 'cart-123',
        itemCount: 1
      }, 'Added to cart')
    );

    const result = await woocommerceOperations(
      {
        operation: 'add_to_cart',
        productId: '123',
        quantity: 1
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.cartId).toBeDefined();
    expect(result.data?.data?.itemCount).toBe(1);
  });

  it('should update cart item quantity', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        cartId: 'cart-123',
        itemCount: 3
      }, 'Cart updated')
    );

    const result = await woocommerceOperations(
      {
        operation: 'update_cart_quantity',
        cartItemKey: 'item-key-123',
        quantity: 3
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.itemCount).toBe(3);
  });

  it('should remove product from cart', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        cartId: 'cart-123',
        itemCount: 0
      }, 'Removed from cart')
    );

    const result = await woocommerceOperations(
      {
        operation: 'remove_from_cart',
        cartItemKey: 'item-key-123'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.itemCount).toBe(0);
  });

  it('should get cart', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        subtotal: '150.00',
        tax: '30.00',
        total: '180.00'
      }, 'Cart retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_cart'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.total).toBe('180.00');
  });
});