# AI-Friendly Refactoring Implementation Plan

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [GUIDE_AI_FRIENDLY_CODE_PATTERNS.md](../02-GUIDES/GUIDE_AI_FRIENDLY_CODE_PATTERNS.md)
**Estimated Execution Time:** 6-8 weeks

## Purpose

This document provides a concrete, phased implementation plan for refactoring the Omniops codebase to use AI-friendly patterns. The goal is to reduce AI token consumption by 85-95%, improve debugging speed by 5-10x, and make the codebase easier to navigate and maintain.

## Quick Links
- [Executive Summary](#executive-summary)
- [Phase 1: Quick Wins](#phase-1-quick-wins-week-1)
- [Phase 2: Core Refactoring](#phase-2-core-refactoring-weeks-2-3)
- [Phase 3: Module Reorganization](#phase-3-module-reorganization-weeks-4-6)
- [Success Metrics](#success-metrics)

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Baseline Metrics](#baseline-metrics)
- [Phase 1: Quick Wins](#phase-1-quick-wins-week-1)
- [Phase 2: Core Refactoring](#phase-2-core-refactoring-weeks-2-3)
- [Phase 3: Module Reorganization](#phase-3-module-reorganization-weeks-4-6)
- [Phase 4: Ongoing Maintenance](#phase-4-ongoing-maintenance)
- [Success Metrics](#success-metrics)
- [Risk Mitigation](#risk-mitigation)
- [Rollback Strategy](#rollback-strategy)

---

## Executive Summary

### Current State
- **Token Consumption:** ~3000 tokens average to understand a function
- **Debugging Speed:** 10-15 minutes to trace errors
- **Navigation Speed:** 10-15 minutes to find functions via grep
- **Type Coverage:** ~70% (estimated)
- **AI Accuracy:** 60% on first attempt

### Target State
- **Token Consumption:** ~100-300 tokens to understand a function (90-97% reduction)
- **Debugging Speed:** 1-2 minutes (5-10x faster)
- **Navigation Speed:** 5-30 seconds (100-200x faster)
- **Type Coverage:** 95%+
- **AI Accuracy:** 90-95%

### Investment
- **Total Effort:** 68-102 hours over 6-8 weeks
- **Risk:** Low (incremental changes, fully backward compatible)
- **ROI:** 500-1000% improvement in AI developer productivity

---

## Baseline Metrics

### Measurement Approach

Before starting refactoring, establish baseline measurements:

**1. Token Consumption Test**
```typescript
// scripts/measure-ai-comprehension.ts

/**
 * Measures how many tokens AI needs to understand key functions
 */
async function measureTokenConsumption() {
  const testCases = [
    'lib/woocommerce-dynamic.ts:getProducts',
    'lib/shopify-dynamic.ts:getClient',
    'lib/agents/product-search-agent.ts:searchProducts',
    'app/api/chat/route.ts:POST'
  ];

  for (const testCase of testCases) {
    const [file, functionName] = testCase.split(':');

    // Count files AI must read to understand this function
    const requiredFiles = await traceRequiredFiles(file, functionName);

    // Count total tokens across all files
    const totalTokens = await countTokens(requiredFiles);

    console.log(`${testCase}: ${requiredFiles.length} files, ${totalTokens} tokens`);
  }
}
```

**2. Debugging Speed Test**
```bash
# Manual test: Time how long it takes to:
# 1. Introduce a bug (wrong WooCommerce credentials)
# 2. Ask AI to debug
# 3. AI identifies root cause
# 4. AI suggests fix

# Record: Time to resolution, number of file reads, accuracy
```

**3. Navigation Speed Test**
```bash
# Manual test: Ask AI to find:
# - "Where are Shopify products fetched?"
# - "How is order validation performed?"
# - "What handles WooCommerce authentication errors?"

# Record: Time to find, number of grep attempts, files read
```

**Baseline Results (Estimated):**
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Token consumption | 2000-4000 | 100-300 | 85-97% |
| Debugging time | 10-15 min | 1-2 min | 5-10x |
| Navigation time | 10-15 min | 5-30 sec | 100-200x |
| Files to understand 1 function | 3-5 | 1 | 67-80% |
| Type coverage | 70% | 95% | 36% |

---

## Phase 1: Quick Wins (Week 1)

**Goal:** 60% improvement in debugging speed with minimal changes

### 1.1 Add Type Annotations to API Routes (4 hours)

**Files to update:**
- `app/api/chat/route.ts`
- `app/api/woocommerce/products/route.ts`
- `app/api/woocommerce/orders/route.ts`
- `app/api/shopify/products/route.ts`

**Changes:**
```typescript
// BEFORE
export async function POST(request: Request) {
  const body = await request.json();
  const result = await process(body);
  return Response.json(result);
}

// AFTER
interface ChatRequest {
  message: string;
  conversationId?: string;
  sessionId: string;
}

interface ChatResponse {
  response: string;
  conversationId: string;
  metadata?: MessageMetadata;
}

type ChatResult =
  | { success: true; data: ChatResponse }
  | { success: false; error: ChatError };

export async function POST(request: Request): Promise<Response> {
  const body: ChatRequest = await request.json();

  const result: ChatResult = await processChatMessage(body);

  if (!result.success) {
    return Response.json({ error: result.error.message }, { status: 400 });
  }

  return Response.json(result.data);
}
```

**Validation:**
- Run `npx tsc --noEmit` - must pass
- Run `npm test` - all tests pass
- Measure token consumption - should drop 40-50%

---

### 1.2 Document Error Types (3 hours)

**Create error type hierarchies:**

**File:** `lib/woocommerce/errors.ts`
```typescript
/**
 * Base error type for all WooCommerce-related errors
 */
export abstract class WooCommerceError extends Error {
  abstract readonly code: string;
  abstract readonly retryable: boolean;
  abstract readonly httpStatus: number;
}

/**
 * Authentication failed - invalid credentials
 * @retryable false - credentials must be updated
 */
export class WooCommerceAuthError extends WooCommerceError {
  code = 'WOOCOMMERCE_AUTH_ERROR';
  retryable = false;
  httpStatus = 401;

  constructor(message: string) {
    super(message);
    this.name = 'WooCommerceAuthError';
  }
}

/**
 * WooCommerce API returned 4xx/5xx error
 * @retryable true for 5xx, false for 4xx
 */
export class WooCommerceApiError extends WooCommerceError {
  code = 'WOOCOMMERCE_API_ERROR';
  httpStatus: number;
  retryable: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'WooCommerceApiError';
    this.httpStatus = status;
    this.retryable = status >= 500;
  }
}

/**
 * Network request failed (timeout, DNS, connection)
 * @retryable true - transient network issues
 */
export class WooCommerceNetworkError extends WooCommerceError {
  code = 'WOOCOMMERCE_NETWORK_ERROR';
  retryable = true;
  httpStatus = 503;

  constructor(message: string, public originalError: Error) {
    super(message);
    this.name = 'WooCommerceNetworkError';
  }
}
```

**Repeat for:**
- `lib/shopify/errors.ts`
- `lib/agents/errors.ts`

**Validation:**
- All errors inherit from base error
- Each error has clear documentation
- Retryable vs non-retryable explicit
- HTTP status codes documented

---

### 1.3 Add JSDoc to High-Impact Functions (5 hours)

**Target functions:**
- Functions >50 LOC
- Functions with side effects
- Public API boundaries
- Complex business logic

**Template:**
```typescript
/**
 * [One-line summary]
 *
 * [Optional: Extended description]
 *
 * @param paramName - Description
 * @returns Description
 * @throws ErrorType - When this occurs
 * @sideEffects What external state is modified
 * @performance Complexity or timing notes
 * @see Related documentation
 *
 * @example
 * const result = await functionName(param);
 */
```

**Files to document:**
```
lib/embeddings.ts
lib/agents/product-search-agent.ts
lib/woocommerce-dynamic.ts
lib/shopify-dynamic.ts
lib/search/hybrid-search.ts
```

**Validation:**
- Every exported function has JSDoc
- Side effects documented
- Error cases documented
- Performance characteristics noted

---

### 1.4 Create Result Type (2 hours)

**File:** `types/result.ts`
```typescript
/**
 * Result type for operations that can fail
 *
 * Replaces throwing exceptions with typed error returns,
 * making error handling explicit and type-safe.
 *
 * @example
 * async function fetchUser(id: string): Promise<Result<User, FetchError>> {
 *   try {
 *     const user = await db.users.find(id);
 *     return { success: true, data: user };
 *   } catch (error) {
 *     return { success: false, error: new FetchError(error.message) };
 *   }
 * }
 *
 * // Usage
 * const result = await fetchUser('123');
 * if (result.success) {
 *   console.log(result.data.name);
 * } else {
 *   console.error(result.error.message);
 * }
 */
export type Result<T, E extends Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Helper to create success result
 */
export function Ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Helper to create error result
 */
export function Err<E extends Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard for success
 */
export function isOk<T, E extends Error>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard for error
 */
export function isErr<T, E extends Error>(
  result: Result<T, E>
): result is { success: false; error: E } {
  return result.success === false;
}
```

**Validation:**
- Type checks pass
- Documented with examples
- Helper functions tested

---

### Phase 1 Summary

**Effort:** 14 hours
**Files Changed:** ~15 files
**Lines Added:** ~500 lines (mostly documentation and types)
**Risk:** Very low (additive changes, no behavior modification)

**Expected Impact:**
- Token consumption: 40-50% reduction
- Debugging speed: 2-3x faster
- Navigation: 30% faster
- Type safety: 10% improvement

**Validation Before Moving to Phase 2:**
- [ ] All tests pass
- [ ] TypeScript compilation clean
- [ ] Measure token consumption - confirm 40-50% reduction
- [ ] Test debugging speed - should be 2-3x faster
- [ ] Document findings

---

## Phase 2: Core Refactoring (Weeks 2-3)

**Goal:** 75% improvement in code comprehension

### 2.1 Refactor WooCommerce Integration (10 hours)

**Current Issues:**
- Hidden dependencies (`getDynamicClient`)
- Weak types (`any` returns)
- Generic error handling
- Mixed pure logic and side effects

**Target Files:**
- `lib/woocommerce-dynamic.ts` (refactor to `lib/woocommerce/client.ts`)
- `lib/woocommerce-full.ts` (refactor to `lib/woocommerce/full-client.ts`)
- Create `lib/woocommerce/types.ts`
- Create `lib/woocommerce/errors.ts` (done in Phase 1)

**Refactoring Steps:**

**Step 1: Create types** (2 hours)
```typescript
// lib/woocommerce/types.ts

export interface WooCommerceConfig {
  domain: string;
  consumerKey: string;
  consumerSecret: string;
  version: 'wc/v3';
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  categories: Array<{ id: number; name: string }>;
  images: Array<{ src: string; alt: string }>;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
}

export interface ProductFetchOptions {
  limit: number;
  offset: number;
  search?: string;
  category?: number;
}

export interface ProductPage {
  products: WooCommerceProduct[];
  total: number;
  hasMore: boolean;
}
```

**Step 2: Refactor client with dependency injection** (5 hours)
```typescript
// lib/woocommerce/client.ts

import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { WooCommerceConfig, ProductPage, ProductFetchOptions } from './types';
import { WooCommerceError, WooCommerceAuthError, WooCommerceApiError, WooCommerceNetworkError } from './errors';
import { Result } from '@/types/result';

/**
 * WooCommerce API client with typed methods and error handling
 *
 * All methods return Result types instead of throwing exceptions,
 * making error handling explicit and type-safe.
 */
export class WooCommerceClient {
  private api: WooCommerceRestApi;

  constructor(config: WooCommerceConfig) {
    this.api = new WooCommerceRestApi({
      url: `https://${config.domain}`,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      version: config.version
    });
  }

  /**
   * Fetch products with pagination
   *
   * @param options - Pagination and filter options
   * @returns Product page or typed error
   * @throws Never - all errors returned in Result type
   * @sideEffects Calls external WooCommerce API
   * @performance O(1) API call, ~200-500ms response time
   */
  async fetchProducts(
    options: ProductFetchOptions = { limit: 20, offset: 0 }
  ): Promise<Result<ProductPage, WooCommerceError>> {
    try {
      const response = await this.api.get('products', {
        per_page: options.limit,
        offset: options.offset,
        search: options.search,
        category: options.category
      });

      const products = response.data;
      const total = parseInt(response.headers['x-wp-total'] || '0', 10);

      return Ok({
        products,
        total,
        hasMore: products.length === options.limit
      });
    } catch (error: any) {
      return Err(this.handleError(error));
    }
  }

  /**
   * Fetch single product by ID
   *
   * @param productId - WooCommerce product ID
   * @returns Product or typed error
   */
  async fetchProduct(
    productId: number
  ): Promise<Result<WooCommerceProduct, WooCommerceError>> {
    try {
      const response = await this.api.get(`products/${productId}`);
      return Ok(response.data);
    } catch (error: any) {
      return Err(this.handleError(error));
    }
  }

  /**
   * Convert raw WooCommerce API errors to typed error hierarchy
   */
  private handleError(error: any): WooCommerceError {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return new WooCommerceAuthError('Invalid WooCommerce credentials');
    }

    if (error.response?.status >= 400 && error.response?.status < 500) {
      return new WooCommerceApiError(
        error.response?.data?.message || 'WooCommerce API error',
        error.response.status
      );
    }

    if (error.response?.status >= 500) {
      return new WooCommerceApiError(
        'WooCommerce server error',
        error.response.status
      );
    }

    return new WooCommerceNetworkError(
      error.message || 'Network request failed',
      error
    );
  }
}
```

**Step 3: Create factory function** (2 hours)
```typescript
// lib/woocommerce/client-factory.ts

import { createClient } from '@supabase/supabase-js';
import { WooCommerceClient } from './client';
import { WooCommerceConfig } from './types';
import { Result, Err, Ok } from '@/types/result';
import { WooCommerceAuthError } from './errors';

/**
 * Creates WooCommerce client from encrypted credentials in database
 *
 * @param domain - Customer domain
 * @returns Configured client or error if credentials not found/invalid
 */
export async function createWooCommerceClient(
  domain: string
): Promise<Result<WooCommerceClient, WooCommerceAuthError>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('woocommerce_credentials')
    .eq('domain', domain)
    .single();

  if (error || !config?.woocommerce_credentials) {
    return Err(
      new WooCommerceAuthError(`WooCommerce credentials not found for ${domain}`)
    );
  }

  const credentials = config.woocommerce_credentials;

  const wooConfig: WooCommerceConfig = {
    domain: credentials.store_url,
    consumerKey: credentials.consumer_key,
    consumerSecret: credentials.consumer_secret,
    version: 'wc/v3'
  };

  return Ok(new WooCommerceClient(wooConfig));
}
```

**Step 4: Update usage sites** (1 hour)
```typescript
// BEFORE
const products = await getProducts(domain, 20);

// AFTER
const clientResult = await createWooCommerceClient(domain);
if (!clientResult.success) {
  return { error: clientResult.error.message };
}

const productsResult = await clientResult.data.fetchProducts({ limit: 20 });
if (!productsResult.success) {
  return { error: productsResult.error.message };
}

const products = productsResult.data.products;
```

**Validation:**
- All tests pass
- Type coverage increased
- Error handling explicit
- No breaking changes to API routes

---

### 2.2 Refactor Shopify Integration (8 hours)

**Same pattern as WooCommerce:**
- Create `lib/shopify/types.ts`
- Create `lib/shopify/errors.ts`
- Refactor `lib/shopify-api.ts` → `lib/shopify/client.ts`
- Create `lib/shopify/client-factory.ts`
- Update usage sites

**Validation:**
- All tests pass
- Same error handling pattern as WooCommerce
- Type coverage >90%

---

### 2.3 Flatten Nested Control Flow (6 hours)

**Target functions with >3 levels of nesting:**

**Find candidates:**
```bash
# Use complexity analysis tool
npx ts-complexity lib/**/*.ts | grep "complexity: [1-9][0-9]"
```

**Refactor pattern:**
```typescript
// BEFORE: Deep nesting
function processOrder(user, order) {
  if (user) {
    if (user.permissions) {
      if (user.permissions.includes('admin')) {
        if (order) {
          if (order.status === 'pending') {
            return submitOrder(order);
          }
        }
      }
    }
  }
  return null;
}

// AFTER: Flat with guard clauses
function processOrder(
  user: User | null,
  order: Order | null
): Result<SubmittedOrder, ProcessingError> {
  if (!user?.permissions?.includes('admin')) {
    return Err(new UnauthorizedError('Admin permission required'));
  }

  if (!order) {
    return Err(new ValidationError('Order not found'));
  }

  if (order.status !== 'pending') {
    return Err(new ValidationError(`Order already ${order.status}`));
  }

  return submitOrder(order);
}
```

**Files to refactor:**
- `lib/agents/product-search-agent.ts`
- `app/api/chat/route.ts`
- `lib/search/hybrid-search.ts`

---

### 2.4 Separate Pure Functions (6 hours)

**Identify mixed logic/side effects:**

**Pattern:**
```typescript
// BEFORE: Mixed
async function calculateAndSaveTotal(order) {
  const total = order.items.reduce((sum, item) => sum + item.price, 0);
  const tax = total * 0.08;
  await db.orders.update(order.id, { total, tax });
  return { total, tax };
}

// AFTER: Separated
// Pure calculation - easy to test
function calculateOrderTotal(items: OrderItem[]): Money {
  return items.reduce((sum, item) => sum + item.price, 0);
}

function calculateTax(subtotal: Money, rate: number): Money {
  return subtotal * rate;
}

// Side effect wrapper
async function saveOrderTotals(
  orderId: OrderId,
  items: OrderItem[],
  taxRate: number,
  database: Database
): Promise<void> {
  const total = calculateOrderTotal(items);
  const tax = calculateTax(total, taxRate);

  await database.orders.update(orderId, { total, tax });
}
```

**Target files:**
- `lib/embeddings.ts` (separate calculation from storage)
- `lib/agents/*.ts` (separate search logic from API calls)
- `app/api/*/route.ts` (separate validation from persistence)

---

### Phase 2 Summary

**Effort:** 30 hours
**Files Changed:** ~30 files
**Lines Added/Modified:** ~2000 lines
**Risk:** Medium (behavior changes, needs thorough testing)

**Expected Impact:**
- Token consumption: 75% reduction (cumulative)
- Debugging speed: 5x faster
- Navigation: 60% faster
- Type coverage: 85%

**Validation Before Moving to Phase 3:**
- [ ] All tests pass (unit + integration + E2E)
- [ ] No regressions in API behavior
- [ ] Measure token consumption - confirm 75% reduction
- [ ] Test debugging - should be 5x faster
- [ ] Type coverage >85%

---

## Phase 3: Module Reorganization (Weeks 4-6)

**Goal:** 85% improvement in navigation speed

### 3.1 Co-locate WooCommerce Code (8 hours)

**BEFORE:**
```
lib/
  woocommerce-dynamic.ts
  woocommerce-full.ts
  woocommerce-cart-tracker.ts
types/
  woocommerce.ts
app/api/woocommerce/
  products/route.ts
  orders/route.ts
```

**AFTER:**
```
lib/woocommerce/
  index.ts              # Public exports
  client.ts             # Main API client
  full-client.ts        # Full sync client
  cart-tracker.ts       # Cart tracking
  types.ts              # All WooCommerce types
  errors.ts             # Error hierarchy
  transforms.ts         # Data transformations
  README.md             # Module documentation
  __tests__/
    client.test.ts
    cart-tracker.test.ts
```

**Migration steps:**
1. Create `lib/woocommerce/` directory
2. Move files and update imports
3. Create `index.ts` with public exports
4. Add module README
5. Update all import statements across codebase
6. Run tests

---

### 3.2 Co-locate Shopify Code (8 hours)

**Same pattern as WooCommerce:**
```
lib/shopify/
  index.ts
  client.ts
  types.ts
  errors.ts
  transforms.ts
  README.md
  __tests__/
```

---

### 3.3 Co-locate Agent Code (10 hours)

**BEFORE:**
```
lib/agents/
  product-search-agent.ts
  providers/
    woocommerce-provider.ts
    shopify-provider.ts
```

**AFTER:**
```
lib/agents/
  index.ts
  types.ts
  errors.ts
  README.md
  product-search/
    index.ts
    agent.ts
    types.ts
    README.md
  providers/
    index.ts
    woocommerce-provider.ts
    shopify-provider.ts
    base-provider.ts
    README.md
  __tests__/
```

---

### 3.4 Create Module READMEs (8 hours)

**Template for each module README:**
```markdown
# [Module Name]

**Purpose:** [What this module does in 1-2 sentences]

## Exports

- `[ExportName]` - [Description]
- `[ExportName]` - [Description]

## Usage

[Code example]

## Dependencies

- [Dependency 1] - [Why needed]
- [Dependency 2] - [Why needed]

## Error Handling

[List of error types and when they occur]

## Performance

[Complexity notes, caching strategy, etc.]

## Testing

[How to test this module]

## Related

- [Link to related module]
- [Link to documentation]
```

**Create READMEs for:**
- `lib/woocommerce/README.md`
- `lib/shopify/README.md`
- `lib/agents/README.md`
- `lib/search/README.md`
- `lib/embeddings/README.md`

---

### 3.5 Standardize Naming (6 hours)

**Audit all function names:**
```bash
# Find generic names
grep -r "function (data|result|temp|val|x|y|handler|processor|manager)" lib/
```

**Refactor to semantic names:**
- `data` → `validatedOrder`, `productList`, etc.
- `result` → `fetchResult`, `searchResults`, etc.
- `handler` → `handleOrderSubmission`, etc.
- `processor` → `processPayment`, etc.

**Validation:**
- No functions named `data`, `result`, `temp`, `handler`, `processor`
- All functions use verb prefixes
- All variables describe content

---

### Phase 3 Summary

**Effort:** 40 hours
**Files Moved/Renamed:** ~60 files
**Lines Added:** ~1000 lines (mostly documentation)
**Risk:** Medium (large refactor, but no behavior changes)

**Expected Impact:**
- Token consumption: 85% reduction (cumulative)
- Debugging speed: 8x faster
- Navigation: 85% faster (grep returns precise matches)
- Type coverage: 95%

**Validation:**
- [ ] All tests pass
- [ ] All imports updated
- [ ] Module boundaries clear
- [ ] READMEs complete
- [ ] Measure navigation speed - should be 100-200x faster

---

## Phase 4: Ongoing Maintenance

### 4.1 Pre-commit Hooks

**Add to `.husky/pre-commit`:**
```bash
#!/bin/sh

# Check for generic names
echo "Checking for generic function names..."
GENERIC_NAMES=$(grep -r "function (data|result|temp|val)\b" lib/ || true)
if [ -n "$GENERIC_NAMES" ]; then
  echo "❌ Generic function names found:"
  echo "$GENERIC_NAMES"
  echo "Please use semantic names (e.g., 'validatedOrder' not 'data')"
  exit 1
fi

# Check type coverage
echo "Checking TypeScript coverage..."
TYPE_COVERAGE=$(npx type-coverage --at-least 90 --detail || true)
if [ $? -ne 0 ]; then
  echo "❌ Type coverage below 90%"
  echo "$TYPE_COVERAGE"
  exit 1
fi

# Check for missing JSDoc on exports
echo "Checking JSDoc coverage..."
# TODO: Add script to check JSDoc on exported functions

echo "✅ Pre-commit checks passed"
```

---

### 4.2 Code Review Checklist

**Add to PR template:**
```markdown
## AI-Friendly Code Checklist

- [ ] All dependencies explicit (no hidden imports or globals)
- [ ] Strong types on all function signatures
- [ ] Result types used instead of throwing exceptions
- [ ] Control flow flat (<3 levels of nesting)
- [ ] Pure functions separated from side effects
- [ ] Semantic naming (verbs for functions, nouns for data)
- [ ] JSDoc on all exported functions
- [ ] Co-located with related code
- [ ] Module README updated (if applicable)
```

---

### 4.3 Monthly Audits

**Run monthly:**
```bash
# Type coverage
npx type-coverage --detail

# Complexity analysis
npx ts-complexity lib/**/*.ts

# Generic name audit
grep -r "function (data|result|temp)" lib/

# Documentation coverage
# TODO: Script to check JSDoc coverage
```

---

## Success Metrics

### Before vs After Comparison

| Metric | Baseline | Phase 1 | Phase 2 | Phase 3 | Improvement |
|--------|----------|---------|---------|---------|-------------|
| Token consumption | 3000 | 1500 | 750 | 300 | 90% ↓ |
| Debugging time | 12 min | 6 min | 2.5 min | 1.5 min | 8x ↑ |
| Navigation time | 15 min | 10 min | 6 min | 5 sec | 180x ↑ |
| Files to understand 1 function | 4 | 2 | 1.5 | 1 | 75% ↓ |
| Type coverage | 70% | 75% | 85% | 95% | 36% ↑ |
| AI accuracy | 60% | 70% | 85% | 95% | 58% ↑ |

---

## Risk Mitigation

### Potential Risks

**1. Breaking Changes**
- **Risk:** Refactoring breaks existing functionality
- **Mitigation:**
  - Comprehensive test coverage before starting
  - Run full test suite after each change
  - Deploy to staging first
  - Gradual rollout with feature flags

**2. Import Hell**
- **Risk:** Moving files creates import update nightmares
- **Mitigation:**
  - Use automated refactoring tools (VS Code, TypeScript Language Server)
  - Update one module at a time
  - Use barrel exports (`index.ts`) to minimize import changes

**3. Developer Confusion**
- **Risk:** Team doesn't understand new patterns
- **Mitigation:**
  - Share GUIDE_AI_FRIENDLY_CODE_PATTERNS.md before starting
  - Pair programming during refactoring
  - Code review checklist
  - Document examples in each module README

**4. Performance Regression**
- **Risk:** New patterns slower than old ones
- **Mitigation:**
  - Benchmark before/after
  - Pure functions often faster (easier to optimize)
  - Result types have zero runtime overhead (compile-time only)

---

## Rollback Strategy

**If Phase 1 doesn't show improvements:**
- Revert changes (minimal - mostly additive)
- Re-measure baseline
- Investigate why metrics didn't improve

**If Phase 2 causes issues:**
- Use git to revert to Phase 1 state
- Keep Phase 1 improvements (low risk, high value)
- Investigate specific issues before retrying Phase 2

**If Phase 3 causes import chaos:**
- Revert file moves
- Keep type/documentation improvements
- Plan smaller, more incremental file moves

---

## Conclusion

This phased approach reduces risk while maximizing value:

- **Phase 1 (Week 1):** Quick wins, 60% improvement, very low risk
- **Phase 2 (Weeks 2-3):** Core refactoring, 75% improvement, medium risk
- **Phase 3 (Weeks 4-6):** Module organization, 85% improvement, medium risk

**Total investment:** 84 hours over 6 weeks
**Expected ROI:** 500-1000% improvement in AI productivity

**Next steps:**
1. Get stakeholder approval
2. Establish baseline metrics
3. Start Phase 1
4. Measure results before proceeding to Phase 2

---

**Related Documentation:**
- [GUIDE_AI_FRIENDLY_CODE_PATTERNS.md](../02-GUIDES/GUIDE_AI_FRIENDLY_CODE_PATTERNS.md) - Pattern reference
- [CLAUDE.md](../../CLAUDE.md) - Project guidelines
- [Testing Philosophy](../09-REFERENCE/REFERENCE_TESTING_PHILOSOPHY.md) - Testing patterns
