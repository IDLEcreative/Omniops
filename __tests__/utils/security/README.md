**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Security Test Utilities

**Type:** Test Infrastructure
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 2 minutes

**Purpose:** Shared helper functions for security-related tests.

## Modules

### `postmessage-helpers.ts` (75 LOC)

Utilities for testing postMessage cross-frame communication security:

**Constants:**
- `VALID_ORIGIN` - Test origin for trusted messages
- `INVALID_ORIGIN` - Test origin for blocked messages

**Factories & Utilities:**
- `createMessageEvent(data, origin)` - Creates MessageEvent for testing
- `createMockIframe()` - Mock iframe with postMessage
- `createMockParent()` - Mock parent window with postMessage
- `mockWindowLocation(origin)` - Sets up window.location mock

**Security Helpers:**
- `createSecureMessageHandler(expectedOrigin, fallback, callback)` - Reusable origin-validated message handler
- `getTargetOrigin(configOrigin, fallback)` - Determines target origin for postMessage

## Usage

```typescript
import {
  VALID_ORIGIN,
  createMessageEvent,
  createSecureMessageHandler,
  mockWindowLocation,
} from '../../utils/security/postmessage-helpers';

describe('Security Tests', () => {
  beforeEach(() => {
    mockWindowLocation(VALID_ORIGIN);
  });

  it('should validate origins', () => {
    const handler = jest.fn();
    const messageHandler = createSecureMessageHandler(
      VALID_ORIGIN,
      window.location.origin,
      handler
    );

    window.addEventListener('message', messageHandler);
    window.dispatchEvent(createMessageEvent({ type: 'test' }, VALID_ORIGIN));

    expect(handler).toHaveBeenCalled();
  });
});
```

## Benefits

- **DRY**: Eliminates code duplication across security tests
- **Type-Safe**: Proper TypeScript types throughout
- **Testable**: Easy to create consistent test scenarios
- **Maintainable**: Changes to security logic in one place
- **Reusable**: Supports all security test modules
