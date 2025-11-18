**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# WooCommerce Tests Directory

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 2 minutes


**Purpose:** Integration tests for WooCommerce API integration, product operations, order management, and chat integration.

**Test Type:** Integration

**Last Updated:** 2025-10-30

**Coverage:** WooCommerce REST API, Store API, product operations, stock management, payment methods, and chat-WooCommerce integration.

## Overview

Tests for comprehensive WooCommerce e-commerce platform integration, ensuring reliable product searches, inventory management, order tracking, and seamless chat widget integration with WooCommerce stores.

## Test Structure

```
__tests__/woocommerce/
├── test-all-woocommerce-operations.ts          # All operations suite
├── test-chat-woocommerce-integration.ts        # Chat integration
├── test-chat-woocommerce.ts                    # Chat-specific tests
├── test-payment-methods-fix.ts                 # Payment methods validation
├── test-stock-quantity-operation.ts            # Stock management
├── test-store-api-integration.ts               # Store API tests
├── test-woo-simple-curl.ts                     # Basic API connectivity
├── test-woocommerce-chat-integration.ts        # Chat workflow tests
├── test-woocommerce-direct.ts                  # Direct API tests
├── test-woocommerce-env-fallback.ts            # Environment fallback
├── test-woocommerce-integration-complete.ts    # Complete integration
├── test-woocommerce-operations-corrected.ts    # Operation validations
└── test-woocommerce-thompson.ts                # Customer-specific tests
```

## Running Tests

```bash
# Run all WooCommerce tests
npm test -- __tests__/woocommerce/

# Run chat integration tests
npm test -- test-chat-woocommerce-integration

# Run stock management tests
npm test -- test-stock-quantity-operation

# Run with real API (requires credentials)
WOOCOMMERCE_URL=https://example.com npm test -- __tests__/woocommerce/
```

## Key Test Areas

### Product Operations
- Product search by name, SKU, category
- Product details retrieval
- Inventory status checking
- Price and variant handling

### Stock Management
- Stock quantity updates
- Low stock detection
- Out-of-stock handling
- Stock synchronization

### Chat Integration
- Product queries via chat
- Order status inquiries
- Inventory questions
- Shopping assistance

### API Integration
- REST API v3 endpoints
- Store API integration
- Authentication handling
- Rate limiting compliance

## Related Code

- **WooCommerce API**: `/lib/woocommerce-api.ts`
- **Dynamic Loader**: `/lib/woocommerce-dynamic.ts`
- **Provider**: `/lib/agents/providers/woocommerce-provider.ts`
- **Chat Integration**: `/app/api/chat/route.ts`

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md)
- [Integration Tests](/Users/jamesguy/Omniops/__tests__/integration/README.md)
- [API Tests](/Users/jamesguy/Omniops/__tests__/api/README.md)
