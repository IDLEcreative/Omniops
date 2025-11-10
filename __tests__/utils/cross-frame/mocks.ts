/**
 * Mock utilities for cross-frame communication tests
 * Provides reusable mocks for window.postMessage, addEventListener, and storage
 */

export const mockPostMessage = jest.fn();
export const mockAddEventListener = jest.fn();
export const mockRemoveEventListener = jest.fn();

interface StorageImpl {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/**
 * Create a mock storage (localStorage/sessionStorage) implementation
 */
export function createStorageMock(): StorageImpl {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
}

/**
 * Setup iframe window mocks for cross-frame communication
 */
export function setupWindowMocks(): (event: MessageEvent) => void {
  let messageHandler: (event: MessageEvent) => void = () => {};

  const localStorageMock = createStorageMock();
  const sessionStorageMock = createStorageMock();

  // Reset mocks
  jest.clearAllMocks();
  jest.useFakeTimers();

  // Mock window methods
  window.addEventListener = mockAddEventListener;
  window.removeEventListener = mockRemoveEventListener;

  // Simulate iframe environment
  Object.defineProperty(window, 'self', { value: window, writable: true });
  Object.defineProperty(window, 'top', { value: {}, writable: true });
  Object.defineProperty(window, 'parent', {
    value: { postMessage: mockPostMessage },
    writable: true,
  });

  // Mock storage
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  // Capture message handler
  mockAddEventListener.mockImplementation((event, handler) => {
    if (event === 'message') {
      messageHandler = handler as (event: MessageEvent) => void;
    }
  });

  return (event: MessageEvent) => messageHandler(event);
}

/**
 * Cleanup after tests
 */
export function teardownWindowMocks(): void {
  jest.useRealTimers();
}
