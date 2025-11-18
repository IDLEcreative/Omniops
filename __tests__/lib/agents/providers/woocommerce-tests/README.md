# WooCommerceProvider Test Suite

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 2 minutes

**LOC:** 3 files, ~100 LOC each

## Purpose
Tests for `WooCommerceProvider` class covering order lookup, product search, and stock checking.

## Structure

```
woocommerce-tests/
├── order-lookup.test.ts        # Order lookup by ID/email/tracking (109 LOC)
├── product-search.test.ts      # Product search queries (74 LOC)
└── stock-details.test.ts       # Stock checking & product details (145 LOC)
```

## Test Coverage

### Order Lookup (order-lookup.test.ts)
- Lookup by numeric ID
- Search by email if ID fails
- Search by non-numeric order ID
- Return null if not found
- Handle errors gracefully
- Include tracking number if available

### Product Search (product-search.test.ts)
- Search products by query
- Default limit of 10
- Respect custom limits
- Handle errors gracefully
- Only search published products

### Stock & Details (stock-details.test.ts)
- Retrieve stock by SKU
- Return null if not found
- Get product details by SKU
- Fallback to name search
- Return null if all searches fail
- Prioritize SKU match over name match

## Running Tests

```bash
# All WooCommerceProvider tests
npm test -- --testPathPattern="woocommerce-provider"

# Specific suite
npm test -- __tests__/lib/agents/providers/woocommerce-tests/order-lookup.test.ts
```

## Dependencies

- **Provider:** `lib/agents/providers/woocommerce-provider`
- **API Type:** `lib/woocommerce-api`
- **Mocks:** WooCommerceAPI client

## Notes

- Tests use dependency injection pattern
- Mock WooCommerceAPI client injected via constructor
- Tests verify provider interface, not WooCommerce API implementation
- All tests follow AAA pattern (Arrange, Act, Assert)
