/**
 * Comprehensive test suite for localStorage utilities
 * Tests all edge cases, error handling, and type safety
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock logger to prevent console spam during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  isLocalStorageAvailable,
  getSessionStorage,
  setSessionStorage,
} from '@/lib/utils/storage';
import { logger } from '@/lib/logger';

describe('localStorage utilities', () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getLocalStorage', () => {
    test('returns default value when key does not exist', () => {
      const result = getLocalStorage('nonexistent', 'default');
      expect(result).toBe('default');
    });

    test('returns parsed value when key exists', () => {
      localStorage.setItem('test', JSON.stringify({ foo: 'bar' }));
      const result = getLocalStorage<{ foo: string }>('test', { foo: 'default' });
      expect(result).toEqual({ foo: 'bar' });
    });

    test('handles numbers correctly', () => {
      localStorage.setItem('count', JSON.stringify(42));
      const result = getLocalStorage<number>('count', 0);
      expect(result).toBe(42);
    });

    test('handles arrays correctly', () => {
      const testArray = [1, 2, 3];
      localStorage.setItem('array', JSON.stringify(testArray));
      const result = getLocalStorage<number[]>('array', []);
      expect(result).toEqual(testArray);
    });

    test('returns default value on parse error', () => {
      localStorage.setItem('invalid', 'not-json');
      const result = getLocalStorage('invalid', 'default');
      expect(result).toBe('default');
      expect(logger.warn).toHaveBeenCalledWith(
        'localStorage.getItem failed',
        expect.objectContaining({ key: 'invalid' })
      );
    });

    test('handles SSR (typeof window === undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Simulating SSR
      delete global.window;

      const result = getLocalStorage('test', 'default');
      expect(result).toBe('default');

      global.window = originalWindow;
    });
  });

  describe('setLocalStorage', () => {
    test('stores value successfully', () => {
      const success = setLocalStorage('test', { foo: 'bar' });
      expect(success).toBe(true);
      expect(localStorage.getItem('test')).toBe(JSON.stringify({ foo: 'bar' }));
    });

    test('stores primitive values', () => {
      setLocalStorage('string', 'hello');
      setLocalStorage('number', 42);
      setLocalStorage('boolean', true);

      expect(JSON.parse(localStorage.getItem('string')!)).toBe('hello');
      expect(JSON.parse(localStorage.getItem('number')!)).toBe(42);
      expect(JSON.parse(localStorage.getItem('boolean')!)).toBe(true);
    });

    test('stores complex objects', () => {
      const complexObj = {
        nested: { deep: { value: 123 } },
        array: [1, 2, 3],
        mixed: [{ id: 1 }, { id: 2 }],
      };
      setLocalStorage('complex', complexObj);
      const retrieved = getLocalStorage('complex', {});
      expect(retrieved).toEqual(complexObj);
    });

    test('returns false on QuotaExceededError', () => {
      // Mock setItem to throw QuotaExceededError
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        const error = new Error('QuotaExceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const success = setLocalStorage('test', 'value');
      expect(success).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'localStorage quota exceeded',
        expect.objectContaining({ key: 'test' })
      );

      Storage.prototype.setItem = originalSetItem;
    });

    test('returns false on SecurityError', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        const error = new Error('SecurityError');
        error.name = 'SecurityError';
        throw error;
      });

      const success = setLocalStorage('test', 'value');
      expect(success).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'localStorage blocked (private browsing?)',
        expect.objectContaining({ key: 'test' })
      );

      Storage.prototype.setItem = originalSetItem;
    });

    test('handles SSR gracefully', () => {
      const originalWindow = global.window;
      // @ts-expect-error - global window intentionally undefined for SSR simulation
      delete global.window;

      const success = setLocalStorage('test', 'value');
      expect(success).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('removeLocalStorage', () => {
    test('removes existing key', () => {
      localStorage.setItem('test', 'value');
      const success = removeLocalStorage('test');
      expect(success).toBe(true);
      expect(localStorage.getItem('test')).toBeNull();
    });

    test('succeeds even if key does not exist', () => {
      const success = removeLocalStorage('nonexistent');
      expect(success).toBe(true);
    });

    test('returns false on error', () => {
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = jest.fn(() => {
        throw new Error('RemoveError');
      });

      const success = removeLocalStorage('test');
      expect(success).toBe(false);
      expect(logger.warn).toHaveBeenCalled();

      Storage.prototype.removeItem = originalRemoveItem;
    });

    test('handles SSR', () => {
      const originalWindow = global.window;
      // @ts-expect-error - global window intentionally undefined for SSR simulation
      delete global.window;

      const success = removeLocalStorage('test');
      expect(success).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('clearLocalStorage', () => {
    test('clears all localStorage', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');

      const success = clearLocalStorage();
      expect(success).toBe(true);
      expect(localStorage.length).toBe(0);
    });

    test('returns false on error', () => {
      const originalClear = Storage.prototype.clear;
      Storage.prototype.clear = jest.fn(() => {
        throw new Error('ClearError');
      });

      const success = clearLocalStorage();
      expect(success).toBe(false);
      expect(logger.warn).toHaveBeenCalled();

      Storage.prototype.clear = originalClear;
    });

    test('handles SSR', () => {
      const originalWindow = global.window;
      // @ts-expect-error - global window intentionally undefined for SSR simulation
      delete global.window;

      const success = clearLocalStorage();
      expect(success).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('isLocalStorageAvailable', () => {
    test('returns true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    test('returns false when localStorage throws error', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Not available');
      });

      expect(isLocalStorageAvailable()).toBe(false);

      Storage.prototype.setItem = originalSetItem;
    });

    test('cleans up test key', () => {
      isLocalStorageAvailable();
      expect(localStorage.getItem('__localStorage_test__')).toBeNull();
    });

    test('handles SSR', () => {
      const originalWindow = global.window;
      // @ts-expect-error - global window intentionally undefined for SSR simulation
      delete global.window;

      expect(isLocalStorageAvailable()).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('sessionStorage utilities', () => {
    test('getSessionStorage works correctly', () => {
      sessionStorage.setItem('test', JSON.stringify({ foo: 'bar' }));
      const result = getSessionStorage<{ foo: string }>('test', { foo: 'default' });
      expect(result).toEqual({ foo: 'bar' });
    });

    test('getSessionStorage returns default on error', () => {
      sessionStorage.setItem('invalid', 'not-json');
      const result = getSessionStorage('invalid', 'default');
      expect(result).toBe('default');
      expect(logger.warn).toHaveBeenCalled();
    });

    test('setSessionStorage works correctly', () => {
      const success = setSessionStorage('test', { foo: 'bar' });
      expect(success).toBe(true);
      expect(sessionStorage.getItem('test')).toBe(JSON.stringify({ foo: 'bar' }));
    });

    test('setSessionStorage returns false on error', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Error');
      });

      const success = setSessionStorage('test', 'value');
      expect(success).toBe(false);
      expect(logger.warn).toHaveBeenCalled();

      Storage.prototype.setItem = originalSetItem;
    });

    test('sessionStorage handles SSR', () => {
      const originalWindow = global.window;
      // @ts-expect-error - global window intentionally undefined for SSR simulation
      delete global.window;

      expect(getSessionStorage('test', 'default')).toBe('default');
      expect(setSessionStorage('test', 'value')).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('Type Safety', () => {
    test('maintains type safety with generics', () => {
      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'Test' };
      setLocalStorage<User>('user', user);
      const retrieved = getLocalStorage<User>('user', { id: 0, name: '' });

      // TypeScript should enforce these types
      expect(retrieved.id).toBe(1);
      expect(retrieved.name).toBe('Test');
    });

    test('works with union types', () => {
      type Status = 'pending' | 'completed' | 'failed';
      setLocalStorage<Status>('status', 'pending');
      const status = getLocalStorage<Status>('status', 'pending');
      expect(status).toBe('pending');
    });

    test('works with array types', () => {
      const numbers = [1, 2, 3, 4, 5];
      setLocalStorage<number[]>('numbers', numbers);
      const retrieved = getLocalStorage<number[]>('numbers', []);
      expect(retrieved).toEqual(numbers);
    });
  });

  describe('Integration with QuickStart.tsx pattern', () => {
    test('progress tracking pattern works correctly', () => {
      const storageKey = 'installation_progress_test.com';

      // Initial state
      const saved = getLocalStorage<number[]>(storageKey, []);
      const completedSteps = new Set(saved);
      expect(completedSteps.size).toBe(0);

      // Add step 1
      completedSteps.add(1);
      setLocalStorage(storageKey, Array.from(completedSteps));

      // Retrieve and verify
      const retrieved1 = getLocalStorage<number[]>(storageKey, []);
      expect(new Set(retrieved1)).toEqual(new Set([1]));

      // Add more steps
      completedSteps.add(2);
      completedSteps.add(4);
      setLocalStorage(storageKey, Array.from(completedSteps));

      // Final verification
      const retrievedFinal = getLocalStorage<number[]>(storageKey, []);
      expect(new Set(retrievedFinal)).toEqual(new Set([1, 2, 4]));
    });
  });
});

console.log('✅ All storage utility tests defined');
console.log('Run with: npm test test-storage-utilities.ts');
