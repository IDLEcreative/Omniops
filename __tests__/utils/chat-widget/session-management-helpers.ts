import { jest } from '@jest/globals';
import type { StorageAdapter } from '@/components/ChatWidget/hooks/useSessionManagement';

/**
 * Test utilities for useSessionManagement hook testing
 *
 * Provides mock storage implementations for various test scenarios:
 * - Standard mock storage with Map backend
 * - Slow storage for async testing
 * - Failing storage for error testing
 * - Partial storage for edge case testing
 */

/**
 * Creates a mock storage adapter for testing
 * Exposes the internal storage Map for verification
 */
export function createMockStorage(
  initialData: Record<string, string> = {}
): StorageAdapter & { storage: Map<string, string> } {
  const storage = new Map<string, string>(Object.entries(initialData));

  return {
    storage, // Expose for testing
    getItem: jest.fn(async (key: string) => storage.get(key) || null),
    setItem: jest.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      storage.delete(key);
    }),
  };
}

/**
 * Creates a slow storage adapter for testing async behavior
 * Useful for testing race conditions and loading states
 */
export function createSlowStorage(delayMs: number = 100): StorageAdapter {
  const storage = new Map<string, string>();

  return {
    getItem: jest.fn(async (key: string) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return storage.get(key) || null;
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      storage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      storage.delete(key);
    }),
  };
}

/**
 * Creates a failing storage adapter for error testing
 * All operations throw the specified error
 */
export function createFailingStorage(errorMessage: string = 'Storage error'): StorageAdapter {
  return {
    getItem: jest.fn(async () => {
      throw new Error(errorMessage);
    }),
    setItem: jest.fn(async () => {
      throw new Error(errorMessage);
    }),
    removeItem: jest.fn(async () => {
      throw new Error(errorMessage);
    }),
  };
}

/**
 * Creates a partially failing storage adapter
 * Allows configuring which operations fail
 */
export function createPartiallyFailingStorage(config: {
  getItemFails?: boolean;
  setItemFails?: boolean;
  removeItemFails?: boolean;
  errorMessage?: string;
} = {}): StorageAdapter {
  const storage = new Map<string, string>();
  const errorMessage = config.errorMessage || 'Operation failed';

  return {
    getItem: jest.fn(async (key: string) => {
      if (config.getItemFails) {
        throw new Error(errorMessage);
      }
      return storage.get(key) || null;
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      if (config.setItemFails) {
        throw new Error(errorMessage);
      }
      storage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      if (config.removeItemFails) {
        throw new Error(errorMessage);
      }
      storage.delete(key);
    }),
  };
}

/**
 * Creates a storage adapter that fails after N operations
 * Useful for testing recovery from intermittent failures
 */
export function createFlakeyStorage(failAfterOps: number = 2): StorageAdapter {
  const storage = new Map<string, string>();
  let operationCount = 0;

  const checkAndIncrement = () => {
    operationCount++;
    if (operationCount > failAfterOps) {
      throw new Error('Storage operation failed');
    }
  };

  return {
    getItem: jest.fn(async (key: string) => {
      checkAndIncrement();
      return storage.get(key) || null;
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      checkAndIncrement();
      storage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      checkAndIncrement();
      storage.delete(key);
    }),
  };
}

/**
 * Creates a storage adapter with configurable delays per operation
 * Allows fine-grained control over async timing
 */
export function createCustomDelayStorage(delays: {
  getItem?: number;
  setItem?: number;
  removeItem?: number;
} = {}): StorageAdapter {
  const storage = new Map<string, string>();

  return {
    getItem: jest.fn(async (key: string) => {
      if (delays.getItem) {
        await new Promise(resolve => setTimeout(resolve, delays.getItem));
      }
      return storage.get(key) || null;
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      if (delays.setItem) {
        await new Promise(resolve => setTimeout(resolve, delays.setItem));
      }
      storage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      if (delays.removeItem) {
        await new Promise(resolve => setTimeout(resolve, delays.removeItem));
      }
      storage.delete(key);
    }),
  };
}

/**
 * Creates a storage adapter that tracks all operations
 * Useful for verifying operation order and parameters
 */
export function createTrackedStorage(
  initialData: Record<string, string> = {}
): StorageAdapter & {
  storage: Map<string, string>;
  operations: Array<{ type: string; key: string; value?: string; timestamp: number }>;
} {
  const storage = new Map<string, string>(Object.entries(initialData));
  const operations: Array<{ type: string; key: string; value?: string; timestamp: number }> = [];

  return {
    storage,
    operations,
    getItem: jest.fn(async (key: string) => {
      operations.push({ type: 'getItem', key, timestamp: Date.now() });
      return storage.get(key) || null;
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      operations.push({ type: 'setItem', key, value, timestamp: Date.now() });
      storage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      operations.push({ type: 'removeItem', key, timestamp: Date.now() });
      storage.delete(key);
    }),
  };
}

/**
 * Creates a storage adapter that simulates quota exceeded errors
 * Useful for testing storage limit scenarios
 */
export function createQuotaExceededStorage(maxSize: number = 100): StorageAdapter {
  const storage = new Map<string, string>();

  return {
    getItem: jest.fn(async (key: string) => {
      return storage.get(key) || null;
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      const currentSize = Array.from(storage.values()).join('').length;
      const newSize = currentSize + value.length;

      if (newSize > maxSize) {
        throw new Error('QuotaExceededError: Storage quota exceeded');
      }

      storage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      storage.delete(key);
    }),
  };
}

/**
 * Helper to wait for all pending promises to resolve
 * Useful for ensuring async operations complete in tests
 */
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Helper to verify storage state matches expected values
 */
export function verifyStorageState(
  storage: StorageAdapter & { storage: Map<string, string> },
  expected: Record<string, string | null>
): void {
  for (const [key, value] of Object.entries(expected)) {
    const actual = storage.storage.get(key);
    if (value === null) {
      expect(actual).toBeUndefined();
    } else {
      expect(actual).toBe(value);
    }
  }
}

/**
 * Helper to create a localStorage-like adapter
 * Wraps the browser localStorage API to match StorageAdapter interface
 */
export function createLocalStorageAdapter(storage: Storage = localStorage): StorageAdapter {
  return {
    getItem: async (key: string) => storage.getItem(key),
    setItem: async (key: string, value: string) => storage.setItem(key, value),
    removeItem: async (key: string) => storage.removeItem(key),
  };
}

/**
 * Helper to create a sessionStorage-like adapter
 */
export function createSessionStorageAdapter(storage: Storage = sessionStorage): StorageAdapter {
  return {
    getItem: async (key: string) => storage.getItem(key),
    setItem: async (key: string, value: string) => storage.setItem(key, value),
    removeItem: async (key: string) => storage.removeItem(key),
  };
}