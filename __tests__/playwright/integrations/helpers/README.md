# Playwright Test Helpers

**Purpose:** Shared utilities and setup functions for E2E integration tests.

**Last Updated:** 2025-11-15
**Related:** [../README.md](../README.md), [../../README.md](../../README.md)

## Overview

This directory contains reusable helper functions for setting up test environments, mocking APIs, and managing test configurations.

## Files

### `cart-test-helpers.ts` (120 LOC)
**Purpose:** Shared utilities for WooCommerce cart operation tests.

**Exports:**
- `CartConfig` - Type for test configuration
- `TEST_CONFIGS` - Array of test configurations for informational and transactional modes
- `setupCartAPIRoute(page, config)` - Mock WooCommerce cart API responses
- `setupChatAPIRoute(page, config)` - Mock chat API responses

**Usage:**
```typescript
import { TEST_CONFIGS, setupCartAPIRoute, setupChatAPIRoute } from './helpers/cart-test-helpers';

for (const config of TEST_CONFIGS) {
  test(`cart operations in ${config.name}`, async ({ page }) => {
    await setupCartAPIRoute(page, config);
    await setupChatAPIRoute(page, config);
    // Test logic...
  });
}
```

## Best Practices

1. **One helper file per feature** - Don't create a mega-helpers file
2. **Export typed configurations** - Use TypeScript interfaces
3. **Document all parameters** - Clear JSDoc for each function
4. **Consistent naming** - Use `setup*`, `mock*`, `verify*` prefixes

## Adding New Helpers

When creating new helper functions:
1. Group related functions in a single file
2. Export types and constants
3. Document usage with code examples
4. Keep functions pure (no side effects beyond setup)
5. Update this README

## Related Documentation

- [E2E Testing Philosophy](../../../../CLAUDE.md#e2e-tests-as-agent-training-data)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
