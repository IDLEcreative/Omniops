# WooCommerce Tools Complete Connection & Integration Plan

**Date:** 2025-10-29
**Status:** 🚧 **IN PROGRESS**
**Goal:** Fully integrate all 25 WooCommerce operations into the chat system with complete observability

---

## 🎯 Executive Summary

We have **25 WooCommerce operations** implemented across 5 phases. The operations are technically "connected" to the AI system, but we need to ensure end-to-end integration, testing, monitoring, and optimization.

### Current State Analysis

**✅ What's Connected:**
- All 25 operations defined in `WOOCOMMERCE_TOOL` enum
- All operations have router cases in `woocommerce-tool.ts`
- Tool is registered in `tool-definitions.ts` SEARCH_TOOLS array
- AI can theoretically call any operation via OpenAI function calling

**❓ What Needs Verification:**
- End-to-end testing of all 25 operations in live chat
- Error handling across all tools
- Performance monitoring and optimization
- Usage analytics and tracking
- Documentation for developers and users
- UI/UX integration considerations

---

## 📊 Current Tool Inventory

### All 25 WooCommerce Operations

| # | Operation | Category | Phase | Status |
|---|-----------|----------|-------|--------|
| 1 | `check_stock` | Product | Original | ✅ Working |
| 2 | `get_stock_quantity` | Product | Original | ✅ Working |
| 3 | `get_product_details` | Product | Original | ✅ Working |
| 4 | `check_order` | Order | Original | ✅ Working |
| 5 | `get_shipping_info` | Order | Original | ✅ Working |
| 6 | `check_price` | Product | Original | ✅ Working |
| 7 | `get_product_categories` | Product | Phase 1 | ✅ Working |
| 8 | `get_product_reviews` | Product | Phase 1 | ✅ Working |
| 9 | `validate_coupon` | Store | Phase 1 | ✅ Working |
| 10 | `check_refund_status` | Order | Phase 2 | ✅ Working |
| 11 | `get_customer_orders` | Order | Phase 2 | ✅ Working |
| 12 | `get_order_notes` | Order | Phase 2 | ✅ Working |
| 13 | `get_product_variations` | Product | Phase 3 | ✅ Working |
| 14 | `get_shipping_methods` | Store | Phase 3 | ✅ Working |
| 15 | `get_payment_methods` | Store | Phase 3 | ✅ Working |
| 16 | `get_customer_insights` | Analytics | Phase 4 | ✅ Fixed & Tested |
| 17 | `get_low_stock_products` | Analytics | Phase 4 | ✅ Fixed & Tested |
| 18 | `get_sales_report` | Analytics | Phase 4 | ✅ Tested |
| 19 | `search_products` | Product | Phase 5 | ✅ Fixed & Tested |
| 20 | `cancel_order` | Order | Phase 5 | ✅ Tested |
| 21 | `add_to_cart` | Cart | Phase 5 | ✅ Tested |
| 22 | `get_cart` | Cart | Phase 5 | ✅ Tested |
| 23 | `remove_from_cart` | Cart | Phase 5 | ✅ Tested |
| 24 | `update_cart_quantity` | Cart | Phase 5 | ✅ Tested |
| 25 | `apply_coupon_to_cart` | Cart | Phase 5 | ✅ Tested |

**Summary:** 25/25 operations implemented and tested ✅

---

## 🔧 Phase 1: Complete Integration Verification (HIGH PRIORITY)

**Goal:** Verify every operation works end-to-end in the actual chat system

### Step 1.1: Create Comprehensive Chat Integration Tests

**Objective:** Test all 25 operations via the chat API to ensure AI can invoke them correctly

**Implementation:**
```typescript
// Create: test-all-woocommerce-chat-integration.ts

import { POST as chatAPI } from './app/api/chat/route';

const testCases = [
  // Product Operations (10 tools)
  {
    category: "Product Operations",
    tests: [
      {
        name: "check_stock",
        message: "Do you have the A4VTG90 pump in stock?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "check_stock"
      },
      {
        name: "search_products",
        message: "Show me all hydraulic pumps under £500",
        expectedTool: "woocommerce_operations",
        expectedOperation: "search_products"
      },
      {
        name: "get_product_details",
        message: "Tell me more about the A4VTG90 specifications",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_product_details"
      },
      {
        name: "get_product_categories",
        message: "What categories of products do you sell?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_product_categories"
      },
      {
        name: "get_product_reviews",
        message: "What do customers say about the A4VTG90?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_product_reviews"
      },
      {
        name: "get_product_variations",
        message: "Does this pump come in different voltages?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_product_variations"
      },
      {
        name: "check_price",
        message: "How much is the A4VTG90?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "check_price"
      },
      {
        name: "get_stock_quantity",
        message: "Exactly how many A4VTG90 pumps do you have?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_stock_quantity"
      }
    ]
  },

  // Order Operations (6 tools)
  {
    category: "Order Operations",
    tests: [
      {
        name: "check_order",
        message: "What's the status of my order #12345?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "check_order"
      },
      {
        name: "get_shipping_info",
        message: "When will my order #12345 arrive?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_shipping_info"
      },
      {
        name: "get_customer_orders",
        message: "Show me all my orders",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_customer_orders"
      },
      {
        name: "check_refund_status",
        message: "Where's my refund for order #12345?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "check_refund_status"
      },
      {
        name: "get_order_notes",
        message: "Are there any updates on my order #12345?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_order_notes"
      },
      {
        name: "cancel_order",
        message: "I need to cancel order #12345",
        expectedTool: "woocommerce_operations",
        expectedOperation: "cancel_order"
      }
    ]
  },

  // Cart Operations (5 tools)
  {
    category: "Cart Operations",
    tests: [
      {
        name: "add_to_cart",
        message: "Add 2 of the A4VTG90 pump to my cart",
        expectedTool: "woocommerce_operations",
        expectedOperation: "add_to_cart"
      },
      {
        name: "get_cart",
        message: "Show me what's in my cart",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_cart"
      },
      {
        name: "remove_from_cart",
        message: "Remove the pump from my cart",
        expectedTool: "woocommerce_operations",
        expectedOperation: "remove_from_cart"
      },
      {
        name: "update_cart_quantity",
        message: "Change the pump quantity to 5",
        expectedTool: "woocommerce_operations",
        expectedOperation: "update_cart_quantity"
      },
      {
        name: "apply_coupon_to_cart",
        message: "Apply coupon SAVE20 to my cart",
        expectedTool: "woocommerce_operations",
        expectedOperation: "apply_coupon_to_cart"
      }
    ]
  },

  // Store Configuration (3 tools)
  {
    category: "Store Configuration",
    tests: [
      {
        name: "validate_coupon",
        message: "Does the coupon SAVE20 work?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "validate_coupon"
      },
      {
        name: "get_shipping_methods",
        message: "What shipping options do you have?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_shipping_methods"
      },
      {
        name: "get_payment_methods",
        message: "How can I pay for my order?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_payment_methods"
      }
    ]
  },

  // Analytics (3 tools - admin only)
  {
    category: "Analytics (Admin)",
    tests: [
      {
        name: "get_low_stock_products",
        message: "Which products are running low on stock?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_low_stock_products"
      },
      {
        name: "get_sales_report",
        message: "Show me this week's sales",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_sales_report"
      },
      {
        name: "get_customer_insights",
        message: "Who are our top 10 customers?",
        expectedTool: "woocommerce_operations",
        expectedOperation: "get_customer_insights"
      }
    ]
  }
];

async function runIntegrationTests() {
  console.log('🧪 Testing All 25 WooCommerce Operations\n');

  let passed = 0;
  let failed = 0;

  for (const category of testCases) {
    console.log(`\n📦 ${category.category}`);
    console.log('='.repeat(60));

    for (const test of category.tests) {
      try {
        console.log(`\nTesting: ${test.name}`);
        console.log(`Message: "${test.message}"`);

        // Call chat API
        const response = await chatAPI({
          json: async () => ({
            message: test.message,
            domain: 'thompsonseparts.co.uk'
          })
        });

        // Parse response and check if correct tool was called
        const data = await response.json();

        if (data.success && data.toolCalls?.some(
          (call: any) => call.tool === test.expectedTool &&
                        call.operation === test.expectedOperation
        )) {
          console.log(`✅ PASS - AI called ${test.expectedOperation}`);
          passed++;
        } else {
          console.log(`❌ FAIL - AI did not call expected operation`);
          console.log(`   Expected: ${test.expectedOperation}`);
          console.log(`   Got: ${JSON.stringify(data.toolCalls)}`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        failed++;
      }
    }
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`📊 RESULTS: ${passed}/25 passed, ${failed}/25 failed`);
  console.log(`✅ Success Rate: ${((passed/25) * 100).toFixed(1)}%`);
}
```

**Timeline:** 4-6 hours
**Priority:** HIGH
**Deliverable:** Test suite that validates AI correctly invokes all 25 operations

---

### Step 1.2: Tool Handler Integration Check

**Objective:** Verify all operations flow correctly through the tool execution pipeline

**Files to Check:**
1. `lib/chat/ai-processor-tool-executor.ts` - Tool execution logic
2. `lib/chat/tool-handlers.ts` - Handler for WooCommerce tools
3. `lib/chat/woocommerce-tool.ts` - Router dispatch

**Verification Script:**
```bash
# Check all operations have handlers
npx tsx scripts/verify-woocommerce-handlers.ts
```

**Implementation:**
```typescript
// Create: scripts/verify-woocommerce-handlers.ts

import { WOOCOMMERCE_TOOL } from '../lib/chat/woocommerce-types';

// Extract all operations from enum
const definedOperations = WOOCOMMERCE_TOOL.function.parameters.properties.operation.enum;

console.log(`📋 Defined Operations: ${definedOperations.length}`);

// TODO: Read woocommerce-tool.ts and verify each operation has a case statement
// TODO: Check tool-handlers.ts has WooCommerce handler registered
// TODO: Verify no operations are missing from router

// Expected output:
// ✅ All 25 operations have router cases
// ✅ WooCommerce handler registered in tool-handlers.ts
// ✅ No orphaned operations
```

**Timeline:** 2 hours
**Priority:** HIGH

---

### Step 1.3: Error Handling Audit

**Objective:** Ensure all 25 operations handle errors gracefully

**Checklist:**
- [ ] All operations return `WooCommerceOperationResult` with success/failure
- [ ] Error messages are helpful and actionable
- [ ] Network errors handled (timeout, 401, 404, 500)
- [ ] Validation errors caught before API calls
- [ ] Graceful degradation when WooCommerce is unavailable

**Test Matrix:**
```
For EACH of 25 operations:
  ✅ Test with valid parameters
  ❌ Test with missing required parameters
  ❌ Test with invalid product/order IDs
  ❌ Test with network timeout
  ❌ Test with 401 unauthorized
  ❌ Test with 500 server error
```

**Timeline:** 6-8 hours
**Priority:** MEDIUM

---

## 🎯 Phase 2: AI Prompt Optimization (MEDIUM PRIORITY)

**Goal:** Optimize system prompts to help AI choose the right tool

### Step 2.1: Review System Prompts

**Current File:** `lib/chat/system-prompts.ts`

**Audit Questions:**
1. Does the prompt explain when to use WooCommerce operations?
2. Are examples provided for each operation category?
3. Is there guidance on multi-step operations (search → get details → add to cart)?
4. Are edge cases mentioned (out of stock, invalid orders)?

**Enhancements Needed:**

```markdown
## WooCommerce Operations Guide

### Product Discovery Flow
1. **Broad Search**: Use `search_products` for general queries
   - "Do you have hydraulic pumps?"
   - "Show me products under £500"

2. **Detailed Info**: Use `get_product_details` after search
   - "Tell me more about the A4VTG90"
   - "What are the specifications?"

3. **Stock Check**: Use `check_stock` for availability
   - "Is this in stock?"
   - "When will it be available?"

### Order Management Flow
1. **Lookup**: Use `check_order` for status
2. **Details**: Use `get_shipping_info` for tracking
3. **Issues**: Use `check_refund_status` or `cancel_order` for problems

### Cart Flow
1. **Search** → `search_products`
2. **Add** → `add_to_cart`
3. **Review** → `get_cart`
4. **Checkout** → Guide to checkout page
```

**Timeline:** 3-4 hours
**Priority:** MEDIUM

---

### Step 2.2: Tool Description Enhancement

**Current Location:** `lib/chat/woocommerce-types/tool-definition.ts`

**Review Each Operation Description:**
```typescript
// BEFORE (generic):
"get_stock_quantity": "Get stock quantity"

// AFTER (specific with examples):
"get_stock_quantity": "Get EXACT stock quantity for a product. Use when customer asks 'exactly how many', 'what's your inventory', or needs precise numbers. Example: 'Exactly how many A4VTG90 pumps do you have?' Returns specific number like '15 units available'."
```

**Apply to all 25 operations**

**Timeline:** 4-5 hours
**Priority:** MEDIUM

---

## 📊 Phase 3: Observability & Monitoring (HIGH PRIORITY)

**Goal:** Track usage, performance, and errors for all WooCommerce operations

### Step 3.1: Usage Analytics

**Implementation:**
```typescript
// Add to lib/chat/woocommerce-tool.ts

interface WooCommerceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  errorType?: string;
  timestamp: Date;
  domain: string;
}

async function trackWooCommerceUsage(metrics: WooCommerceMetrics) {
  // Store in Supabase for analytics
  await supabase.from('woocommerce_usage_metrics').insert(metrics);
}

// Wrap executeWooCommerceOperation
const originalExecute = executeWooCommerceOperation;
export async function executeWooCommerceOperation(
  operation: string,
  params: WooCommerceOperationParams,
  domain: string
): Promise<WooCommerceOperationResult> {
  const start = Date.now();

  try {
    const result = await originalExecute(operation, params, domain);

    await trackWooCommerceUsage({
      operation,
      duration: Date.now() - start,
      success: result.success,
      timestamp: new Date(),
      domain
    });

    return result;
  } catch (error) {
    await trackWooCommerceUsage({
      operation,
      duration: Date.now() - start,
      success: false,
      errorType: error.constructor.name,
      timestamp: new Date(),
      domain
    });

    throw error;
  }
}
```

**Timeline:** 3-4 hours
**Priority:** HIGH

---

### Step 3.2: Real-Time Dashboard

**Create:** `app/dashboard/woocommerce/page.tsx`

**Dashboard Metrics:**
```
📊 WooCommerce Operations Dashboard

┌─────────────────────────────────────────────┐
│ Today's Usage                               │
├─────────────────────────────────────────────┤
│ Total Calls: 1,247                          │
│ Success Rate: 94.2%                         │
│ Avg Response Time: 1.8s                     │
│ Errors: 72 (5.8%)                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Top 10 Operations (by usage)                │
├─────────────────────────────────────────────┤
│ 1. search_products       342 calls (27.4%)  │
│ 2. check_order           198 calls (15.9%)  │
│ 3. check_stock           156 calls (12.5%)  │
│ 4. get_product_details   134 calls (10.7%)  │
│ 5. add_to_cart            89 calls (7.1%)   │
│ ...                                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Performance (P50 / P95 / P99)               │
├─────────────────────────────────────────────┤
│ search_products      1.2s / 2.8s / 4.5s     │
│ check_order          0.8s / 1.9s / 3.2s     │
│ get_sales_report     5.1s / 7.2s / 9.8s     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Error Distribution                          │
├─────────────────────────────────────────────┤
│ 404 Not Found        42 errors (58.3%)      │
│ 400 Bad Request      18 errors (25.0%)      │
│ 500 Server Error     12 errors (16.7%)      │
└─────────────────────────────────────────────┘
```

**Timeline:** 8-10 hours
**Priority:** MEDIUM

---

### Step 3.3: Alerting System

**Implementation:**
```typescript
// Create: lib/monitoring/woocommerce/alerts.ts

interface AlertThresholds {
  errorRate: number;  // Alert if >10% errors
  responseTime: number;  // Alert if P95 >5s
  availability: number;  // Alert if <95% success
}

async function checkWooCommerceHealth() {
  const metrics = await getRecentMetrics(15); // Last 15 minutes

  const errorRate = metrics.errors / metrics.total;
  const p95ResponseTime = calculateP95(metrics.responseTimes);
  const availability = metrics.successes / metrics.total;

  if (errorRate > 0.10) {
    await sendAlert({
      level: 'HIGH',
      message: `WooCommerce error rate: ${(errorRate * 100).toFixed(1)}%`,
      operations: getMostFailingOperations(metrics)
    });
  }

  if (p95ResponseTime > 5000) {
    await sendAlert({
      level: 'MEDIUM',
      message: `WooCommerce P95 response time: ${p95ResponseTime}ms`,
      operations: getSlowestOperations(metrics)
    });
  }
}

// Run every 5 minutes
setInterval(checkWooCommerceHealth, 5 * 60 * 1000);
```

**Timeline:** 4-5 hours
**Priority:** MEDIUM

---

## 🚀 Phase 4: Performance Optimization (MEDIUM PRIORITY)

**Goal:** Optimize slow operations and implement caching

### Step 4.1: Performance Baseline

**Measure Current Performance:**
```bash
npx tsx scripts/benchmark-woocommerce-operations.ts
```

**Target Metrics:**
- **Fast Operations** (<1s): check_stock, get_cart, validate_coupon
- **Medium Operations** (1-3s): search_products, check_order, get_product_details
- **Slow Operations** (3-5s): get_sales_report, get_customer_insights
- **Acceptable** (<5s P95): All operations

**Timeline:** 2-3 hours
**Priority:** MEDIUM

---

### Step 4.2: Caching Strategy

**Implement Redis Caching:**
```typescript
// Create: lib/cache/woocommerce-cache.ts

interface CacheConfig {
  ttl: number;  // Time to live in seconds
  strategy: 'stale-while-revalidate' | 'cache-first' | 'network-first';
}

const CACHE_CONFIG: Record<string, CacheConfig> = {
  // Product data changes infrequently
  get_product_details: { ttl: 3600, strategy: 'stale-while-revalidate' },
  get_product_categories: { ttl: 7200, strategy: 'cache-first' },
  get_product_reviews: { ttl: 1800, strategy: 'cache-first' },
  get_payment_methods: { ttl: 86400, strategy: 'cache-first' },
  get_shipping_methods: { ttl: 86400, strategy: 'cache-first' },

  // Stock data changes frequently
  check_stock: { ttl: 300, strategy: 'stale-while-revalidate' },
  get_stock_quantity: { ttl: 300, strategy: 'network-first' },

  // Order data is real-time
  check_order: { ttl: 60, strategy: 'network-first' },
  get_customer_orders: { ttl: 300, strategy: 'stale-while-revalidate' },

  // Analytics can be slightly stale
  get_sales_report: { ttl: 1800, strategy: 'stale-while-revalidate' },
  get_customer_insights: { ttl: 3600, strategy: 'cache-first' },

  // Never cache
  cancel_order: { ttl: 0, strategy: 'network-first' },
  add_to_cart: { ttl: 0, strategy: 'network-first' }
};

async function cachedWooCommerceOperation(
  operation: string,
  params: WooCommerceOperationParams,
  domain: string
) {
  const cacheKey = `woo:${domain}:${operation}:${JSON.stringify(params)}`;
  const config = CACHE_CONFIG[operation];

  if (!config || config.ttl === 0) {
    return executeWooCommerceOperation(operation, params, domain);
  }

  const cached = await redis.get(cacheKey);

  if (config.strategy === 'cache-first' && cached) {
    return JSON.parse(cached);
  }

  if (config.strategy === 'stale-while-revalidate' && cached) {
    // Return stale data immediately
    setTimeout(() => {
      // Revalidate in background
      executeWooCommerceOperation(operation, params, domain)
        .then(fresh => redis.setex(cacheKey, config.ttl, JSON.stringify(fresh)));
    }, 0);
    return JSON.parse(cached);
  }

  // Network-first or cache miss
  const result = await executeWooCommerceOperation(operation, params, domain);
  await redis.setex(cacheKey, config.ttl, JSON.stringify(result));
  return result;
}
```

**Expected Impact:**
- 60-80% reduction in API calls to WooCommerce
- 2-3x faster response for cached operations
- Reduced load on Thompson's WooCommerce server

**Timeline:** 6-8 hours
**Priority:** MEDIUM

---

### Step 4.3: Request Batching

**Optimize Multi-Tool Calls:**
```typescript
// When AI calls multiple WooCommerce operations in parallel,
// batch them into a single WooCommerce API request where possible

// BEFORE:
await Promise.all([
  wc.getProduct(123),
  wc.getProduct(124),
  wc.getProduct(125)
]);
// 3 API calls

// AFTER:
await wc.getProducts({ include: [123, 124, 125] });
// 1 API call
```

**Timeline:** 4-5 hours
**Priority:** LOW

---

## 📖 Phase 5: Documentation & Developer Experience (HIGH PRIORITY)

**Goal:** Make it easy for developers to add new WooCommerce operations

### Step 5.1: Comprehensive API Documentation

**Create:** `docs/WOOCOMMERCE_API_GUIDE.md`

**Contents:**
```markdown
# WooCommerce Operations API Guide

## Quick Start

### Adding a New Operation

1. **Define Operation** in `lib/chat/woocommerce-types/tool-definition.ts`
2. **Implement Function** in appropriate operations file
3. **Register Router Case** in `lib/chat/woocommerce-tool.ts`
4. **Add Tests** in `test-phase4-5-tools.ts`
5. **Update Documentation** (this file)

### Example: Adding `get_product_bundles`

#### Step 1: Define Operation
```typescript
// In tool-definition.ts enum:
enum: [..., "get_product_bundles"]

// Add parameter:
bundleId: {
  type: "string",
  description: "Bundle ID to retrieve"
}
```

#### Step 2: Implement Function
```typescript
// In lib/chat/product-operations.ts:
export async function getProductBundles(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  // Implementation
}
```

#### Step 3: Register Router
```typescript
// In woocommerce-tool.ts:
case "get_product_bundles":
  return await getProductBundles(wc, params);
```

#### Step 4: Add Tests
```typescript
// In test-phase4-5-tools.ts:
results.push(await testTool(
  'get_product_bundles',
  'get_product_bundles',
  { bundleId: '123' }
));
```

## All 25 Operations Reference

### Product Operations (10 tools)
...detailed docs for each...

### Order Operations (6 tools)
...detailed docs for each...

### Cart Operations (5 tools)
...detailed docs for each...

### Store Configuration (3 tools)
...detailed docs for each...

### Analytics (3 tools - Admin Only)
...detailed docs for each...
```

**Timeline:** 8-10 hours
**Priority:** HIGH

---

### Step 5.2: Interactive Playground

**Create:** `app/playground/woocommerce/page.tsx`

**Features:**
- Dropdown to select operation
- Form with operation-specific parameters
- Execute button
- Real-time response display
- Copy-as-code button

**Example UI:**
```
┌─────────────────────────────────────────────────┐
│ WooCommerce Operations Playground               │
├─────────────────────────────────────────────────┤
│ Operation: [search_products ▼]                  │
│                                                 │
│ Parameters:                                     │
│   query: [hydraulic pump]                       │
│   minPrice: [0]                                 │
│   maxPrice: [500]                               │
│   limit: [20]                                   │
│                                                 │
│ [Execute Operation]                             │
│                                                 │
│ Response:                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ {                                           │ │
│ │   "success": true,                          │ │
│ │   "data": {                                 │ │
│ │     "products": [...]                       │ │
│ │   },                                        │ │
│ │   "message": "🔍 Search Results..."         │ │
│ │ }                                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Copy Response] [Copy as Code]                  │
└─────────────────────────────────────────────────┘
```

**Timeline:** 10-12 hours
**Priority:** MEDIUM

---

## 🎨 Phase 6: UI/UX Integration (LOW PRIORITY)

**Goal:** Enhance chat UI to highlight WooCommerce capabilities

### Step 6.1: Quick Action Buttons

**Add to Chat Widget:**
```typescript
// In app/embed/page.tsx

<div className="quick-actions">
  <button onClick={() => sendMessage("Search products")}>
    🔍 Search Products
  </button>
  <button onClick={() => sendMessage("Track my order")}>
    📦 Track Order
  </button>
  <button onClick={() => sendMessage("View cart")}>
    🛒 View Cart
  </button>
  <button onClick={() => sendMessage("Check stock")}>
    ✅ Check Stock
  </button>
</div>
```

**Timeline:** 4-5 hours
**Priority:** LOW

---

### Step 6.2: Rich Response Cards

**Enhance message rendering for WooCommerce responses:**

**Product Card:**
```
┌─────────────────────────────────────────┐
│ A4VTG90 Hydraulic Pump                  │
├─────────────────────────────────────────┤
│ [Product Image]                         │
│                                         │
│ Price: £1,245.00                        │
│ Stock: ✅ In Stock (5 available)        │
│ Rating: ⭐⭐⭐⭐⭐ (12 reviews)            │
│                                         │
│ [View Details] [Add to Cart]            │
└─────────────────────────────────────────┘
```

**Order Card:**
```
┌─────────────────────────────────────────┐
│ Order #12345                            │
├─────────────────────────────────────────┤
│ Status: 🚚 Shipped                      │
│ Tracking: RF123456789GB                 │
│ Expected: Oct 30, 2025                  │
│                                         │
│ Items: 2 items                          │
│ Total: £2,490.00                        │
│                                         │
│ [Track Package] [Contact Support]       │
└─────────────────────────────────────────┘
```

**Timeline:** 12-15 hours
**Priority:** LOW

---

## 🔒 Phase 7: Security & Compliance (HIGH PRIORITY)

**Goal:** Ensure all operations are secure and compliant

### Step 7.1: Authentication & Authorization

**Verify:**
- [ ] All admin operations (analytics) require authentication
- [ ] Customer operations verify ownership (my orders, my cart)
- [ ] Sensitive data (emails, addresses) properly masked in logs
- [ ] WooCommerce credentials securely stored and rotated

**Implementation:**
```typescript
// Add to woocommerce-tool.ts

const ADMIN_OPERATIONS = [
  'get_low_stock_products',
  'get_sales_report',
  'get_customer_insights'
];

const CUSTOMER_OPERATIONS = [
  'get_customer_orders',
  'cancel_order',
  'get_cart',
  'add_to_cart'
];

async function checkAuthorization(
  operation: string,
  userId: string,
  domain: string
): Promise<boolean> {
  if (ADMIN_OPERATIONS.includes(operation)) {
    return await isAdmin(userId, domain);
  }

  if (CUSTOMER_OPERATIONS.includes(operation)) {
    return await isAuthenticated(userId);
  }

  return true; // Public operations
}
```

**Timeline:** 6-8 hours
**Priority:** HIGH

---

### Step 7.2: Rate Limiting

**Prevent Abuse:**
```typescript
// Per user, per domain, per operation limits

const RATE_LIMITS = {
  // Customer operations
  search_products: { requests: 100, window: '1m' },
  check_order: { requests: 50, window: '1m' },
  cancel_order: { requests: 5, window: '1h' },

  // Admin operations
  get_sales_report: { requests: 10, window: '1h' },
  get_customer_insights: { requests: 10, window: '1h' }
};

async function checkRateLimit(
  operation: string,
  userId: string,
  domain: string
): Promise<boolean> {
  const key = `ratelimit:${domain}:${userId}:${operation}`;
  const limit = RATE_LIMITS[operation];

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, parseWindow(limit.window));
  }

  return current <= limit.requests;
}
```

**Timeline:** 4-5 hours
**Priority:** HIGH

---

### Step 7.3: Data Privacy

**GDPR/CCPA Compliance:**
- [ ] Customer data access logs
- [ ] Data retention policies
- [ ] Right to erasure implementation
- [ ] Data export capabilities

**Timeline:** 6-8 hours
**Priority:** HIGH

---

## 📅 Implementation Timeline

### Immediate (Week 1)
1. ✅ Phase 1.1: Chat Integration Tests (6 hours)
2. ✅ Phase 1.2: Handler Verification (2 hours)
3. ✅ Phase 3.1: Usage Analytics (4 hours)
4. ✅ Phase 7.1: Authorization (8 hours)

**Total: 20 hours**

### Short-Term (Week 2-3)
1. Phase 1.3: Error Handling Audit (8 hours)
2. Phase 2.1: System Prompt Optimization (4 hours)
3. Phase 5.1: API Documentation (10 hours)
4. Phase 7.2: Rate Limiting (5 hours)

**Total: 27 hours**

### Medium-Term (Month 2)
1. Phase 2.2: Tool Description Enhancement (5 hours)
2. Phase 3.2: Real-Time Dashboard (10 hours)
3. Phase 4.1-4.2: Performance + Caching (15 hours)
4. Phase 7.3: Data Privacy (8 hours)

**Total: 38 hours**

### Long-Term (Month 3+)
1. Phase 3.3: Alerting System (5 hours)
2. Phase 5.2: Interactive Playground (12 hours)
3. Phase 6.1-6.2: UI/UX Enhancements (20 hours)

**Total: 37 hours**

---

## 🎯 Success Metrics

### Technical Metrics
- ✅ All 25 operations callable via chat (100% coverage)
- ✅ Error rate < 5%
- ✅ P95 response time < 5s
- ✅ Cache hit rate > 60%
- ✅ API call reduction > 70%

### Business Metrics
- 📈 Customer self-service rate (orders, returns)
- 📈 Conversion rate (search → add to cart → checkout)
- 📉 Support ticket volume reduction
- 📊 Tool usage distribution (which tools are most valuable)

### Quality Metrics
- ✅ Test coverage > 90%
- ✅ Documentation completeness
- ✅ Zero security vulnerabilities
- ✅ GDPR/CCPA compliant

---

## 🚀 Quick Wins (Can Do Immediately)

1. **Run Full Integration Test** (2 hours)
   ```bash
   npx tsx test-all-woocommerce-chat-integration.ts
   ```

2. **Add Usage Tracking** (2 hours)
   - Add Supabase table for metrics
   - Wrap executeWooCommerceOperation with tracking

3. **Document All 25 Operations** (4 hours)
   - Create table with descriptions
   - Add code examples
   - Document common patterns

4. **Create Health Check Endpoint** (2 hours)
   ```typescript
   // GET /api/woocommerce/health
   {
     "status": "healthy",
     "operations": 25,
     "uptime": "99.8%",
     "avgResponseTime": "1.8s"
   }
   ```

---

## ✅ Sign-Off Checklist

Before marking "Connected" as complete:

### Functionality
- [ ] All 25 operations tested via chat API
- [ ] All operations handle errors gracefully
- [ ] All operations return consistent response format
- [ ] Multi-operation flows work (search → details → add to cart)

### Performance
- [ ] P95 response time measured for all operations
- [ ] Slow operations identified and optimized
- [ ] Caching implemented for appropriate operations
- [ ] Load testing passed (100 concurrent users)

### Observability
- [ ] Usage metrics tracked in database
- [ ] Dashboard shows real-time operation stats
- [ ] Alerts configured for high error rates
- [ ] Logs capture all WooCommerce interactions

### Security
- [ ] Admin operations require authentication
- [ ] Customer operations verify ownership
- [ ] Rate limiting prevents abuse
- [ ] Data privacy requirements met

### Documentation
- [ ] API guide complete for all 25 operations
- [ ] Developer guide for adding new operations
- [ ] Troubleshooting guide created
- [ ] User-facing help documentation

### Quality
- [ ] Test coverage > 90%
- [ ] Zero critical bugs
- [ ] Performance benchmarks met
- [ ] Security audit passed

---

**Report Generated:** 2025-10-29
**Total Estimated Effort:** 122 hours (3 weeks at 40h/week)
**Priority Distribution:** 58h HIGH, 45h MEDIUM, 19h LOW

**🎯 Recommended Approach:** Start with Quick Wins + Week 1 priorities to establish foundation, then iterate based on usage data and user feedback.
