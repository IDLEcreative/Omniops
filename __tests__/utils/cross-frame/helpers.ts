/**
 * Test helper utilities for cross-frame communication tests
 */

import { mockPostMessage } from './mocks';

/**
 * Get the last postMessage call data
 */
export function getLastPostMessageCall(): any {
  const calls = mockPostMessage.mock.calls;
  if (calls.length === 0) return null;
  return calls[calls.length - 1][0];
}

/**
 * Find a postMessage call by type
 */
export function findPostMessageByType(type: string): any | null {
  const calls = mockPostMessage.mock.calls;
  for (const call of calls) {
    if (call[0]?.type === type) {
      return call[0];
    }
  }
  return null;
}

/**
 * Get the request ID from the last postMessage call
 */
export function getLastRequestId(): string | undefined {
  const call = getLastPostMessageCall();
  return call?.requestId;
}

/**
 * Simulate a parent storage response message
 */
export function createStorageResponseMessage(
  requestId: string,
  key: string,
  value: string
): MessageEvent {
  return new MessageEvent('message', {
    data: {
      type: 'storageResponse',
      requestId,
      key,
      value,
    },
  });
}

/**
 * Simulate a pong response message
 */
export function createPongMessage(pingTime: number): MessageEvent {
  return new MessageEvent('message', {
    data: { type: 'pong', pingTime },
  });
}

/**
 * Wait for async operations within fake timers context
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
