/**
 * Tests for woocommerceOperations MCP Tool - Error Handling & Edge Cases
 *
 * Coverage: Error handling (8 tests), edge cases (2 tests), response format (4 tests)
 */

// Mock dependencies MUST be at the top before imports
jest.mock('@/lib/chat/woocommerce-tool');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: jest.fn().mockReturnValue(150)
  }))
}));

import { woocommerceOperations, metadata } from '../woocommerceOperations';
import {
  mockContext,
  mockExecuteWooCommerceOperation,
  setupMocks,
  createSuccessResponse,
  createErrorResponse,
  expectErrorResult,
  measureExecutionTime
} from './woocommerceOperations.test-utils';

describe('woocommerceOperations - Error Handling', () => {
  beforeEach(setupMocks);

  describe('API Errors', () => {
    it('should handle API connection timeout', async () => {
      mockExecuteWooCommerceOperation.mockRejectedValue(
        new Error('Connection timeout after 30000ms')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expectErrorResult(result);
      expect(result.error?.message).toContain('timeout');
    });

    it('should handle API rate limiting', async () => {
      mockExecuteWooCommerceOperation.mockRejectedValue(
        new Error('Rate limit exceeded: 60 requests per minute')
      );

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump'
        },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Rate limit');
    });

    it('should handle underlying function errors', async () => {
      mockExecuteWooCommerceOperation.mockRejectedValue(
        new Error('WooCommerce API error')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expectErrorResult(result);
    });

    it('should handle database connection error', async () => {
      mockExecuteWooCommerceOperation.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_sales_report',
          period: 'week'
        },
        mockContext
      );

      expectErrorResult(result);
    });

    it('should handle failed operations gracefully', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createErrorResponse('Operation failed')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data?.message).toBe('Operation failed');
    });

    it('should handle operations with empty data', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: null,
        message: 'No data found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'check_order',
          orderId: '12345'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data).toBeNull();
    });

    it('should wrap operation errors with context', async () => {
      mockExecuteWooCommerceOperation.mockRejectedValue(
        new Error('Original error message')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expect(result.error?.details).toBeDefined();
    });

    it('should track failed operation for monitoring', async () => {
      mockExecuteWooCommerceOperation.mockRejectedValue(
        new Error('API error')
      );

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump'
        },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Response Format', () => {
    it('should return ToolResult with correct envelope', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ product: { id: 1, name: 'Test' } }, 'Success')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
    });

    it('should include execution time in metadata', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ product: { id: 1 } }, 'Success')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata?.executionTime).toBe('number');
    });

    it('should include operation in metadata', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ product: { id: 1 } }, 'Success')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expect(result.metadata?.operation).toBe('get_product_details');
    });

    it('should include error details on failure', async () => {
      mockExecuteWooCommerceOperation.mockRejectedValue(
        new Error('Test error')
      );

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBeDefined();
      expect(result.error?.message).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations with special characters in parameters', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ products: [] }, 'Products found')
      );

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump & motor - special/chars #123'
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should handle concurrent operations gracefully', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ product: { id: 1 } }, 'Product found')
      );

      const operations = Array(5).fill(null).map((_, i) =>
        woocommerceOperations(
          {
            operation: 'get_product_details',
            productId: String(i + 1)
          },
          mockContext
        )
      );

      const results = await Promise.all(operations);

      results.forEach(result => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('metadata');
      });
    });
  });

  describe('Performance', () => {
    it('should execute operations within 500ms', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue(
        createSuccessResponse({ product: { id: 1, name: 'Test' } }, 'Success')
      );

      const { duration } = await measureExecutionTime(() =>
        woocommerceOperations(
          {
            operation: 'get_product_details',
            productId: '123'
          },
          mockContext
        )
      );

      expect(duration).toBeLessThan(500);
    });
  });
});