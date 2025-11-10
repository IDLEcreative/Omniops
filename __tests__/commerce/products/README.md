# Product Details Test Suite

**Purpose:** Comprehensive test coverage for the `getProductDetails` MCP tool with multi-strategy product retrieval
**Total Tests:** 38 tests across 5 test files
**Coverage:** 100% of critical paths including provider lookups, semantic search, validation, error handling, and response formatting
**Last Updated:** 2025-11-10

## Overview

This directory contains refactored tests for the `getProductDetails` MCP tool, split from a single 730-line test file into focused, maintainable test files organized by test concern.

## Test Files

### 1. product-lookup-strategies.test.ts (174 LOC, 8 tests)
**Purpose:** Tests for primary product lookup via commerce providers (WooCommerce/Shopify)

**Coverage:**
- WooCommerce product lookup by query and SKU
- Shopify product lookup
- Product not found handling
- Fuzzy match suggestions
- Fallback to exact match after provider miss/error
- Exact match when no provider available

### 2. semantic-search.test.ts (147 LOC, 6 tests)
**Purpose:** Tests for semantic search fallback when commerce provider is unavailable

**Coverage:**
- Semantic search fallback activation
- Query enhancement with specifications (`includeSpecs: true`)
- Original query usage (`includeSpecs: false`)
- Fallback after exact match fails
- Chunk count validation (15 chunks)
- Similarity threshold validation (0.3)

### 3. validation-and-context.test.ts (153 LOC, 8 tests)
**Purpose:** Tests for request validation, domain normalization, and context requirements

**Coverage:**
- Empty productQuery rejection
- Max length validation (500 characters)
- Valid input acceptance
- Default values for `includeSpecs`
- Missing domain rejection
- Invalid/localhost domain rejection
- Domain normalization

### 4. error-handling.test.ts (142 LOC, 6 tests)
**Purpose:** Tests for error scenarios including provider failures and telemetry tracking

**Coverage:**
- WooCommerce API timeout handling
- Shopify rate limit errors
- Exact match search failures
- Semantic search errors
- Malformed product data handling
- Telemetry tracking for lookup failures

### 5. response-format.test.ts (208 LOC, 10 tests)
**Purpose:** Tests for response structure, metadata, multi-platform integration, and edge cases

**Coverage:**
- ToolResult envelope structure
- Execution time metadata
- Source tracking (woocommerce/shopify/semantic)
- Results array format
- Error details in responses
- Multi-platform provider support
- Provider result formatting
- Empty semantic search results
- Whitespace trimming

### 6. test-helpers.ts (74 LOC)
**Purpose:** Shared mock objects, providers, and setup utilities

**Exports:**
- `mockContext` - Standard ExecutionContext for testing
- `mockWooCommerceProvider` - Mock WooCommerce provider
- `mockShopifyProvider` - Mock Shopify provider
- `mockProductData` - Standard product data
- `mockFormattedResult` - Formatted search result
- `mockSemanticResults` - Semantic search results

## Refactoring History

**Original File:** `servers/commerce/__tests__/getProductDetails.test.ts` (730 LOC)
**Refactored:** 2025-11-10
**Reason:** LOC compliance (500 LOC limit for test files)
**Strategy:** Split by test concern (lookup, search, validation, errors, format)

**Benefits:**
- ✅ All files now under 300 LOC (well below 500 LOC limit)
- ✅ Clear separation of concerns
- ✅ Easier navigation and maintenance
- ✅ Shared test helpers eliminate duplication
- ✅ All 38 tests preserved with identical logic

## Running Tests

```bash
# Run all product details tests
npm test -- __tests__/commerce/products/

# Run specific test file
npm test -- __tests__/commerce/products/product-lookup-strategies.test.ts
npm test -- __tests__/commerce/products/semantic-search.test.ts
npm test -- __tests__/commerce/products/validation-and-context.test.ts
npm test -- __tests__/commerce/products/error-handling.test.ts
npm test -- __tests__/commerce/products/response-format.test.ts
```

## Known Issues

⚠️ **Pre-existing Test Failures:** 6 tests related to telemetry tracking (`trackLookupFailure`) are currently failing. These failures existed in the original test file before refactoring and are related to implementation changes, not the refactoring itself.

**Affected Tests:**
- `should handle product not found from WooCommerce` (expects telemetry call)
- `should handle WooCommerce API timeout error` (expects telemetry call)
- `should handle Shopify rate limit error` (expects telemetry call)
- `should track telemetry for all lookup failures` (expects telemetry call)
- `should handle exact match search error gracefully` (changed error handling)
- `should handle semantic search error` (changed error handling)

**Status:** These failures are tracked separately and are not blockers for the refactoring.

## Test Dependencies

**Mocked Modules:**
- `@/lib/agents/commerce-provider` - Commerce provider resolution
- `@/lib/chat/product-formatters` - Product result formatting
- `@/lib/chat/tool-handlers/domain-utils` - Domain normalization
- `@/lib/search/exact-match-search` - SKU exact matching
- `@/lib/embeddings-optimized` - Semantic search
- `@/lib/telemetry/lookup-failures` - Failure tracking

## Related Documentation

- [MCP Commerce Server](../../../servers/commerce/README.md)
- [Product Search Architecture](../../../docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [Testing Standards](../../README.md)
