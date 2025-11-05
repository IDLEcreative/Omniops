/**
 * Tests for lookupOrder MCP Tool
 *
 * Coverage:
 * - Valid order lookups (WooCommerce & Shopify)
 * - Email validation scenarios
 * - Order not found scenarios
 * - Input validation (missing/invalid params)
 * - Context validation (missing domain/customerId)
 * - API error handling (provider failures)
 * - Response format validation
 * - Execution time tracking
 */

import { lookupOrder } from '../lookupOrder';
import { ExecutionContext } from '../../shared/types';
import { getCommerceProvider, OrderInfo, CommerceProvider } from '@/lib/agents/commerce-provider';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

// Mock dependencies
jest.mock('@/lib/agents/commerce-provider');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: jest.fn().mockReturnValue(150)
  }))
}));

const mockGetCommerceProvider = getCommerceProvider as jest.MockedFunction<typeof getCommerceProvider>;
const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;

describe('lookupOrder MCP Tool', () => {
  const mockContext: ExecutionContext = {
    customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
    domain: 'thompsonseparts.co.uk'
  };

  const mockWooCommerceOrder: OrderInfo = {
    id: 12345,
    number: '12345',
    status: 'processing',
    date: '2025-11-05T10:30:00Z',
    total: '149.99',
    currency: '£',
    items: [
      { name: 'Hydraulic Pump A4VTG90', quantity: 1, total: '99.99' },
      { name: 'Seal Kit BP-001', quantity: 2, total: '50.00' }
    ],
    billing: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    },
    trackingNumber: 'TRACK123456',
    permalink: 'https://thompsonseparts.co.uk/order/12345'
  };

  const mockShopifyOrder: OrderInfo = {
    id: 67890,
    number: 'SP-67890',
    status: 'fulfilled',
    date: '2025-11-04T14:20:00Z',
    total: '299.50',
    currency: '$',
    items: [
      { name: 'Premium Pump Kit', quantity: 1, total: '299.50' }
    ],
    billing: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com'
    },
    trackingNumber: 'SHIP789456',
    permalink: 'https://shop.example.com/orders/67890'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockImplementation((domain) => {
      if (domain?.includes('localhost') || domain === '') return '';
      return domain?.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase() || '';
    });
  });

  describe('WooCommerce Integration', () => {
    beforeEach(() => {
      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(mockWooCommerceOrder),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);
    });

    it('should lookup order by order number', async () => {
      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
      expect(result.data?.order).toEqual(mockWooCommerceOrder);
      expect(result.data?.source).toBe('woocommerce');
      expect(result.data?.formattedResult).toBeDefined();
      expect(result.data?.formattedResult?.title).toBe('Order #12345');
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
    });

    it('should lookup order with email validation', async () => {
      const result = await lookupOrder(
        { orderId: '12345', email: 'john.doe@example.com' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.order).toEqual(mockWooCommerceOrder);
      expect(mockGetCommerceProvider).toHaveBeenCalledWith('thompsonseparts.co.uk');
    });

    it('should format order details correctly', async () => {
      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      const formatted = result.data?.formattedResult;
      expect(formatted?.content).toContain('Order #12345');
      expect(formatted?.content).toContain('Status: processing');
      expect(formatted?.content).toContain('Total: £149.99');
      expect(formatted?.content).toContain('Hydraulic Pump A4VTG90 (x1)');
      expect(formatted?.content).toContain('Seal Kit BP-001 (x2)');
      expect(formatted?.content).toContain('Customer: John Doe');
      expect(formatted?.content).toContain('Tracking: TRACK123456');
      expect(formatted?.similarity).toBe(1.0);
    });

    it('should handle order not found', async () => {
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(null),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: '99999' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(false);
      expect(result.data?.order).toBeNull();
      expect(result.data?.source).toBe('not-found');
    });

    it('should handle WooCommerce API errors', async () => {
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockRejectedValue(new Error('WooCommerce API connection failed')),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data?.success).toBe(false);
      expect(result.data?.source).toBe('error');
      expect(result.error?.code).toBe('LOOKUP_ORDER_ERROR');
      expect(result.error?.message).toContain('WooCommerce API connection failed');
    });
  });

  describe('Shopify Integration', () => {
    beforeEach(() => {
      mockNormalizeDomain.mockReturnValue('shop.example.com');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'shopify',
        lookupOrder: jest.fn().mockResolvedValue(mockShopifyOrder),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);
    });

    it('should lookup Shopify order by order number', async () => {
      const result = await lookupOrder(
        { orderId: 'SP-67890' },
        { ...mockContext, domain: 'shop.example.com' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.order).toEqual(mockShopifyOrder);
      expect(result.data?.source).toBe('shopify');
      expect(result.data?.formattedResult?.title).toBe('Order #SP-67890');
    });

    it('should lookup Shopify order with email', async () => {
      const result = await lookupOrder(
        { orderId: 'SP-67890', email: 'jane.smith@example.com' },
        { ...mockContext, domain: 'shop.example.com' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.order?.billing?.email).toBe('jane.smith@example.com');
    });

    it('should handle Shopify order not found', async () => {
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'shopify',
        lookupOrder: jest.fn().mockResolvedValue(null),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: 'SP-99999' },
        { ...mockContext, domain: 'shop.example.com' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(false);
      expect(result.data?.order).toBeNull();
      expect(result.data?.source).toBe('not-found');
    });

    it('should handle Shopify API errors', async () => {
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'shopify',
        lookupOrder: jest.fn().mockRejectedValue(new Error('Shopify rate limit exceeded')),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: 'SP-67890' },
        { ...mockContext, domain: 'shop.example.com' }
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('error');
      expect(result.error?.message).toContain('Shopify rate limit exceeded');
    });
  });

  describe('Input Validation', () => {
    it('should reject empty order ID', async () => {
      const result = await lookupOrder(
        { orderId: '' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LOOKUP_ORDER_ERROR');
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should reject invalid email format', async () => {
      const result = await lookupOrder(
        { orderId: '12345', email: 'not-an-email' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
      expect(result.error?.message).toContain('email');
    });

    it('should accept valid order ID without email', async () => {
      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(mockWooCommerceOrder),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should reject order ID exceeding max length', async () => {
      const longOrderId = 'A'.repeat(101);
      const result = await lookupOrder(
        { orderId: longOrderId },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });
  });

  describe('Context Validation', () => {
    it('should reject missing domain', async () => {
      const result = await lookupOrder(
        { orderId: '12345' },
        { ...mockContext, domain: '' } as ExecutionContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LOOKUP_ORDER_ERROR');
      expect(result.error?.message).toContain('Missing required context: domain');
    });

    it('should handle invalid domain (localhost)', async () => {
      mockNormalizeDomain.mockReturnValue('');

      const result = await lookupOrder(
        { orderId: '12345' },
        { ...mockContext, domain: 'localhost' }
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('invalid-domain');
      expect(result.error?.code).toBe('INVALID_DOMAIN');
    });

    it('should handle missing customerId gracefully', async () => {
      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(mockWooCommerceOrder),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: '12345' },
        { ...mockContext, customerId: '' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.order).toEqual(mockWooCommerceOrder);
    });
  });

  describe('Provider Resolution', () => {
    it('should handle no commerce provider configured', async () => {
      mockNormalizeDomain.mockReturnValue('no-commerce.com');
      mockGetCommerceProvider.mockResolvedValue(null);

      const result = await lookupOrder(
        { orderId: '12345' },
        { ...mockContext, domain: 'no-commerce.com' }
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('no-provider');
      expect(result.error?.code).toBe('NO_PROVIDER');
      expect(result.error?.message).toContain('No commerce provider');
    });

    it('should call getCommerceProvider with normalized domain', async () => {
      mockNormalizeDomain.mockReturnValue('example.com');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(mockWooCommerceOrder),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      await lookupOrder(
        { orderId: '12345' },
        { ...mockContext, domain: 'https://www.example.com' }
      );

      expect(mockNormalizeDomain).toHaveBeenCalledWith('https://www.example.com');
      expect(mockGetCommerceProvider).toHaveBeenCalledWith('example.com');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(mockWooCommerceOrder),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);
    });

    it('should return ToolResult with correct structure', async () => {
      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('executionTime');
      expect(result.metadata).toHaveProperty('cached');
      expect(result.metadata).toHaveProperty('source');
    });

    it('should include execution time in metadata', async () => {
      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(typeof result.metadata?.executionTime).toBe('number');
    });

    it('should include source platform in metadata', async () => {
      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result.metadata?.source).toBe('woocommerce');
      expect(result.metadata?.cached).toBe(false);
    });

    it('should format SearchResult with all required fields', async () => {
      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      const searchResult = result.data?.formattedResult;
      expect(searchResult).toHaveProperty('content');
      expect(searchResult).toHaveProperty('url');
      expect(searchResult).toHaveProperty('title');
      expect(searchResult).toHaveProperty('similarity');
      expect(searchResult?.url).toBe('https://thompsonseparts.co.uk/order/12345');
    });
  });

  describe('Edge Cases', () => {
    it('should handle order with no items', async () => {
      const orderWithNoItems: OrderInfo = {
        ...mockWooCommerceOrder,
        items: []
      };

      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(orderWithNoItems),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.formattedResult?.content).toContain('Items: No items');
    });

    it('should handle order without billing information', async () => {
      const orderNoBilling: OrderInfo = {
        ...mockWooCommerceOrder,
        billing: undefined
      };

      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(orderNoBilling),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.formattedResult?.content).not.toContain('Customer:');
    });

    it('should handle order without tracking number', async () => {
      const orderNoTracking: OrderInfo = {
        ...mockWooCommerceOrder,
        trackingNumber: null
      };

      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(orderNoTracking),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.formattedResult?.content).not.toContain('Tracking:');
    });

    it('should handle order without permalink', async () => {
      const orderNoPermalink: OrderInfo = {
        ...mockWooCommerceOrder,
        permalink: null
      };

      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockGetCommerceProvider.mockResolvedValue({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(orderNoPermalink),
        searchProducts: jest.fn(),
        checkStock: jest.fn(),
        getProductDetails: jest.fn()
      } as unknown as CommerceProvider);

      const result = await lookupOrder(
        { orderId: '12345' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.formattedResult?.url).toBe('');
    });
  });
});
