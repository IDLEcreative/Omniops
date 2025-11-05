# WooCommerce Operations MCP Tool - Developer Implementation Guide

**Last Updated**: 2025-11-05
**Status**: Ready for Implementation
**Test Suite**: 65 tests waiting in `__tests__/woocommerceOperations.test.ts`

---

## Quick Start

### File Structure
```
servers/commerce/
├── woocommerceOperations.ts          ← Create this file (NEW)
├── lookupOrder.ts                    ← Reference implementation
├── getProductDetails.ts              ← Reference implementation
├── index.ts                          ← Update with new exports
├── README.md                         ← Update documentation
└── __tests__/
    ├── woocommerceOperations.test.ts ← 65 tests ready (NEW)
    ├── lookupOrder.test.ts           ← Reference tests
    └── getProductDetails.test.ts     ← Reference tests
```

---

## Implementation Template

### Step 1: Create the Tool File

Create `/servers/commerce/woocommerceOperations.ts`:

```typescript
/**
 * woocommerceOperations - Comprehensive WooCommerce operations tool
 *
 * Purpose: Execute 25+ WooCommerce operations across:
 * - Product operations (search, details, stock, pricing, variants)
 * - Order operations (lookup, status, shipping, items, refunds)
 * - Cart operations (add, update, remove, totals)
 * - Store config (coupons, payment methods, store info)
 * - Analytics (sales, top products, insights)
 */

import { z } from 'zod';
import { ExecutionContext, ToolResult, ToolSchema } from '../shared/types';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import { PerformanceTimer } from '../shared/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type WooCommerceOperation =
  | 'search_products'
  | 'get_product'
  | 'check_stock'
  | 'get_pricing'
  | 'get_variants'
  | 'lookup_order'
  | 'get_order_status'
  | 'get_shipping_info'
  | 'get_order_items'
  | 'get_refund_status'
  | 'add_to_cart'
  | 'update_cart'
  | 'remove_from_cart'
  | 'get_cart_totals'
  | 'list_coupons'
  | 'validate_coupon'
  | 'list_payment_methods'
  | 'get_store_info'
  | 'get_sales_summary'
  | 'get_top_products'
  | 'get_store_insights';

export interface WooCommerceOperationsInput {
  operation: WooCommerceOperation;
  productId?: string;
  orderId?: string;
  cartId?: string;
  query?: string;
  quantity?: number;
  limit?: number;
  code?: string;
  [key: string]: any;
}

export interface WooCommerceOperationsOutput {
  [key: string]: any;
  // Specific to operation type
}

// ============================================================================
// SCHEMA
// ============================================================================

export const inputSchema = z.object({
  operation: z.enum([
    'search_products',
    'get_product',
    'check_stock',
    'get_pricing',
    'get_variants',
    'lookup_order',
    'get_order_status',
    'get_shipping_info',
    'get_order_items',
    'get_refund_status',
    'add_to_cart',
    'update_cart',
    'remove_from_cart',
    'get_cart_totals',
    'list_coupons',
    'validate_coupon',
    'list_payment_methods',
    'get_store_info',
    'get_sales_summary',
    'get_top_products',
    'get_store_insights'
  ]),
  productId: z.string().max(100).optional(),
  orderId: z.string().max(100).optional(),
  cartId: z.string().max(100).optional(),
  query: z.string().max(500).optional(),
  quantity: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).default(10).optional(),
  code: z.string().max(100).optional(),
}).strict();

export const metadata: ToolSchema = {
  name: 'woocommerceOperations',
  description: 'Execute comprehensive WooCommerce operations: product search/details, order management, cart operations, store configuration, and analytics',
  category: 'commerce',
  version: '1.0.0',
  inputSchema,
  capabilities: {
    requiresAuth: true,
    requiresContext: ['domain', 'customerId'],
    rateLimit: {
      requests: 60,
      window: 'minute'
    },
    caching: {
      enabled: true,
      ttl: 300 // 5 minutes
    }
  },
  examples: [
    {
      description: 'Search for products',
      input: {
        operation: 'search_products',
        query: 'hydraulic pump',
        limit: 10
      },
      expectedOutput: 'Array of products matching query'
    },
    {
      description: 'Look up order',
      input: {
        operation: 'lookup_order',
        orderId: '12345'
      },
      expectedOutput: 'Order details with status, items, and shipping info'
    }
  ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function woocommerceOperations(
  input: unknown,
  context: ExecutionContext
): Promise<ToolResult<WooCommerceOperationsOutput>> {
  const timer = new PerformanceTimer();

  try {
    // Validate input
    const validatedInput = inputSchema.parse(input);

    // Validate context
    if (!context.domain) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required context: domain'
        },
        metadata: { executionTime: timer.elapsed() }
      };
    }

    // Normalize domain
    const normalizedDomain = normalizeDomain(context.domain);
    if (!normalizedDomain) {
      return {
        success: false,
        error: {
          code: 'INVALID_DOMAIN',
          message: `Invalid domain: ${context.domain}`
        },
        metadata: {
          executionTime: timer.elapsed(),
          source: 'invalid-domain'
        }
      };
    }

    // Get commerce provider
    const provider = await getCommerceProvider(normalizedDomain);
    if (!provider) {
      return {
        success: false,
        error: {
          code: 'NO_PROVIDER',
          message: `No commerce provider configured for domain: ${normalizedDomain}`
        },
        metadata: {
          executionTime: timer.elapsed(),
          source: 'no-provider'
        }
      };
    }

    // Execute operation based on type
    const result = await executeOperation(
      validatedInput,
      provider,
      normalizedDomain
    );

    return {
      success: true,
      data: result,
      metadata: {
        executionTime: timer.elapsed(),
        source: provider.platform || 'woocommerce'
      }
    };
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Validation failed: ${error.errors[0]?.message}`,
          details: error.errors
        },
        metadata: { executionTime: timer.elapsed() }
      };
    }

    // Operation error
    return {
      success: false,
      error: {
        code: 'WOOCOMMERCE_OPERATIONS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          originalError: error instanceof Error ? error.message : String(error)
        }
      },
      metadata: { executionTime: timer.elapsed() }
    };
  }
}

// ============================================================================
// OPERATION EXECUTOR
// ============================================================================

async function executeOperation(
  input: WooCommerceOperationsInput,
  provider: any,
  domain: string
): Promise<WooCommerceOperationsOutput> {
  // Delegate to provider's executeOperation method
  const result = await provider.executeOperation(input.operation, {
    ...input,
    domain
  });

  if (!result) {
    throw new Error('Invalid response from provider');
  }

  // Validate response has expected structure based on operation
  if (!result.success && !isErrorResponse(result)) {
    throw new Error('Malformed provider response');
  }

  return result;
}

function isErrorResponse(result: any): boolean {
  return result.error !== undefined;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  WooCommerceOperation,
  WooCommerceOperationsInput,
  WooCommerceOperationsOutput
};
```

### Step 2: Update index.ts

Update `/servers/commerce/index.ts` to export the new tool:

```typescript
/**
 * Commerce MCP Server Category
 *
 * Purpose: Export all commerce-related MCP tools
 * Category: commerce
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 */

export { lookupOrder, metadata as lookupOrderMetadata } from "./lookupOrder";
export type { LookupOrderInput, LookupOrderOutput } from "./lookupOrder";

export { getProductDetails, metadata as getProductDetailsMetadata } from "./getProductDetails";
export type { GetProductDetailsInput, GetProductDetailsOutput } from "./getProductDetails";

// NEW: Add woocommerceOperations
export { woocommerceOperations, metadata as woocommerceOperationsMetadata } from "./woocommerceOperations";
export type { WooCommerceOperationsInput, WooCommerceOperationsOutput } from "./woocommerceOperations";

export const categoryMetadata = {
  name: "commerce",
  description: "Order management, product operations, and e-commerce integrations for WooCommerce and Shopify",
  version: "1.0.0",
  tools: ["lookupOrder", "getProductDetails", "woocommerceOperations"]
};
```

---

## Running Tests

### Before Implementation
```bash
# Check test structure
npm test -- --testPathPattern="woocommerceOperations" --listTests

# Note: Tests will fail until implementation is complete
```

### After Implementation
```bash
# Run all woocommerceOperations tests
npm test -- --testPathPattern="woocommerceOperations"

# Expected output:
# PASS  servers/commerce/__tests__/woocommerceOperations.test.ts
# ✓ woocommerceOperations MCP Tool (65 tests)
# Tests: 65 passed, 65 total
# Time: ~2.5 seconds

# Run with coverage
npm run test:coverage -- --testPathPattern="woocommerceOperations"

# Run in watch mode
npm test -- --testPathPattern="woocommerceOperations" --watch
```

---

## Key Implementation Requirements

### 1. Input Validation
- ✅ Validate operation name (must be from enum)
- ✅ Validate required parameters based on operation
- ✅ Validate parameter types and ranges
- ✅ Trim string inputs

### 2. Context Validation
- ✅ Require domain in context
- ✅ Normalize domain (remove https://, www., etc.)
- ✅ Reject invalid domains (localhost, empty strings)

### 3. Provider Resolution
- ✅ Get commerce provider for domain
- ✅ Handle "no provider configured" case
- ✅ Use provider.executeOperation() method

### 4. Error Handling
- ✅ Catch validation errors (ZodError)
- ✅ Catch operation errors
- ✅ Wrap errors with context and metadata
- ✅ Return proper error codes

### 5. Performance Tracking
- ✅ Track execution time using PerformanceTimer
- ✅ Include executionTime in metadata
- ✅ Include source (platform) in metadata

### 6. Response Format
- ✅ Always return ToolResult envelope
- ✅ Include success boolean
- ✅ Include data on success, error on failure
- ✅ Include metadata (executionTime, source)

---

## Test Coverage Summary

The 65 tests cover:

```
Product Operations:      8 tests
Order Operations:        6 tests
Cart Operations:         4 tests
Store Config:            4 tests
Analytics:               3 tests
Metadata/Schema:         6 tests
Input Validation:       10 tests
Context Validation:      3 tests
Error Handling:          8 tests
Response Format:         4 tests
Performance:             2 tests
Edge Cases:              2 tests
Integration:             5 tests
────────────────────────────
TOTAL:                  65 tests
```

### How Tests Help

1. **Happy Path Coverage**: Tests verify each operation works correctly
2. **Error Handling**: Tests ensure errors are caught and wrapped properly
3. **Validation**: Tests confirm input/context validation works
4. **Integration**: Tests verify multi-operation workflows work
5. **Performance**: Tests catch performance regressions early
6. **Edge Cases**: Tests cover boundary conditions and special inputs

---

## Reference Implementations

Study these files for patterns and best practices:

1. **lookupOrder.ts** (~250 lines)
   - Single operation tool
   - Provider resolution pattern
   - Error handling and wrapping
   - Response formatting

2. **getProductDetails.ts** (~350 lines)
   - Multi-strategy tool
   - Fallback logic
   - Semantic search integration
   - Comprehensive error handling

---

## Checklist Before Submitting

- [ ] File created: `/servers/commerce/woocommerceOperations.ts`
- [ ] Exports all required: function, metadata, inputSchema, types
- [ ] Input validation using Zod schema
- [ ] Context validation (domain, normalization)
- [ ] Provider resolution with null checks
- [ ] Error handling for all failure cases
- [ ] Performance timing integrated
- [ ] ToolResult envelope returned consistently
- [ ] All 25+ operations implemented or delegated
- [ ] Updated `/servers/commerce/index.ts` with exports
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Tests passing: `npm test -- --testPathPattern="woocommerceOperations"`
- [ ] Coverage >90%: `npm run test:coverage`

---

## Common Pitfalls to Avoid

❌ **Don't**:
- Forget to export metadata
- Skip input validation
- Ignore error cases
- Return non-ToolResult format
- Forget to include executionTime
- Hardcode domain names or credentials
- Make tests dependent on external services
- Skip type definitions

✅ **Do**:
- Follow the ToolResult pattern strictly
- Validate all inputs upfront
- Handle errors gracefully
- Include proper metadata
- Track execution time
- Use dependency injection
- Mock external calls in tests
- Define clear types

---

## Support

For questions about the test suite:
- Review this guide first
- Check test file: `__tests__/woocommerceOperations.test.ts`
- Study reference implementations: lookupOrder.ts, getProductDetails.ts
- Review shared types: `servers/shared/types/`

---

**Happy implementing!**

Generated by: Claude Code - WooCommerce Testing Specialist
Date: 2025-11-05
