/**
 * Tests for woocommerceOperations MCP Tool - Integration Scenarios
 *
 * Coverage: Multi-step workflow integration tests (5 tests)
 */

import { woocommerceOperations } from '../woocommerceOperations';
import {
  mockContext,
  mockExecuteWooCommerceOperation,
  setupMocks,
  createSuccessResponse,
  createMockProduct,
  createMockOrder,
  expectSuccessResult
} from './woocommerceOperations.test-utils';

describe('woocommerceOperations - Integration Scenarios', () => {
  beforeEach(setupMocks);

  it('should handle multi-operation workflow: search -> get details -> check stock', async () => {
    // Step 1: Search
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({ products: [{ id: 123 }] }, 'Products found')
    );
    const searchResult = await woocommerceOperations(
      { operation: 'search_products', query: 'pump' },
      mockContext
    );
    expectSuccessResult(searchResult);

    // Step 2: Get Details
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        product: { id: 123, name: 'Pump', price: '100' }
      }, 'Product found')
    );
    const detailsResult = await woocommerceOperations(
      { operation: 'get_product_details', productId: '123' },
      mockContext
    );
    expectSuccessResult(detailsResult);

    // Step 3: Check Stock
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        stock: 10,
        status: 'in_stock'
      }, 'Stock checked')
    );
    const stockResult = await woocommerceOperations(
      { operation: 'check_stock', productId: '123' },
      mockContext
    );
    expectSuccessResult(stockResult);
  });

  it('should handle cart to order workflow', async () => {
    // Add to cart
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        cartId: 'cart-123',
        itemCount: 1
      }, 'Added to cart')
    );
    const addResult = await woocommerceOperations(
      { operation: 'add_to_cart', productId: '123', quantity: 1 },
      mockContext
    );
    expectSuccessResult(addResult);

    // Get cart
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        total: '100.00'
      }, 'Cart retrieved')
    );
    const totalsResult = await woocommerceOperations(
      { operation: 'get_cart' },
      mockContext
    );
    expectSuccessResult(totalsResult);
  });

  it('should retrieve customer order with full details', async () => {
    // Check order
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        order: { id: 12345 }
      }, 'Order found')
    );
    const orderResult = await woocommerceOperations(
      { operation: 'check_order', orderId: '12345' },
      mockContext
    );
    expectSuccessResult(orderResult);

    // Get order notes
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        notes: [{ note: 'Order shipped', date: '2025-11-01' }]
      }, 'Order notes retrieved')
    );
    const notesResult = await woocommerceOperations(
      { operation: 'get_order_notes', orderId: '12345' },
      mockContext
    );
    expectSuccessResult(notesResult);

    // Get shipping info
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        trackingNumber: 'TRACK123'
      }, 'Shipping info retrieved')
    );
    const shippingResult = await woocommerceOperations(
      { operation: 'get_shipping_info', orderId: '12345' },
      mockContext
    );
    expectSuccessResult(shippingResult);
  });

  it('should apply coupon and get updated cart total', async () => {
    // Validate coupon
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        valid: true,
        discount: '10%'
      }, 'Coupon validated')
    );
    const couponResult = await woocommerceOperations(
      { operation: 'validate_coupon', couponCode: 'SAVE10' },
      mockContext
    );
    expectSuccessResult(couponResult);

    // Get updated cart
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        total: '90.00' // 10% discount applied
      }, 'Cart retrieved')
    );
    const totalsResult = await woocommerceOperations(
      { operation: 'get_cart' },
      mockContext
    );
    expectSuccessResult(totalsResult);
  });

  it('should handle payment method selection flow', async () => {
    // List payment methods
    mockExecuteWooCommerceOperation.mockResolvedValueOnce(
      createSuccessResponse({
        methods: [
          { id: 'card', name: 'Credit Card' },
          { id: 'paypal', name: 'PayPal' }
        ]
      }, 'Payment methods retrieved')
    );
    const methodsResult = await woocommerceOperations(
      { operation: 'get_payment_methods' },
      mockContext
    );
    expectSuccessResult(methodsResult);
    expect(methodsResult.data?.data?.methods).toHaveLength(2);
  });
});