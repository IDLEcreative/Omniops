import { jest } from '@jest/globals';

// Mock localStorage
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Mock window.parent for postMessage tests
export const mockPostMessage = jest.fn();

// Setup function to configure global mocks
export const setupChatWidgetMocks = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
  });

  Object.defineProperty(window, 'parent', {
    value: {
      postMessage: mockPostMessage,
    },
    writable: true,
  });
};

// Reset function for beforeEach
export const resetChatWidgetMocks = () => {
  jest.clearAllMocks();
  mockLocalStorage.clear();
  mockPostMessage.mockClear();
};

// Initialize mocks immediately
setupChatWidgetMocks();
