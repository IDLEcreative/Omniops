**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Cross-Frame Test Utilities

Reusable mock and helper utilities for cross-frame communication tests.

## Usage

```typescript
import {
  setupWindowMocks,
  teardownWindowMocks,
  mockPostMessage,
  createStorageResponseMessage,
  getLastPostMessageCall,
} from '@/__tests__/utils/cross-frame';

describe('My Test', () => {
  let messageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    messageHandler = setupWindowMocks();
  });

  afterEach(() => {
    teardownWindowMocks();
  });

  it('should work', () => {
    // Use messageHandler to simulate parent messages
    messageHandler(createStorageResponseMessage(...));
  });
});
```

## Modules

### `mocks.ts`

Provides reusable Jest mocks and mock implementations:

- `mockPostMessage`: Jest mock for window.parent.postMessage
- `mockAddEventListener`: Jest mock for addEventListener
- `mockRemoveEventListener`: Jest mock for removeEventListener
- `createStorageMock()`: Factory for localStorage/sessionStorage mocks
- `setupWindowMocks()`: Complete iframe environment setup
- `teardownWindowMocks()`: Cleanup after tests

### `helpers.ts`

Common test helper functions:

- `getLastPostMessageCall()`: Get most recent postMessage call data
- `findPostMessageByType(type)`: Find postMessage by message type
- `getLastRequestId()`: Extract requestId from last postMessage
- `createStorageResponseMessage(...)`: Create storage response MessageEvent
- `createPongMessage(pingTime)`: Create pong response MessageEvent
- `waitForAsync(ms)`: Helper for async operations in fake timer context

## Setup Pattern

All cross-frame tests follow this pattern:

```typescript
beforeEach(() => {
  messageHandler = setupWindowMocks();
  // messageHandler is ready to simulate parent messages
});

afterEach(() => {
  teardownWindowMocks();
  // Timers reset, all mocks cleared
});
```

This eliminates ~200 lines of duplicate setup code per test file.

## Benefits

- **DRY**: Single source of truth for mock setup
- **Consistency**: All tests use identical window/storage mocks
- **Maintainability**: Changes to mocks automatically affect all tests
- **Readability**: Setup code is hidden, test intent is clear
