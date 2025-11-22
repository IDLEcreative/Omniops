/**
 * Privacy Test Setup Utilities
 *
 * Shared setup, mocks, and utilities for privacy hook tests
 */

import { jest } from '@jest/globals';

export interface TestContext {
  originalEnv: string | undefined;
  originalWindow: typeof window;
  consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  mockPostMessage: jest.Mock;
}

/**
 * Setup window mock with location and postMessage
 */
export function setupWindowMock(): {
  window: any;
  mockPostMessage: jest.Mock;
} {
  const mockPostMessage = jest.fn();

  // In jsdom environment, window and document already exist
  // We just need to mock specific properties
  if (typeof window !== 'undefined') {
    // Mock window.parent.postMessage
    Object.defineProperty(window, 'parent', {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    });

    // Mock window.location.ancestorOrigins
    if (window.location) {
      Object.defineProperty(window.location, 'ancestorOrigins', {
        value: null,
        writable: true,
        configurable: true,
      });
    }
  }

  // Mock document.referrer
  if (typeof document !== 'undefined') {
    Object.defineProperty(document, 'referrer', {
      value: 'http://localhost:3000',
      writable: true,
      configurable: true,
    });
  }

  return {
    window: global.window,
    mockPostMessage,
  };
}

/**
 * Setup test environment with spies and mocks
 */
export function setupTestEnvironment(): TestContext {
  const originalEnv = process.env.NODE_ENV;
  const originalWindow = global.window;
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  const { mockPostMessage } = setupWindowMock();

  return {
    originalEnv,
    originalWindow,
    consoleLogSpy,
    consoleErrorSpy,
    mockPostMessage,
  };
}

/**
 * Cleanup after test
 */
export function cleanupTestEnvironment(context: TestContext): void {
  process.env.NODE_ENV = context.originalEnv;
  global.window = context.originalWindow;
  context.consoleLogSpy.mockRestore();
  context.consoleErrorSpy.mockRestore();
  jest.clearAllMocks();
}

/**
 * Set URL search params for testing
 */
export function setURLSearchParams(search: string): void {
  global.window.location.search = search;
}

/**
 * Set document.referrer for testing parent origin detection
 */
export function setDocumentReferrer(referrer: string): void {
  if (typeof document !== 'undefined') {
    Object.defineProperty(document, 'referrer', {
      value: referrer,
      writable: true,
      configurable: true,
    });
  }
}

/**
 * Mock URLSearchParams for error testing
 */
export function mockURLSearchParamsError(originalClass: any): void {
  (global as any).URLSearchParams = jest.fn(() => {
    throw new Error('URL parsing failed');
  });
}

/**
 * Restore original URLSearchParams
 */
export function restoreURLSearchParams(originalClass: any): void {
  (global as any).URLSearchParams = originalClass;
}
