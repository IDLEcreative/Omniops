import { jest } from '@jest/globals';

/**
 * Shared test fixtures and mocks for ChatWidget tests
 *
 * Purpose: Extract reusable test setup to reduce duplication across test files
 * Usage: Import mocks and fixtures into individual test files
 */

// Mock localStorage implementation
export class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

// Mock ParentStorage-compatible adapter for tests
export class MockParentStorage {
  private storage: MockStorage;

  constructor(storage: MockStorage) {
    this.storage = storage;
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.removeItem(key);
  }
}

// Mock fetch
export const mockFetch = jest.fn();

// Mock window.parent.postMessage
export const mockPostMessage = jest.fn();

/**
 * Setup global mocks for ChatWidget tests
 * Call this in beforeEach() of test suites
 */
export function setupGlobalMocks(): MockStorage {
  const localStorage = new MockStorage();
  (global as any).localStorage = localStorage;

  // Setup default mock implementation for fetch
  // This handles the /api/widget/config call that happens on mount
  mockFetch.mockImplementation((url: string) => {
    // Default response for widget config endpoint
    if (url.includes('/api/widget/config')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          config: {
            domain: 'test.example.com',
            woocommerce_enabled: false,
          },
        }),
      });
    }

    // For other endpoints, return a basic success response
    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  global.fetch = mockFetch as any;

  Object.defineProperty(window, 'parent', {
    writable: true,
    value: {
      postMessage: mockPostMessage,
    },
  });

  return localStorage;
}

/**
 * Clean up mocks after tests
 * Call this in afterEach() of test suites
 */
export function cleanupMocks(localStorage?: MockStorage): void {
  if (localStorage) {
    localStorage.clear();
  }
  jest.clearAllMocks();
}

/**
 * Mock message data for tests
 */
export const mockMessages = [
  { id: 'msg-1', role: 'user' as const, content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
  { id: 'msg-2', role: 'assistant' as const, content: 'Hi there!', created_at: '2025-01-01T00:01:00Z' },
];

/**
 * Mock conversation data for tests
 */
export const mockConversation = {
  id: 'conv-123',
  created_at: '2025-01-01T00:00:00Z',
};

/**
 * Create successful API response mock
 */
export function createSuccessResponse(messages = mockMessages) {
  return {
    ok: true,
    json: async () => ({
      success: true,
      messages,
      conversation: mockConversation,
      count: messages.length,
    }),
  };
}

/**
 * Create error API response mock
 */
export function createErrorResponse(status = 500, error = 'Internal server error') {
  return {
    ok: false,
    status,
    json: async () => ({
      success: false,
      messages: [],
      error,
    }),
  };
}

/**
 * Create not found response mock
 */
export function createNotFoundResponse() {
  return {
    ok: true,
    json: async () => ({
      success: false,
      messages: [],
      conversation: null,
    }),
  };
}
