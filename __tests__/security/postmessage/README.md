**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# PostMessage Security Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 1 minute

**Purpose:** Modular test suite for postMessage cross-frame communication security.

This directory contains focused security tests for the chat widget's postMessage API, split into logical modules for maintainability and clarity.

## Test Modules

| Module | LOC | Purpose |
|--------|-----|---------|
| `origin-validation.test.ts` | 65 | Origin validation with env vars and fallbacks |
| `message-handler.test.ts` | 61 | Message handler validation (type, structure) |
| `postmessage-target.test.ts` | 74 | Target origin validation (no wildcards) |
| `storage-requests.test.ts` | 89 | Storage request origin validation |
| `edge-cases.test.ts` | 83 | Edge cases, XSS attempts, empty env vars |
| `logging.test.ts` | 52 | Security event logging and monitoring |

**Total:** 424 LOC (refactored from 534 LOC original = 20% reduction)

## Shared Helpers

All modules use reusable helpers from `__tests__/utils/security/postmessage-helpers.ts`:

- `VALID_ORIGIN` / `INVALID_ORIGIN` - Test origins
- `createMessageEvent()` - MessageEvent factory
- `createMockIframe()` / `createMockParent()` - Mock objects
- `mockWindowLocation()` - Window setup
- `createSecureMessageHandler()` - Reusable message validation
- `getTargetOrigin()` - Target origin logic

## Test Coverage

**17 tests total:**
- 3 origin validation tests
- 3 message handler tests
- 3 target origin tests
- 2 storage request tests
- 3 edge case tests
- 2 logging tests

All tests validate:
- ✅ Trusted origins accepted
- ✅ Untrusted origins blocked
- ✅ Origin validation with env vars and fallbacks
- ✅ No wildcard usage in postMessage
- ✅ Proper security logging
- ✅ XSS attack prevention
- ✅ Message structure validation
