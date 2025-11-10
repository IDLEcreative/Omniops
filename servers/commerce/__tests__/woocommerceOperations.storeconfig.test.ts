/**
 * Tests for woocommerceOperations MCP Tool - Store Configuration
 *
 * Coverage: All store config operations (4 tests)
 */

import { woocommerceOperations } from '../woocommerceOperations';
import {
  mockContext,
  mockExecuteWooCommerceOperation,
  setupMocks,
  createSuccessResponse,
  expectSuccessResult
} from './woocommerceOperations.test-utils';

describe('woocommerceOperations - Store Config Operations', () => {
  beforeEach(setupMocks);

  it('should validate coupon code', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        valid: true,
        discount: '10%',
        minimumAmount: '50.00'
      }, 'Coupon validated')
    );

    const result = await woocommerceOperations(
      {
        operation: 'validate_coupon',
        couponCode: 'SAVE10'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.valid).toBe(true);
  });

  it('should get shipping methods', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        methods: [
          { id: 'flat_rate', title: 'Flat Rate', cost: '5.00' },
          { id: 'free_shipping', title: 'Free Shipping', cost: '0.00' }
        ]
      }, 'Shipping methods retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_shipping_methods',
        country: 'GB',
        postcode: 'SW1A 1AA'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.methods).toHaveLength(2);
  });

  it('should get payment methods', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        methods: [
          { id: 'card', name: 'Credit Card' },
          { id: 'paypal', name: 'PayPal' },
          { id: 'bank', name: 'Bank Transfer' }
        ]
      }, 'Payment methods retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_payment_methods'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.methods).toHaveLength(3);
  });

  it('should get product categories', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        categories: [
          { id: 1, name: 'Hydraulic Parts', count: 45 },
          { id: 2, name: 'Electrical Components', count: 30 }
        ]
      }, 'Categories retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_product_categories'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.categories).toHaveLength(2);
  });
});