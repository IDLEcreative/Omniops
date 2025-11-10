/**
 * Tests for woocommerceOperations MCP Tool - Analytics Operations
 *
 * Coverage: All analytics operations (3 tests)
 */

import { woocommerceOperations } from '../woocommerceOperations';
import {
  mockContext,
  mockExecuteWooCommerceOperation,
  setupMocks,
  createSuccessResponse,
  expectSuccessResult
} from './woocommerceOperations.test-utils';

describe('woocommerceOperations - Analytics Operations', () => {
  beforeEach(setupMocks);

  it('should get sales report', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        totalOrders: 150,
        totalRevenue: '25000.00',
        avgOrderValue: '166.67'
      }, 'Sales report generated')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_sales_report',
        period: 'week'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.totalOrders).toBe(150);
    expect(result.data?.data?.totalRevenue).toBe('25000.00');
  });

  it('should get customer insights', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        customerCount: 500,
        repeatCustomerRate: '35%',
        avgCustomerLifetimeValue: '350.00'
      }, 'Customer insights retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_customer_insights'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.customerCount).toBe(500);
  });

  it('should get low stock products', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        products: [
          { id: 1, name: 'Pump A', stock: 3 },
          { id: 2, name: 'Seal Kit', stock: 2 }
        ]
      }, 'Low stock products retrieved')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_low_stock_products',
        threshold: 5
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.products).toHaveLength(2);
  });
});