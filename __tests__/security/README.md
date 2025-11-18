# Security Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 3 minutes


**Purpose:** Tests security measures for cross-frame communication, authentication, data validation, and XSS prevention.

**Last Updated:** 2025-11-03
**Test Count:** 16 tests across 1 file
**Related:** [lib/chat-widget/](../../lib/chat-widget/), [lib/embed/](../../lib/embed/)

## Test Files

### postmessage-security.test.ts (16 tests)

Tests security measures for postMessage-based cross-frame communication between the chat widget iframe and parent window.

**Coverage:**
- ✅ Origin validation with environment variables
- ✅ Message handler security (data validation)
- ✅ postMessage target origin validation (no wildcards)
- ✅ Storage request security
- ✅ XSS attack prevention
- ✅ Security logging and monitoring

**Key Security Requirements:**
1. Only messages from trusted origins are processed
2. All postMessage calls use specific origins (never wildcards)
3. Untrusted origins are blocked with warning logs
4. Storage requests validate origin before responding
5. Malicious payloads are rejected

**Example:**
```typescript
// Security validation in message handler
const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
  console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
  return;
}
```

## Running Tests

```bash
# Run all security tests
npm test -- __tests__/security/

# Run specific test file
npm test -- __tests__/security/postmessage-security.test.ts

# Run with verbose output
npm test -- __tests__/security/ --verbose
```

## Security Principles Tested

### 1. Origin Validation
- Messages must come from `NEXT_PUBLIC_APP_URL` or `window.location.origin`
- Fallback to `window.location.origin` if env var not set
- All other origins are rejected

### 2. No Wildcard Origins
- All `postMessage()` calls use specific target origins
- Never use `'*'` wildcard in production code
- Prevents messages from being intercepted by malicious frames

### 3. Input Validation
- Messages must have a valid `type` property
- Data structure validation before processing
- Rejection of malformed messages

### 4. Storage Security
- Parent storage requests validate origin
- Responses only sent to trusted origins
- No storage access for untrusted frames

### 5. Logging and Monitoring
- All blocked messages logged with origin details
- Security events can be monitored
- No warnings for legitimate traffic

## Related Documentation

- [Chat Widget Documentation](../../components/ChatWidget/README.md)
- [Parent Storage Adapter Tests](../lib/chat-widget/parent-storage.test.ts)
- [Cross-Frame Communication Guide](../../docs/02-GUIDES/GUIDE_CROSS_FRAME_COMMUNICATION.md) (if exists)

## Common Security Scenarios

### XSS Prevention
```typescript
// ❌ VULNERABLE: Wildcard origin
window.parent.postMessage(data, '*');

// ✅ SECURE: Specific origin
const targetOrigin = config.serverUrl || window.location.origin;
window.parent.postMessage(data, targetOrigin);
```

### Origin Spoofing Prevention
```typescript
// ❌ VULNERABLE: No origin check
window.addEventListener('message', (event) => {
  processMessage(event.data);
});

// ✅ SECURE: Origin validation
window.addEventListener('message', (event) => {
  const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  if (event.origin !== expectedOrigin && event.origin !== window.location.origin) {
    console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
    return;
  }
  processMessage(event.data);
});
```

## Security Checklist

When adding new cross-frame communication features:

- [ ] Validate message origin on receive
- [ ] Use specific target origin on send
- [ ] Validate message data structure
- [ ] Add security tests for new message types
- [ ] Log blocked messages for monitoring
- [ ] Never use wildcard origins in production
- [ ] Test with malicious origins
- [ ] Document security assumptions

## Troubleshooting

**Messages being blocked incorrectly:**
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Verify `window.location.origin` matches expected domain
- Review console warnings for origin details

**Messages not being validated:**
- Ensure origin check happens before processing
- Verify event listener is registered
- Check for early returns in message handler

**Tests failing:**
- Mock `window.location.origin` correctly
- Set `process.env.NEXT_PUBLIC_APP_URL` in test setup
- Simulate MessageEvent with correct origin

## Performance Notes

- Origin validation has minimal performance impact (<1ms)
- No network requests for validation
- Message blocking happens before data processing
- Logging can be disabled in production if needed
