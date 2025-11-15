/**
 * Tests for woocommerceOperations MCP Tool - Order Operations
 *
 * Coverage: All order-related operations (6 tests)
 */

import { woocommerceOperations } from '../woocommerceOperations';
import {
  mockContext,
  mockExecuteWooCommerceOperation,
  setupMocks,
  createMockOrder,
  createSuccessResponse,
  createErrorResponse,
  expectSuccessResult
} from './woocommerceOperations.test-utils';

// SKIPPED: MCP server tests require special test environment setup
// TODO: Set up proper MCP test environment for WooCommerce operations
describe.skip('woocommerceOperations - Order Operations', () => {
  beforeEach(setupMocks);

  it('should check order by ID', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({ order: createMockOrder() }, 'Order found')
    );

    const result = await woocommerceOperations(
      {
        operation: 'check_order',
        orderId: '12345'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.order).toBeDefined();
    expect(result.data?.data?.order?.id).toBe(12345);
  });

  it('should get shipping info', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        trackingNumber: 'TRACK123456',
        carrier: 'DHL',
        estimatedDelivery: '2025-11-10'
      }, 'Shipping info retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_shipping_info',
        orderId: '12345'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.trackingNumber).toBe('TRACK123456');
    expect(result.data?.data?.carrier).toBe('DHL');
  });

  it('should get customer orders', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        orders: [
          { id: 1, status: 'completed', total: '99.99' },
          { id: 2, status: 'processing', total: '50.00' }
        ]
      }, 'Customer orders retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_customer_orders',
        email: 'customer@example.com'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.orders).toHaveLength(2);
  });

  it('should get order notes', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        notes: [
          { note: 'Order shipped', date: '2025-11-01' },
          { note: 'Payment received', date: '2025-11-02' }
        ]
      }, 'Order notes retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_order_notes',
        orderId: '12345'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.notes).toHaveLength(2);
  });

  it('should handle order not found', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createErrorResponse('Order not found')
    );

    const result = await woocommerceOperations(
      {
        operation: 'check_order',
        orderId: '99999'
      },
      mockContext
    );

    expect(result.success).toBe(false);
    expect(result.data?.message).toContain('not found');
  });

  it('should check refund status', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        refundStatus: 'pending',
        refundAmount: '50.00'
      }, 'Refund status retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'check_refund_status',
        orderId: '12345'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.refundStatus).toBe('pending');
  });
});