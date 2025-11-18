**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Chat Widget Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 5 minutes

**Purpose:** Tests for chat widget core functionality including cross-frame communication, storage persistence, and iframe integration.

**Test Count:** 25 tests across 1 file
**Related:** [lib/chat-widget/](../../../lib/chat-widget/), [components/ChatWidget/](../../../components/ChatWidget/)

## Test Files

### parent-storage.test.ts (25 tests)

Tests the `ParentStorageAdapter` class which enables the chat widget to store conversation data in the parent window's localStorage instead of the iframe's. This ensures data persistence across page navigation.

**Coverage:**
- ✅ Non-iframe context (direct localStorage access)
- ✅ Iframe context (postMessage-based storage)
- ✅ Async getItem() with request/response matching
- ✅ Timeout handling (500ms timeout)
- ✅ Synchronous fallback (getItemSync)
- ✅ Error handling and graceful degradation
- ✅ Edge cases (concurrent requests, special characters)

**Test Scenarios:**

#### Non-iframe Context (7 tests)
When `window.self === window.top`, the adapter uses regular localStorage directly:
```typescript
// Regular localStorage operations
await adapter.getItem('key');        // → localStorage.getItem('key')
adapter.setItem('key', 'value');     // → localStorage.setItem('key', 'value')
adapter.removeItem('key');           // → localStorage.removeItem('key')
```

#### Iframe Context (11 tests)
When `window.self !== window.top`, the adapter uses postMessage to communicate with parent:
```typescript
// Cross-frame storage via postMessage
await adapter.getItem('key');        // → postMessage to parent → wait for response
adapter.setItem('key', 'value');     // → postMessage to parent
adapter.removeItem('key');           // → postMessage to parent
```

**Key Features Tested:**

1. **Request/Response Matching**
   - Unique requestIds for each getItem() call
   - Concurrent requests handled correctly
   - Unknown requestIds ignored
   - Cleanup of pending requests after response

2. **Timeout Handling**
   - 500ms timeout for getItem() requests
   - Returns null on timeout
   - Cleans up pending requests

3. **Error Handling**
   - localStorage errors caught and logged
   - Returns null on errors
   - Graceful degradation

4. **Edge Cases**
   - Empty string values
   - Special characters in keys/values
   - Rapid consecutive operations
   - Null values from parent

## Running Tests

```bash
# Run all chat-widget tests
npm test -- __tests__/lib/chat-widget/

# Run specific test file
npm test -- __tests__/lib/chat-widget/parent-storage.test.ts

# Run with verbose output and coverage
npm test -- __tests__/lib/chat-widget/ --verbose --coverage
```

## Architecture Overview

### ParentStorageAdapter

The adapter provides a unified storage API that works in both iframe and non-iframe contexts:

```typescript
class ParentStorageAdapter {
  // Async storage (supports cross-frame)
  async getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): void
  removeItem(key: string): void

  // Sync fallback (iframe uses local storage)
  getItemSync(key: string): string | null
}
```

### Cross-Frame Communication Flow

```
┌─────────────────────────────────────────────────────────┐
│ Parent Window (Customer's Website)                      │
│                                                          │
│  localStorage                                            │
│  ├─ chat_widget_session_id                             │
│  ├─ chat_widget_conversation_id                        │
│  └─ chat_widget_widget_open                            │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │ Message Handler (lib/embed/dom.ts)          │        │
│  │                                              │        │
│  │  • Receives: getFromParentStorage           │        │
│  │  • Reads: localStorage.getItem()            │        │
│  │  • Sends: storageResponse                   │        │
│  │                                              │        │
│  │  • Receives: saveToParentStorage            │        │
│  │  • Writes: localStorage.setItem()           │        │
│  │                                              │        │
│  │  • Receives: removeFromParentStorage        │        │
│  │  • Deletes: localStorage.removeItem()       │        │
│  └────────────────────────────────────────────┘        │
│                       ↕                                  │
│              postMessage (origin validated)              │
│                       ↕                                  │
│  ┌────────────────────────────────────────────┐        │
│  │ <iframe> Chat Widget                        │        │
│  │                                              │        │
│  │  ParentStorageAdapter                        │        │
│  │  ├─ Sends: getFromParentStorage             │        │
│  │  │  • Includes: requestId, key              │        │
│  │  │  • Waits: 500ms timeout                  │        │
│  │  │  • Receives: storageResponse             │        │
│  │  │                                           │        │
│  │  ├─ Sends: saveToParentStorage              │        │
│  │  │  • Includes: key, value                  │        │
│  │  │  • Fire-and-forget                       │        │
│  │  │                                           │        │
│  │  └─ Sends: removeFromParentStorage          │        │
│  │     • Includes: key                          │        │
│  │     • Fire-and-forget                        │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

## Usage Example

```typescript
import { parentStorage } from '@/lib/chat-widget/parent-storage';

// In React component or hook
const loadConversation = async () => {
  const sessionId = await parentStorage.getItem('session_id');
  const conversationId = await parentStorage.getItem('conversation_id');

  if (sessionId && conversationId) {
    // Restore conversation from API
    await loadMessages(conversationId);
  }
};

const saveConversation = (conversationId: string) => {
  parentStorage.setItem('conversation_id', conversationId);
};

const clearConversation = () => {
  parentStorage.removeItem('conversation_id');
};
```

## Security Considerations

The ParentStorageAdapter is designed with security in mind:

1. **Origin Validation**
   - All postMessage calls use specific target origins
   - Never uses wildcard `'*'` origin
   - See [Security Tests](../../security/README.md)

2. **Request ID Isolation**
   - Each request has unique ID: `request_${counter}_${timestamp}`
   - Responses matched by requestId
   - Unknown requestIds ignored

3. **Timeout Protection**
   - 500ms timeout prevents hanging requests
   - Cleans up pending requests on timeout
   - Returns null on timeout (fail-safe)

## Performance Notes

- **Non-iframe context:** Direct localStorage access (< 1ms)
- **Iframe context:** postMessage roundtrip (~10-50ms)
- **Timeout:** 500ms maximum wait time
- **Concurrent requests:** Fully supported, no queue needed

## Common Use Cases

### Session Persistence
```typescript
// Save session on creation
parentStorage.setItem('session_id', newSessionId);

// Restore session on widget mount
const sessionId = await parentStorage.getItem('session_id');
```

### Conversation Continuity
```typescript
// Save conversation ID after first message
parentStorage.setItem('conversation_id', conversationId);

// Load previous messages when widget reopens
const conversationId = await parentStorage.getItem('conversation_id');
if (conversationId) {
  await loadPreviousMessages(conversationId);
}
```

### Widget State Persistence
```typescript
// Save open/close state
parentStorage.setItem('widget_open', isOpen.toString());

// Restore state on page navigation
const wasOpen = await parentStorage.getItem('widget_open');
if (wasOpen === 'true') {
  setIsOpen(true);
}
```

## Troubleshooting

**Issue:** getItem() returns null unexpectedly
- **Check:** Is the iframe receiving storageResponse messages?
- **Debug:** Enable `ChatWidgetDebug` flag and check console logs
- **Verify:** Origin validation is passing in parent window

**Issue:** setItem() not persisting data
- **Check:** Is postMessage reaching parent window?
- **Debug:** Check network tab for postMessage errors
- **Verify:** Parent window message handler is registered

**Issue:** Timeout errors (getItem() returns null after 500ms)
- **Check:** Parent window is responding to getFromParentStorage
- **Debug:** Look for origin validation warnings in console
- **Verify:** NEXT_PUBLIC_APP_URL matches actual domain

## Related Tests

- [postMessage Security Tests](../../security/postmessage-security.test.ts) - Tests origin validation and XSS prevention
- [useChatState Hook Tests](../../components/ChatWidget/hooks/) - Tests integration with React components
- [DOM Handler Tests](../../lib/embed/) - Tests parent window message handling

## Test Patterns

### Testing Non-iframe Context
```typescript
beforeEach(() => {
  // Simulate non-iframe context
  Object.defineProperty(window, 'self', { value: window, writable: true });
  Object.defineProperty(window, 'top', { value: window, writable: true });

  adapter = new ParentStorageAdapter();
});
```

### Testing Iframe Context
```typescript
beforeEach(() => {
  // Simulate iframe context
  const mockTop = { ...window };
  Object.defineProperty(window, 'self', { value: window, writable: true });
  Object.defineProperty(window, 'top', { value: mockTop, writable: true });

  adapter = new ParentStorageAdapter();
});
```

### Simulating Parent Responses
```typescript
// Send request
const promise = adapter.getItem('test-key');

// Simulate parent response
setTimeout(() => {
  const call = mockParentPostMessage.mock.calls[0][0];
  window.dispatchEvent(new MessageEvent('message', {
    data: {
      type: 'storageResponse',
      requestId: call.requestId,
      value: 'test-value',
    },
  }));
}, 10);

const result = await promise;
expect(result).toBe('test-value');
```
