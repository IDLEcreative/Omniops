/**
 * Tests for woocommerceOperations MCP Tool
 *
 * Coverage:
 * - All 25 WooCommerce operations across 5 categories:
 *   1. Product Operations (8 tests)
 *   2. Order Operations (6 tests)
 *   3. Cart Operations (4 tests)
 *   4. Store Config Operations (4 tests)
 *   5. Analytics Operations (3 tests)
 * - Input validation (10 tests)
 * - Context validation (3 tests)
 * - Error handling (8 tests)
 * - Response format validation (4 tests)
 * - Performance tests (2 tests)
 * - Edge cases (2 tests)
 *
 * Total: 52 tests
 */

import { woocommerceOperations, metadata } from '../woocommerceOperations';
import { ExecutionContext } from '../../shared/types';
import { executeWooCommerceOperation } from '@/lib/chat/woocommerce-tool';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

// Mock dependencies
jest.mock('@/lib/chat/woocommerce-tool');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: jest.fn().mockReturnValue(150)
  }))
}));

const mockExecuteWooCommerceOperation = executeWooCommerceOperation as jest.MockedFunction<typeof executeWooCommerceOperation>;
const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;

describe('woocommerceOperations MCP Tool', () => {
  const mockContext: ExecutionContext = {
    customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
    domain: 'thompsonseparts.co.uk',
    platform: 'woocommerce',
    traceId: 'test-trace-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockImplementation((domain) => {
      if (domain?.includes('localhost') || domain === '') return '';
      return domain?.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase() || '';
    });
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
  });

  // =====================================================
  // METADATA AND SCHEMA TESTS
  // =====================================================

  describe('Metadata', () => {
    it('should have correct metadata name', () => {
      expect(metadata.name).toBe('woocommerceOperations');
    });

    it('should have commerce category', () => {
      expect(metadata.category).toBe('commerce');
    });

    it('should have version defined', () => {
      expect(metadata.version).toBeDefined();
      expect(typeof metadata.version).toBe('string');
    });

    it('should have tool description', () => {
      expect(metadata.description).toBeDefined();
      expect(metadata.description.length).toBeGreaterThan(0);
    });

    it('should require authentication', () => {
      expect(metadata.capabilities.requiresAuth).toBe(true);
    });

    it('should require context (domain)', () => {
      expect(metadata.capabilities.requiresContext).toContain('domain');
    });

    it('should have rate limiting configured', () => {
      expect(metadata.capabilities.rateLimit).toBeDefined();
      expect(metadata.capabilities.rateLimit?.requests).toBeGreaterThan(0);
    });
  });

  // =====================================================
  // SECTION 1: PRODUCT OPERATIONS (8 tests)
  // =====================================================

  describe('Product Operations', () => {
    it('should search products by name', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          products: [
            {
              id: 123,
              name: 'Hydraulic Pump A4VTG90',
              sku: 'MU110667601',
              price: '1250.00'
            }
          ]
        },
        message: 'Products found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'hydraulic pump',
          limit: 10
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.products).toBeDefined();
      expect(result.data?.data?.products).toHaveLength(1);
      expect(mockExecuteWooCommerceOperation).toHaveBeenCalledWith(
        'search_products',
        expect.objectContaining({ query: 'hydraulic pump' }),
        'thompsonseparts.co.uk'
      );
    });

    it('should get product details by ID', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          product: {
            id: 123,
            name: 'Hydraulic Pump A4VTG90',
            sku: 'MU110667601',
            price: '1250.00',
            description: 'High-performance pump',
            stock: 15
          }
        },
        message: 'Product found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.product).toBeDefined();
      expect(result.data?.data?.product?.id).toBe(123);
    });

    it('should check product stock', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          stock: 15,
          status: 'in_stock'
        },
        message: 'Stock checked'
      });

      const result = await woocommerceOperations(
        {
          operation: 'check_stock',
          productId: '123'
        },
        mockContext
      );

      expect(result.success).toBe(true);
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

      expect(result.success).toBe(true);
      expect(result.data?.data?.regularPrice).toBe('1250.00');
      expect(result.data?.data?.salePrice).toBe('1050.00');
    });

    it('should handle product not found', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: false,
        data: null,
        message: 'Product not found'
      });

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
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          products: [
            { id: 1, name: 'Pump A', sku: 'SKU1' },
            { id: 2, name: 'Pump B', sku: 'SKU2' }
          ]
        },
        message: 'Products found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump',
          limit: 20
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.products).toHaveLength(2);
    });

    it('should get product variations', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          variations: [
            { id: 1, name: 'Red', price: '100.00' },
            { id: 2, name: 'Blue', price: '100.00' }
          ]
        },
        message: 'Variations found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_product_variations',
          productId: '123'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.variations).toHaveLength(2);
    });
  });

  // =====================================================
  // SECTION 2: ORDER OPERATIONS (6 tests)
  // =====================================================

  describe('Order Operations', () => {
    it('should check order by ID', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          order: {
            id: 12345,
            number: '12345',
            status: 'processing',
            total: '149.99',
            currency: 'GBP'
          }
        },
        message: 'Order found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'check_order',
          orderId: '12345'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.order).toBeDefined();
      expect(result.data?.data?.order?.id).toBe(12345);
    });

    it('should get shipping info', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          trackingNumber: 'TRACK123456',
          carrier: 'DHL',
          estimatedDelivery: '2025-11-10'
        },
        message: 'Shipping info retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_shipping_info',
          orderId: '12345'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.trackingNumber).toBe('TRACK123456');
      expect(result.data?.data?.carrier).toBe('DHL');
    });

    it('should get customer orders', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          orders: [
            { id: 1, status: 'completed', total: '99.99' },
            { id: 2, status: 'processing', total: '50.00' }
          ]
        },
        message: 'Customer orders retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_customer_orders',
          email: 'customer@example.com'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.orders).toHaveLength(2);
    });

    it('should get order notes', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          notes: [
            { note: 'Order shipped', date: '2025-11-01' },
            { note: 'Payment received', date: '2025-11-02' }
          ]
        },
        message: 'Order notes retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_order_notes',
          orderId: '12345'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.notes).toHaveLength(2);
    });

    it('should handle order not found', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: false,
        data: null,
        message: 'Order not found'
      });

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
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          refundStatus: 'pending',
          refundAmount: '50.00'
        },
        message: 'Refund status retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'check_refund_status',
          orderId: '12345'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.refundStatus).toBe('pending');
    });
  });

  // =====================================================
  // SECTION 3: CART OPERATIONS (4 tests)
  // =====================================================

  describe('Cart Operations', () => {
    it('should add product to cart', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          cartId: 'cart-123',
          itemCount: 1
        },
        message: 'Added to cart'
      });

      const result = await woocommerceOperations(
        {
          operation: 'add_to_cart',
          productId: '123',
          quantity: 1
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.cartId).toBeDefined();
      expect(result.data?.data?.itemCount).toBe(1);
    });

    it('should update cart item quantity', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          cartId: 'cart-123',
          itemCount: 3
        },
        message: 'Cart updated'
      });

      const result = await woocommerceOperations(
        {
          operation: 'update_cart_quantity',
          cartItemKey: 'item-key-123',
          quantity: 3
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.itemCount).toBe(3);
    });

    it('should remove product from cart', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          cartId: 'cart-123',
          itemCount: 0
        },
        message: 'Removed from cart'
      });

      const result = await woocommerceOperations(
        {
          operation: 'remove_from_cart',
          cartItemKey: 'item-key-123'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.itemCount).toBe(0);
    });

    it('should get cart', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          subtotal: '150.00',
          tax: '30.00',
          total: '180.00'
        },
        message: 'Cart retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_cart'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.total).toBe('180.00');
    });
  });

  // =====================================================
  // SECTION 4: STORE CONFIG OPERATIONS (4 tests)
  // =====================================================

  describe('Store Config Operations', () => {
    it('should validate coupon code', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          valid: true,
          discount: '10%',
          minimumAmount: '50.00'
        },
        message: 'Coupon validated'
      });

      const result = await woocommerceOperations(
        {
          operation: 'validate_coupon',
          couponCode: 'SAVE10'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.valid).toBe(true);
    });

    it('should get shipping methods', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          methods: [
            { id: 'flat_rate', title: 'Flat Rate', cost: '5.00' },
            { id: 'free_shipping', title: 'Free Shipping', cost: '0.00' }
          ]
        },
        message: 'Shipping methods retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_shipping_methods',
          country: 'GB',
          postcode: 'SW1A 1AA'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.methods).toHaveLength(2);
    });

    it('should get payment methods', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          methods: [
            { id: 'card', name: 'Credit Card' },
            { id: 'paypal', name: 'PayPal' },
            { id: 'bank', name: 'Bank Transfer' }
          ]
        },
        message: 'Payment methods retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_payment_methods'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.methods).toHaveLength(3);
    });

    it('should get product categories', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          categories: [
            { id: 1, name: 'Hydraulic Parts', count: 45 },
            { id: 2, name: 'Electrical Components', count: 30 }
          ]
        },
        message: 'Categories retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_product_categories'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.categories).toHaveLength(2);
    });
  });

  // =====================================================
  // SECTION 5: ANALYTICS OPERATIONS (3 tests)
  // =====================================================

  describe('Analytics Operations', () => {
    it('should get sales report', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          totalOrders: 150,
          totalRevenue: '25000.00',
          avgOrderValue: '166.67'
        },
        message: 'Sales report generated'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_sales_report',
          period: 'week'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.totalOrders).toBe(150);
      expect(result.data?.data?.totalRevenue).toBe('25000.00');
    });

    it('should get customer insights', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          customerCount: 500,
          repeatCustomerRate: '35%',
          avgCustomerLifetimeValue: '350.00'
        },
        message: 'Customer insights retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_customer_insights'
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.customerCount).toBe(500);
    });

    it('should get low stock products', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: {
          products: [
            { id: 1, name: 'Pump A', stock: 3 },
            { id: 2, name: 'Seal Kit', stock: 2 }
          ]
        },
        message: 'Low stock products retrieved'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_low_stock_products',
          threshold: 5
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.data?.products).toHaveLength(2);
    });
  });

  // =====================================================
  // INPUT VALIDATION TESTS (10 tests)
  // =====================================================

  describe('Input Validation', () => {
    it('should reject empty operation', async () => {
      const result = await woocommerceOperations(
        {
          operation: '' as any
        },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WOOCOMMERCE_OPERATION_ERROR');
    });

    it('should reject invalid operation name', async () => {
      const result = await woocommerceOperations(
        {
          operation: 'invalid_operation_xyz' as any
        },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WOOCOMMERCE_OPERATION_ERROR');
    });

    it('should accept valid operation (optional params)', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { products: [] },
        message: 'Products found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump'
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should accept valid operation with product details', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { product: { id: 1, name: 'Test' } },
        message: 'Product found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should accept valid check_stock operation', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { stock: 10, status: 'in_stock' },
        message: 'Stock checked'
      });

      const result = await woocommerceOperations(
        {
          operation: 'check_stock',
          productId: '123'
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should accept valid add_to_cart operation', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { cartId: 'cart-123' },
        message: 'Added to cart'
      });

      const result = await woocommerceOperations(
        {
          operation: 'add_to_cart',
          productId: '123',
          quantity: 1
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should accept zero quantity as valid', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { cartId: 'cart-123' },
        message: 'Cart updated'
      });

      const result = await woocommerceOperations(
        {
          operation: 'add_to_cart',
          productId: '123',
          quantity: 0
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should accept search with limit', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { products: [] },
        message: 'Products found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump',
          limit: 50
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should accept pagination parameters', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { products: [] },
        message: 'Products found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump',
          page: 2,
          per_page: 20
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should accept price filters', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { products: [] },
        message: 'Products found'
      });

      const result = await woocommerceOperations(
        {
          operation: 'search_products',
          query: 'pump',
          minPrice: 100,
          maxPrice: 500
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });

  // =====================================================
  // CONTEXT VALIDATION TESTS (3 tests)
  // =====================================================

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

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_DOMAIN');
    });

    it('should normalize domain before processing', async () => {
      mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { product: { id: 1 } },
        message: 'Product found'
      });

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

  // =====================================================
  // ERROR HANDLING TESTS (8 tests)
  // =====================================================

  describe('Error Handling', () => {
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

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WOOCOMMERCE_OPERATION_ERROR');
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

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WOOCOMMERCE_OPERATION_ERROR');
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

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WOOCOMMERCE_OPERATION_ERROR');
    });

    it('should handle failed operations gracefully', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: false,
        data: null,
        message: 'Operation failed'
      });

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

  // =====================================================
  // RESPONSE FORMAT TESTS (4 tests)
  // =====================================================

  describe('Response Format', () => {
    it('should return ToolResult with correct envelope', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { product: { id: 1, name: 'Test' } },
        message: 'Success'
      });

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
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { product: { id: 1 } },
        message: 'Success'
      });

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
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { product: { id: 1 } },
        message: 'Success'
      });

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

  // =====================================================
  // PERFORMANCE TESTS (2 tests)
  // =====================================================

  describe('Performance', () => {
    it('should execute operations within 500ms', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { product: { id: 1, name: 'Test' } },
        message: 'Success'
      });

      const start = Date.now();
      await woocommerceOperations(
        {
          operation: 'get_product_details',
          productId: '123'
        },
        mockContext
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('should handle metadata access within 1ms', () => {
      const start = Date.now();
      const _ = metadata.name;
      const duration = Date.now() - start;

      expect(duration).toBeLessThanOrEqual(5); // 5ms threshold to account for test overhead
    });
  });

  // =====================================================
  // EDGE CASES (2 tests)
  // =====================================================

  describe('Edge Cases', () => {
    it('should handle operations with special characters in parameters', async () => {
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { products: [] },
        message: 'Products found'
      });

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
      mockExecuteWooCommerceOperation.mockResolvedValue({
        success: true,
        data: { product: { id: 1 } },
        message: 'Product found'
      });

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

  // =====================================================
  // INTEGRATION TESTS (5 tests)
  // =====================================================

  describe('Integration Scenarios', () => {
    it('should handle multi-operation workflow: search -> get details -> check stock', async () => {
      // Step 1: Search
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { products: [{ id: 123 }] },
        message: 'Products found'
      });
      const searchResult = await woocommerceOperations(
        { operation: 'search_products', query: 'pump' },
        mockContext
      );
      expect(searchResult.success).toBe(true);

      // Step 2: Get Details
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { product: { id: 123, name: 'Pump', price: '100' } },
        message: 'Product found'
      });
      const detailsResult = await woocommerceOperations(
        { operation: 'get_product_details', productId: '123' },
        mockContext
      );
      expect(detailsResult.success).toBe(true);

      // Step 3: Check Stock
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { stock: 10, status: 'in_stock' },
        message: 'Stock checked'
      });
      const stockResult = await woocommerceOperations(
        { operation: 'check_stock', productId: '123' },
        mockContext
      );
      expect(stockResult.success).toBe(true);
    });

    it('should handle cart to order workflow', async () => {
      // Add to cart
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { cartId: 'cart-123', itemCount: 1 },
        message: 'Added to cart'
      });
      const addResult = await woocommerceOperations(
        { operation: 'add_to_cart', productId: '123', quantity: 1 },
        mockContext
      );
      expect(addResult.success).toBe(true);

      // Get cart
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { total: '100.00' },
        message: 'Cart retrieved'
      });
      const totalsResult = await woocommerceOperations(
        { operation: 'get_cart' },
        mockContext
      );
      expect(totalsResult.success).toBe(true);
    });

    it('should retrieve customer order with full details', async () => {
      // Check order
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { order: { id: 12345 } },
        message: 'Order found'
      });
      const orderResult = await woocommerceOperations(
        { operation: 'check_order', orderId: '12345' },
        mockContext
      );
      expect(orderResult.success).toBe(true);

      // Get order notes
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { notes: [{ note: 'Order shipped', date: '2025-11-01' }] },
        message: 'Order notes retrieved'
      });
      const notesResult = await woocommerceOperations(
        { operation: 'get_order_notes', orderId: '12345' },
        mockContext
      );
      expect(notesResult.success).toBe(true);

      // Get shipping info
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { trackingNumber: 'TRACK123' },
        message: 'Shipping info retrieved'
      });
      const shippingResult = await woocommerceOperations(
        { operation: 'get_shipping_info', orderId: '12345' },
        mockContext
      );
      expect(shippingResult.success).toBe(true);
    });

    it('should apply coupon and get updated cart total', async () => {
      // Validate coupon
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { valid: true, discount: '10%' },
        message: 'Coupon validated'
      });
      const couponResult = await woocommerceOperations(
        { operation: 'validate_coupon', couponCode: 'SAVE10' },
        mockContext
      );
      expect(couponResult.success).toBe(true);

      // Get updated cart
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: { total: '90.00' }, // 10% discount applied
        message: 'Cart retrieved'
      });
      const totalsResult = await woocommerceOperations(
        { operation: 'get_cart' },
        mockContext
      );
      expect(totalsResult.success).toBe(true);
    });

    it('should handle payment method selection flow', async () => {
      // List payment methods
      mockExecuteWooCommerceOperation.mockResolvedValueOnce({
        success: true,
        data: {
          methods: [
            { id: 'card', name: 'Credit Card' },
            { id: 'paypal', name: 'PayPal' }
          ]
        },
        message: 'Payment methods retrieved'
      });
      const methodsResult = await woocommerceOperations(
        { operation: 'get_payment_methods' },
        mockContext
      );
      expect(methodsResult.success).toBe(true);
      expect(methodsResult.data?.data?.methods).toHaveLength(2);
    });
  });
});
