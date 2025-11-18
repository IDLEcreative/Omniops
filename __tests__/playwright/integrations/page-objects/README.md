**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Playwright Page Objects

**Purpose:** Reusable page object models for E2E test interactions.

**Last Updated:** 2025-11-15
**Related:** [../README.md](../README.md), [../../README.md](../../README.md)

## Overview

This directory contains page object models following the [Page Object Pattern](https://playwright.dev/docs/pom) to encapsulate UI interactions and make tests more maintainable.

## Files

### `cart-widget.ts` (48 LOC)
**Purpose:** Page object for chat widget interactions in cart operation tests.

**Methods:**
- `sendMessage(message: string)` - Send a message via the chat widget
- `getLastMessage()` - Get the most recent chat message
- `getAllMessages()` - Get all chat messages

**Usage:**
```typescript
const iframe = page.frameLocator('iframe#chat-widget-iframe');
const widget = new CartWidgetPage(page, iframe);

await widget.sendMessage('Add item to cart');
const response = await widget.getLastMessage();
```

## Best Practices

1. **Keep page objects focused** - One page object per logical UI component
2. **Return primitive values** - Page objects should return strings, booleans, not Locators
3. **No assertions in page objects** - Assertions belong in tests, not page objects
4. **Descriptive method names** - `sendMessage()` not `send()`

## Adding New Page Objects

When creating a new page object:
1. Extend the pattern used in `cart-widget.ts`
2. Keep methods small and focused
3. Document all public methods
4. Add usage examples
5. Update this README

## Related Documentation

- [Playwright Page Objects Guide](https://playwright.dev/docs/pom)
- [E2E Test Standards](../../../../docs/02-GUIDES/GUIDE_E2E_TESTING.md)
