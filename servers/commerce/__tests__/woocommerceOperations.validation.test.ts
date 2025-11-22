/**
 * Tests for woocommerceOperations MCP Tool - Input & Context Validation
 *
 * Coverage: Input validation (10 tests) and context validation (3 tests)
 */

// CRITICAL: Mock modules BEFORE any imports
jest.mock('@/lib/chat/woocommerce-tool');
jest.mock('@/lib/chat/tool-handlers/domain-utils');

import { woocommerceOperations } from '../woocommerceOperations';
import { ExecutionContext } from '../../shared/types';
import {
  mockContext,
  mockExecuteWooCommerceOperation,
  mockNormalizeDomain,
  setupMocks,
  createSuccessResponse,
  expectSuccessResult,
  expectErrorResult
} from './woocommerceOperations.test-utils';

describe('woocommerceOperations - Validation', () => {
  beforeEach(setupMocks);

  describe('Input Validation', () => {
    it('should reject empty operation', async () => {
      const result = await woocommerceOperations(
        {
          operation: '' as any
        },
        mockContext
      );

      expectErrorResult(result);
    });

    it('should reject invalid operation name', async () => {
      const result = await woocommerceOperations(
        {
          operation: 'invalid_operation_xyz' as any
        },
        mockContext
      );

      expectErrorResult(result);
    });

    it('should accept valid operation (optional params)', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ products: [] }, 'Products found')
      );

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump'
        },
        mockContext
      );

      expectSuccessResult(result);
    });

    it('should accept valid operation with product details', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ product: { id: 1, name: 'Test' } }, 'Product found')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expectSuccessResult(result);
    });

    it('should accept valid check_stock operation', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ stock: 10, status: 'in_stock' }, 'Stock checked')
      );

      const result = await woocommerceOperations(
        {
          operation: 'check_stock',
          productId: '123'
        },
        mockContext
      );

      expectSuccessResult(result);
    });

    it('should accept valid add_to_cart operation', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ cartId: 'cart-123' }, 'Added to cart')
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
    });

    it('should accept zero quantity as valid', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ cartId: 'cart-123' }, 'Cart updated')
      );

      const result = await woocommerceOperations(
        {
          operation: 'add_to_cart',
          productId: '123',
          quantity: 0
        },
        mockContext
      );

      expectSuccessResult(result);
    });

    it('should accept search with limit', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ products: [] }, 'Products found')
      );

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump',
          limit: 50
        },
        mockContext
      );

      expectSuccessResult(result);
    });

    it('should accept pagination parameters', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ products: [] }, 'Products found')
      );

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump',
          page: 2,
          per_page: 20
        },
        mockContext
      );

      expectSuccessResult(result);
    });

    it('should accept price filters', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ products: [] }, 'Products found')
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
    });
  });

  describe('Context Validation', () => {
    it('should reject missing domain in context', async () => {
      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        { ...mockContext, domain: '' } as ExecutionContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('domain');
    });

    it('should reject invalid/localhost domain', async () => {
      mockNormalizeDomain.mockReturnValue('');

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        { ...mockContext, domain: 'localhost' }
      );

      expectErrorResult(result, 'INVALID_DOMAIN');
    });

    it('should normalize domain before processing', async () => {
      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ product: { id: 1 } }, 'Product found')
      );

      await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        { ...mockContext, domain: 'https://www.thompsonseparts.co.uk' }
      );

      expect(mockNormalizeDomain).toHaveBeenCalledWith('https://www.thompsonseparts.co.uk');
      expect(mockExecuteWooCommerceOperation).toHaveBeenCalledWith(
        'get_product_details',
        expect.anything(),
        'thompsonseparts.co.uk'
      );
    });
  });
});