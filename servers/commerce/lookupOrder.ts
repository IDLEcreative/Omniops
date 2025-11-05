/**
 * MCP Tool: Lookup Order
 *
 * Purpose: Look up order information from commerce providers (WooCommerce/Shopify) by order number or email
 * Category: commerce
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 *
 * This tool provides multi-platform order lookup:
 * 1. Commerce provider resolution (WooCommerce/Shopify)
 * 2. Order lookup by ID or email
 * 3. Formatted order information for chat responses
 */

import { z } from 'zod';
import { SearchResult } from '@/types';
import { ExecutionContext, ToolResult } from '../shared/types';
import { validateInput } from '../shared/validation';
import { logToolExecution, PerformanceTimer } from '../shared/utils/logger';
import { getCommerceProvider, OrderInfo } from '@/lib/agents/commerce-provider';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

// =====================================================
// SECTION 1: Type Definitions
// =====================================================

export const lookupOrderInputSchema = z.object({
  orderId: z.string().min(1).max(100).describe('Order number or ID to lookup'),
  email: z.string().email().optional().describe('Optional customer email for additional validation'),
});

export type LookupOrderInput = z.infer<typeof lookupOrderInputSchema>;

export interface LookupOrderOutput {
  success: boolean;
  order: OrderInfo | null;
  source: 'woocommerce' | 'shopify' | 'error' | 'invalid-domain' | 'no-provider' | 'not-found';
  executionTime: number;
  formattedResult?: SearchResult;
}

// =====================================================
// SECTION 2: MCP Metadata
// =====================================================

export const metadata = {
  name: 'lookupOrder',
  description: 'Look up order details by order number from WooCommerce or Shopify',
  category: 'commerce',
  version: '1.0.0',
  author: 'Omniops Engineering',

  inputSchema: lookupOrderInputSchema,

  capabilities: {
    requiresAuth: true,
    requiresContext: ['customerId', 'domain'],
    rateLimit: { requests: 50, window: '1m' },
    caching: { enabled: true, ttl: 60 }
  },

  examples: [
    {
      description: 'Lookup order by order number',
      input: { orderId: '12345' },
      expectedOutput: 'Order details including status, items, total, and customer info'
    },
    {
      description: 'Lookup order with email validation',
      input: { orderId: '12345', email: 'customer@example.com' },
      expectedOutput: 'Order details if order number matches and email is found in billing info'
    },
    {
      description: 'Lookup WooCommerce order',
      input: { orderId: 'WC-12345' },
      expectedOutput: 'WooCommerce order details formatted for chat response'
    }
  ],

  performance: {
    avgLatency: '300ms',
    maxLatency: '2s',
    tokenUsage: {
      input: 0,
      output: 100 // Estimated tokens for order details
    }
  }
};

// =====================================================
// SECTION 3: Helper Functions
// =====================================================

/**
 * Format order information as a SearchResult for chat display
 */
function formatOrderAsSearchResult(order: OrderInfo, platform: string): SearchResult {
  const itemsList = order.items
    .map((item) => `${item.name} (x${item.quantity})`)
    .join(', ');

  const orderInfo = `Order #${order.number}
Status: ${order.status}
Date: ${order.date}
Total: ${order.currency}${order.total}
Items: ${itemsList || 'No items'}
${order.billing ? `Customer: ${order.billing.firstName} ${order.billing.lastName}` : ''}
${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}`;

  return {
    content: orderInfo,
    url: order.permalink || '',
    title: `Order #${order.number}`,
    similarity: 1.0
  };
}

// =====================================================
// SECTION 4: Tool Implementation
// =====================================================

/**
 * Lookup order by order number from commerce provider
 *
 * Strategy:
 * 1. Validate and normalize domain
 * 2. Resolve commerce provider (WooCommerce/Shopify)
 * 3. Lookup order using provider API
 * 4. Format order information for chat response
 */
export async function lookupOrder(
  input: LookupOrderInput,
  context: ExecutionContext
): Promise<ToolResult<LookupOrderOutput>> {
  const timer = new PerformanceTimer();

  try {
    // Validate input
    const validatedInput = validateInput(lookupOrderInputSchema, input);

    // Check required context
    if (!context.domain) {
      throw new Error('Missing required context: domain');
    }

    console.log(`[MCP lookupOrder] Order ID: "${validatedInput.orderId}" | Domain: ${context.domain}`);

    // Normalize domain
    const normalizedDomain = normalizeDomain(context.domain);
    if (!normalizedDomain) {
      const executionTime = timer.elapsed();

      await logToolExecution({
        tool: 'lookupOrder',
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
          order: null,
          source: 'invalid-domain',
          executionTime
        },
        error: {
          code: 'INVALID_DOMAIN',
          message: 'Invalid or localhost domain - cannot lookup order without valid domain'
        },
        metadata: {
          executionTime
        }
      };
    }

    // Get commerce provider
    const provider = await getCommerceProvider(normalizedDomain);

    if (!provider) {
      const executionTime = timer.elapsed();

      console.log('[MCP lookupOrder] No commerce provider available for domain');

      await logToolExecution({
        tool: 'lookupOrder',
        category: 'commerce',
        customerId: context.customerId || 'unknown',
        status: 'error',
        error: 'No commerce provider configured',
        executionTime,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        data: {
          success: false,
          order: null,
          source: 'no-provider',
          executionTime
        },
        error: {
          code: 'NO_PROVIDER',
          message: 'No commerce provider (WooCommerce/Shopify) configured for this domain'
        },
        metadata: {
          executionTime
        }
      };
    }

    console.log(`[MCP lookupOrder] Using commerce provider "${provider.platform}" for ${normalizedDomain}`);

    // Lookup order using provider
    const order = await provider.lookupOrder(validatedInput.orderId, validatedInput.email);

    const executionTime = timer.elapsed();

    if (!order) {
      console.log(`[MCP lookupOrder] No order found for ID: ${validatedInput.orderId}`);

      await logToolExecution({
        tool: 'lookupOrder',
        category: 'commerce',
        customerId: context.customerId || 'unknown',
        status: 'success',
        resultCount: 0,
        executionTime,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          success: false,
          order: null,
          source: 'not-found',
          executionTime
        },
        metadata: {
          executionTime,
          cached: false,
          source: provider.platform
        }
      };
    }

    console.log(
      `[MCP lookupOrder] Order found via ${provider.platform}: ${order.id} - Status: ${order.status}`
    );

    // Format order as SearchResult
    const formattedResult = formatOrderAsSearchResult(order, provider.platform);

    await logToolExecution({
      tool: 'lookupOrder',
      category: 'commerce',
      customerId: context.customerId || 'unknown',
      status: 'success',
      resultCount: 1,
      executionTime,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        success: true,
        order,
        source: provider.platform as any,
        executionTime,
        formattedResult
      },
      metadata: {
        executionTime,
        cached: false,
        source: provider.platform
      }
    };

  } catch (error) {
    const executionTime = timer.elapsed();

    console.error('[MCP lookupOrder] Error:', error);

    await logToolExecution({
      tool: 'lookupOrder',
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
        order: null,
        source: 'error',
        executionTime
      },
      error: {
        code: 'LOOKUP_ORDER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred during order lookup',
        details: error
      },
      metadata: {
        executionTime
      }
    };
  }
}

export default lookupOrder;
