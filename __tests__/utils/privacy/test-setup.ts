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
  delete (global as any).window;
  const mockPostMessage = jest.fn();
  (global as any).window = {
    location: {
      origin: 'http://localhost:3000',
      search: '',
    },
    parent: {
      postMessage: mockPostMessage,
    },
  };
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
