/**
 * Helper functions for ParentStorageAdapter tests
 *
 * Purpose: Shared utilities for setting up mocks, simulating iframe context,
 * and handling message event dispatching
 *
 * Used by: All parent-storage test modules in __tests__/lib/chat-widget/parent-storage/
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Jest is available globally in test files, no import needed

/**
 * Setup mock localStorage that can be configured per test
 */
export function createMockLocalStorage(): Storage {
  return {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0,
  };
}

/**
 * Install mock localStorage into window
 */
export function installMockLocalStorage(mockStorage: Storage): void {
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}

/**
 * Setup non-iframe context (window.self === window.top)
 */
export function setupNonIframeContext(): void {
  Object.defineProperty(window, 'self', {
    value: window,
    writable: true,
  });
  Object.defineProperty(window, 'top', {
    value: window,
    writable: true,
  });
}

/**
 * Setup iframe context (window.self !== window.top)
 */
export function setupIframeContext(mockParentPostMessage: jest.Mock): void {
  const mockTop = { ...window };
  Object.defineProperty(window, 'self', {
    value: window,
    writable: true,
  });
  Object.defineProperty(window, 'top', {
    value: mockTop,
    writable: true,
  });
  Object.defineProperty(window, 'parent', {
    value: { postMessage: mockParentPostMessage },
    writable: true,
  });
}

/**
 * Extract the requestId from the first postMessage call
 */
export function getFirstRequestId(mockParentPostMessage: jest.Mock): string {
  const callArgs = mockParentPostMessage.mock.calls[0];
  return callArgs[0].requestId;
}

/**
 * Dispatch a storage response message event
 */
export function dispatchStorageResponse(
  requestId: string,
  value: string | null
): void {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        type: 'storageResponse',
        requestId,
        value,
      },
    })
  );
}

/**
 * Dispatch multiple storage responses with async timing
 */
export function dispatchStorageResponseAsync(
  requestId: string,
  value: string | null,
  delayMs: number = 10
): void {
  setTimeout(() => {
    dispatchStorageResponse(requestId, value);
  }, delayMs);
}

/**
 * Create a non-storage message event (for filter testing)
 */
export function dispatchNonStorageMessage(): void {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        type: 'otherMessage',
        requestId: 'test',
        value: 'data',
      },
    })
  );
}

/**
 * Create a storage response without requestId (for validation testing)
 */
export function dispatchMalformedStorageResponse(): void {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        type: 'storageResponse',
        value: 'data',
      },
    })
  );
}
