/**
 * Test Helpers for useParentCommunication Hook
 *
 * Common utility functions used across multiple test files.
 */

import { act } from '@testing-library/react';
import { jest } from '@jest/globals';

/**
 * Dispatches a message event to the window
 */
export function dispatchMessageEvent(data: any, origin: string = window.location.origin) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', { data, origin })
    );
  });
}

/**
 * Mocks window.parent with a postMessage function
 */
export function mockWindowParent(mockPostMessage: any) {
  const originalParent = window.parent;
  Object.defineProperty(window, 'parent', {
    value: { postMessage: mockPostMessage },
    writable: true,
    configurable: true,
  });
  return originalParent;
}

/**
 * Restores window.parent to original value
 */
export function restoreWindowParent(originalParent: Window) {
  Object.defineProperty(window, 'parent', {
    value: originalParent,
    writable: true,
    configurable: true,
  });
}

/**
 * Sets up environment variables for testing
 */
export function setupEnv() {
  return {
    originalEnv: process.env.NODE_ENV,
    originalAppUrl: process.env.NEXT_PUBLIC_APP_URL,
  };
}

/**
 * Restores environment variables
 */
export function restoreEnv(original: { originalEnv: string | undefined; originalAppUrl: string | undefined }) {
  process.env.NODE_ENV = original.originalEnv;
  process.env.NEXT_PUBLIC_APP_URL = original.originalAppUrl;
}

/**
 * Creates console spies for testing logging
 */
export function createConsoleSpy() {
  return {
    consoleLogSpy: jest.spyOn(console, 'log').mockImplementation(),
    consoleErrorSpy: jest.spyOn(console, 'error').mockImplementation(),
    consoleWarnSpy: jest.spyOn(console, 'warn').mockImplementation(),
  };
}

/**
 * Restores console spies
 */
export function restoreConsoleSpy(spies: ReturnType<typeof createConsoleSpy>) {
  spies.consoleLogSpy.mockRestore();
  spies.consoleErrorSpy.mockRestore();
  spies.consoleWarnSpy.mockRestore();
}

/**
 * Waits for next tick (useful for async operations)
 */
export function waitForNextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}
