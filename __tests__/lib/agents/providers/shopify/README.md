**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Complete - Original shopify-provider.test.ts (706 LOC) successfully split and deleted
**Type:** Reference

# Shopify Provider Tests

**Purpose:** Focused test modules for ShopifyProvider e-commerce integration, split by functional area for maintainability.

**Last Updated:** 2025-11-10
**Related:** [ShopifyProvider](../../../../../lib/agents/providers/shopify-provider.ts), [Test Helpers](/test-utils/shopify-test-helpers.ts)
**Status:** Complete - Original shopify-provider.test.ts (706 LOC) successfully split and deleted

## Test Modules

### order-lookup.test.ts (193 LOC)
Tests for order lookup functionality:
- Lookup by numeric ID
- Lookup by email (fallback)
- Lookup by order name (with # prefix)
- Error handling and edge cases
- OrderInfo format conversion

### product-search.test.ts (98 LOC)
Tests for product search:
- Search by query string
- Default and custom limits
- Large result sets
- Empty results and error handling

### stock-check.test.ts (141 LOC)
Tests for inventory stock checking:
- Stock lookup by product ID
- Stock lookup by SKU
- In-stock vs out-of-stock status
- Backorder handling
- Error cases

### product-details.test.ts (184 LOC)
Tests for product detail retrieval:
- Details by numeric ID
- Details by SKU (fallback)
- Multi-variant product matching
- Error handling

### integration.test.ts (128 LOC)
Integration and cross-functional tests:
- Provider initialization
- Multi-product searches
- Complex orders with multiple line items
- Concurrent operations without contamination

## Test Helpers

All tests use shared helpers from `/test-utils/shopify-test-helpers.ts`:
- `mockShopifyClient()` - Mock Shopify API client
- `createMockShopifyOrder()` - Order test fixtures
- `createMockShopifyProduct()` - Product test fixtures
- `createOrderNotFoundError()` - 404 error mocks
- `createShopifyAPIError()` - Generic API error mocks

## Running Tests

```bash
# Run all Shopify provider tests
npm test -- shopify/

# Run specific module
npm test -- order-lookup.test.ts
npm test -- product-search.test.ts
npm test -- stock-check.test.ts
npm test -- product-details.test.ts
npm test -- integration.test.ts

# Watch mode
npm test -- shopify/ --watch
```

## Coverage

**Total:** 744 lines of test code
**Original:** 706 LOC in single file (refactored for modularity)

All test files comply with <200 LOC guideline for maintainability.
