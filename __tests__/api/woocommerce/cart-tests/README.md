# WooCommerce Cart Test Suite

**Last Updated:** 2025-11-15
**Status:** ✅ Active
**LOC:** 4 files, ~35 LOC each

## Purpose
Tests for `/api/woocommerce/cart-test` endpoint covering both informational and transactional modes.

## Structure

```
cart-tests/
├── get-endpoint.test.ts         # GET endpoint status checks (40 LOC)
├── informational-mode.test.ts   # Store API disabled mode (28 LOC)
├── cart-actions.test.ts         # Add/update/remove/coupon (113 LOC)
└── validation-errors.test.ts    # Parameter validation & errors (99 LOC)
```

## Test Coverage

### GET Endpoint (get-endpoint.test.ts)
- Disabled status when Store API not enabled
- Enabled status when Store API is enabled

### Informational Mode (informational-mode.test.ts)
- Returns informational message when Store API disabled

### Cart Actions (cart-actions.test.ts)
- Add to cart
- Get cart
- Update quantity
- Remove item
- Apply coupon

### Validation & Errors (validation-errors.test.ts)
- Store API availability checks
- Client initialization failures
- Parameter validation
- Unknown action handling
- Store API errors
- Unexpected errors

## Running Tests

```bash
# All cart-test tests
npm test -- --testPathPattern="cart-test"

# Specific suite
npm test -- __tests__/api/woocommerce/cart-tests/cart-actions.test.ts
```

## Dependencies

- **Fixtures:** `__tests__/utils/woocommerce/cart-test-fixtures.ts`
- **Mocks:** Supabase, CartSessionManager, WooCommerceStoreAPI

## Notes

- Tests use orchestrator pattern (main file imports all suites)
- Shared mocks defined in orchestrator file
- Environment variable `WOOCOMMERCE_STORE_API_ENABLED` controls mode
