/**
 * MCP Tool: WooCommerce Operations
 *
 * Purpose: Execute WooCommerce operations through MCP interface (proxy pattern)
 * Category: commerce
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 *
 * This tool provides complete WooCommerce functionality via MCP:
 * 1. Product operations (25 operations total)
 * 2. Order management
 * 3. Cart operations
 * 4. Store configuration
 * 5. Analytics and reporting
 *
 * Implementation: Proxy pattern - wraps existing executeWooCommerceOperation
 */

import { z } from 'zod';
import { ExecutionContext, ToolResult } from '../shared/types';
import { validateInput } from '../shared/validation';
import { logToolExecution, PerformanceTimer } from '../shared/utils/logger';
import { executeWooCommerceOperation } from '@/lib/chat/woocommerce-tool';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import type { PaginationMetadata } from '@/lib/chat/pagination-utils';

// =====================================================
// SECTION 1: Type Definitions
// =====================================================

/**
 * Input schema matching the existing WooCommerce tool definition
 * All 25 operations with full parameter support
 */
export const woocommerceOperationsInputSchema = z.object({
  operation: z.enum([
    "check_stock",
    "get_stock_quantity",
    "get_product_details",
    "check_order",
    "get_shipping_info",
    "get_shipping_methods",
    "check_price",
    "get_product_variations",
    "get_product_categories",
    "get_product_reviews",
    "validate_coupon",
    "check_refund_status",
    "get_customer_orders",
    "get_order_notes",
    "get_payment_methods",
    "get_customer_insights",
    "get_low_stock_products",
    "get_sales_report",
    "search_products",
    "cancel_order",
    "add_to_cart",
    "get_cart",
    "remove_from_cart",
    "update_cart_quantity",
    "apply_coupon_to_cart"
  ]).describe("The specific WooCommerce operation to execute"),

  // Product parameters
  productId: z.string().optional().describe("Product ID or SKU for stock/product operations"),
  includeQuantity: z.boolean().optional().describe("Whether to include exact stock quantities"),

  // Order parameters
  orderId: z.string().optional().describe("Order ID for order operations"),
  email: z.string().email().optional().describe("Customer email for order lookups"),
  status: z.string().optional().describe("Order status filter (pending, processing, completed, etc.)"),
  dateFrom: z.string().optional().describe("Start date for order history filter (YYYY-MM-DD)"),
  dateTo: z.string().optional().describe("End date for order history filter (YYYY-MM-DD)"),
  reason: z.string().optional().describe("Cancellation reason (optional)"),

  // Category parameters
  categoryId: z.string().optional().describe("Category ID for category operations"),
  parentCategory: z.number().optional().describe("Parent category ID to filter subcategories"),

  // Search/filter parameters
  query: z.string().optional().describe("Search keyword for product search"),
  minPrice: z.number().optional().describe("Minimum price filter for product search"),
  maxPrice: z.number().optional().describe("Maximum price filter for product search"),
  orderby: z.string().optional().describe("Sort by: 'date', 'price', 'popularity', 'rating'"),
  attributes: z.record(z.string()).optional().describe("Attribute filters for product search"),
  minRating: z.number().optional().describe("Minimum rating filter (1-5 stars)"),

  // Pagination parameters
  limit: z.number().optional().describe("Maximum number of results to return"),
  page: z.number().min(1).optional().describe("Page number for pagination (1-indexed, default: 1)"),
  per_page: z.number().min(1).max(100).optional().describe("Results per page (default: 20, max: 100)"),
  offset: z.number().min(0).optional().describe("Number of results to skip (alternative to page-based pagination)"),

  // Variation parameters
  variationId: z.string().optional().describe("Specific variation ID to retrieve"),

  // Shipping parameters
  country: z.string().optional().describe("Country code for shipping calculation (e.g., GB, US)"),
  postcode: z.string().optional().describe("Postcode/ZIP code for shipping calculation"),

  // Store configuration parameters
  couponCode: z.string().optional().describe("Coupon code to validate"),
  threshold: z.number().optional().describe("Stock threshold for low stock alerts (default: 5)"),
  period: z.string().optional().describe("Report period: day, week, month, year"),

  // Cart parameters
  quantity: z.number().optional().describe("Quantity to add to cart (default: 1)"),
  cartItemKey: z.string().optional().describe("Cart item key for removal/update"),

  // Domain parameter (for URL generation)
  domain: z.string().optional().describe("Store domain for URL generation"),
});

export type WoocommerceOperationsInput = z.infer<typeof woocommerceOperationsInputSchema>;

export interface WoocommerceOperationsOutput {
  success: boolean;
  data: any;
  message: string;
  currency?: string;
  currencySymbol?: string;
  pagination?: PaginationMetadata;
  executionTime: number;
  source: 'woocommerce' | 'error' | 'invalid-domain';
}

// =====================================================
// SECTION 2: MCP Metadata
// =====================================================

export const metadata = {
  name: 'woocommerceOperations',
  description: 'Execute WooCommerce operations: products, orders, cart, analytics (25 operations)',
  category: 'commerce',
  version: '1.0.0',
  author: 'Omniops Engineering',

  inputSchema: woocommerceOperationsInputSchema,

  capabilities: {
    requiresAuth: true,
    requiresContext: ['domain'],
    rateLimit: { requests: 100, window: '1m' },
    caching: { enabled: true, ttl: 60 },
    multiOperation: true,
    transactional: true,
    analytics: true
  },

  operationCategories: {
    product: [
      'check_stock',
      'get_stock_quantity',
      'get_product_details',
      'search_products',
      'check_price',
      'get_product_variations',
      'get_product_categories',
      'get_product_reviews',
      'get_low_stock_products'
    ],
    order: [
      'check_order',
      'get_customer_orders',
      'get_order_notes',
      'check_refund_status',
      'cancel_order'
    ],
    cart: [
      'add_to_cart',
      'get_cart',
      'remove_from_cart',
      'update_cart_quantity',
      'apply_coupon_to_cart'
    ],
    store: [
      'get_shipping_info',
      'get_shipping_methods',
      'get_payment_methods',
      'validate_coupon'
    ],
    analytics: [
      'get_customer_insights',
      'get_sales_report'
    ]
  },

  examples: [
    {
      description: 'Check product stock',
      input: { operation: 'check_stock', productId: 'SKU-123' },
      expectedOutput: 'Stock availability and quantity information'
    },
    {
      description: 'Search products',
      input: { operation: 'search_products', query: 'pump', limit: 10 },
      expectedOutput: 'List of matching products with details'
    },
    {
      description: 'Lookup order',
      input: { operation: 'check_order', orderId: '12345' },
      expectedOutput: 'Order status, items, and tracking information'
    },
    {
      description: 'Add to cart',
      input: { operation: 'add_to_cart', productId: 'SKU-123', quantity: 2 },
      expectedOutput: 'Updated cart with added item'
    },
    {
      description: 'Get sales report',
      input: { operation: 'get_sales_report', period: 'week' },
      expectedOutput: 'Sales analytics for specified period'
    }
  ],

  performance: {
    avgLatency: '200-500ms',
    maxLatency: '3s',
    complexity: 'medium',
    tokenUsage: {
      input: 0,
      output: 150 // Estimated tokens for typical operation result
    }
  }
};

// =====================================================
// SECTION 3: Tool Implementation
// =====================================================

/**
 * Execute WooCommerce operation via MCP interface
 *
 * Strategy (Proxy Pattern):
 * 1. Validate input using Zod schema
 * 2. Normalize domain from context
 * 3. Call existing executeWooCommerceOperation (zero duplication)
 * 4. Add MCP-specific metadata (timing, logging)
 * 5. Return standardized ToolResult
 */
export async function woocommerceOperations(
  input: WoocommerceOperationsInput,
  context: ExecutionContext
): Promise<ToolResult<WoocommerceOperationsOutput>> {
  const timer = new PerformanceTimer();

  try {
    // Validate input
    const validatedInput = validateInput(woocommerceOperationsInputSchema, input);

    // Check required context
    if (!context.domain) {
      throw new Error('Missing required context: domain');
    }

    console.log(
      `[MCP woocommerceOperations] Operation: "${validatedInput.operation}" | Domain: ${context.domain}`
    );

    // Normalize domain
    const normalizedDomain = normalizeDomain(context.domain);
    if (!normalizedDomain) {
      const executionTime = timer.elapsed();

      await logToolExecution({
        tool: 'woocommerceOperations',
        category: 'commerce',
        customerId: context.customerId || 'unknown',
        status: 'error',
        error: 'Invalid or localhost domain',
        executionTime,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        data: {
          success: false,
          data: null,
          message: 'Invalid or localhost domain - cannot execute WooCommerce operation',
          source: 'invalid-domain',
          executionTime
        },
        error: {
          code: 'INVALID_DOMAIN',
          message: 'Invalid or localhost domain'
        },
        metadata: {
          executionTime
        }
      };
    }

    // Call existing implementation (PROXY PATTERN - zero duplication)
    const result = await executeWooCommerceOperation(
      validatedInput.operation,
      validatedInput,
      normalizedDomain
    );

    const executionTime = timer.elapsed();

    console.log(
      `[MCP woocommerceOperations] Operation "${validatedInput.operation}" completed in ${executionTime}ms | Success: ${result.success}`
    );

    // Log execution
    await logToolExecution({
      tool: 'woocommerceOperations',
      category: 'commerce',
      customerId: context.customerId || 'unknown',
      status: result.success ? 'success' : 'error',
      error: result.success ? undefined : result.message,
      executionTime,
      timestamp: new Date().toISOString()
    });

    // Return MCP-formatted result
    return {
      success: result.success,
      data: {
        success: result.success,
        data: result.data,
        message: result.message,
        currency: result.currency,
        currencySymbol: result.currencySymbol,
        pagination: result.pagination,
        source: result.success ? 'woocommerce' : 'error',
        executionTime
      },
      metadata: {
        executionTime,
        cached: false,
        operation: validatedInput.operation
      }
    };

  } catch (error) {
    const executionTime = timer.elapsed();

    console.error('[MCP woocommerceOperations] Error:', error);

    await logToolExecution({
      tool: 'woocommerceOperations',
      category: 'commerce',
      customerId: context.customerId || 'unknown',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      data: {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        source: 'error',
        executionTime
      },
      error: {
        code: 'WOOCOMMERCE_OPERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      metadata: {
        executionTime
      }
    };
  }
}

export default woocommerceOperations;
