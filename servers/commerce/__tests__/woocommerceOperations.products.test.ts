/**
 * Tests for woocommerceOperations MCP Tool - Product Operations
 *
 * Coverage: All product-related operations (8 tests)
 */

import { woocommerceOperations } from '../woocommerceOperations';
import {
  mockContext,
  mockExecuteWooCommerceOperation,
  setupMocks,
  createMockProduct,
  createSuccessResponse,
  createErrorResponse,
  expectSuccessResult
} from './woocommerceOperations.test-utils';

describe('woocommerceOperations - Product Operations', () => {
  beforeEach(setupMocks);

  it('should search products by name', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        products: [createMockProduct()]
      }, 'Products found')
    );

    const result = await woocommerceOperations(
      {
        operation: 'search_products',
        query: 'hydraulic pump',
        limit: 10
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.products).toBeDefined();
    expect(result.data?.data?.products).toHaveLength(1);
    expect(mockExecuteWooCommerceOperation).toHaveBeenCalledWith(
      'search_products',
      expect.objectContaining({ query: 'hydraulic pump' }),
      'thompsonseparts.co.uk'
    );
  });

  it('should get product details by ID', async () => {
    const mockProduct = createMockProduct({
      description: 'High-performance pump',
      stock: 15
    });

    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({ product: mockProduct }, 'Product found')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_product_details',
        productId: '123'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.product).toBeDefined();
    expect(result.data?.data?.product?.id).toBe(123);
  });

  it('should check product stock', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        stock: 15,
        status: 'in_stock'
      }, 'Stock checked')
    );

    const result = await woocommerceOperations(
      {
        operation: 'check_stock',
        productId: '123'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.stock).toBe(15);
    expect(result.data?.data?.status).toBe('in_stock');
  });

  it('should get product pricing', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue({
      success: true,
      data: {
        regularPrice: '1250.00',
        salePrice: '1050.00'
      },
      currency: 'GBP',
      message: 'Price checked'
    });

    const result = await woocommerceOperations(
      {
        operation: 'check_price',
        productId: '123'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.regularPrice).toBe('1250.00');
    expect(result.data?.data?.salePrice).toBe('1050.00');
  });

  it('should handle product not found', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createErrorResponse('Product not found')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_product_details',
        productId: '99999'
      },
      mockContext
    );

    expect(result.success).toBe(false);
    expect(result.data?.message).toContain('not found');
  });

  it('should batch search multiple products', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        products: [
          { id: 1, name: 'Pump A', sku: 'SKU1' },
          { id: 2, name: 'Pump B', sku: 'SKU2' }
        ]
      }, 'Products found')
    );

    const result = await woocommerceOperations(
      {
        operation: 'search_products',
        query: 'pump',
        limit: 20
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.products).toHaveLength(2);
  });

  it('should get product variations', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        variations: [
          { id: 1, name: 'Red', price: '100.00' },
          { id: 2, name: 'Blue', price: '100.00' }
        ]
      }, 'Variations found')
    );

    const result = await woocommerceOperations(
      {
        operation: 'get_product_variations',
        productId: '123'
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(result.data?.data?.variations).toHaveLength(2);
  });

  it('should search with price filter (additional test)', async () => {
    mockExecuteWooCommerceOperation.mockResolvedValue(
      createSuccessResponse({
        products: [createMockProduct({ price: '250.00' })]
      }, 'Products found')
    );

    const result = await woocommerceOperations(
      {
        operation: 'search_products',
        query: 'pump',
        minPrice: 100,
        maxPrice: 500
      },
      mockContext
    );

    expectSuccessResult(result);
    expect(mockExecuteWooCommerceOperation).toHaveBeenCalledWith(
      'search_products',
      expect.objectContaining({
        query: 'pump',
        minPrice: 100,
        maxPrice: 500
      }),
      'thompsonseparts.co.uk'
    );
  });
});