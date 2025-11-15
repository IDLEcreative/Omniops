/**
 * Tests for isLocalStorageAvailable and Type Safety
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { isLocalStorageAvailable, setLocalStorage, getLocalStorage } from '@/lib/utils/storage';

describe('isLocalStorageAvailable', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

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

describe('Type Safety', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('maintains type safety with generics', () => {
    interface User {
      id: number;
      name: string;
    }

    const user: User = { id: 1, name: 'Test' };
    setLocalStorage<User>('user', user);
    const retrieved = getLocalStorage<User>('user', { id: 0, name: '' });

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
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('progress tracking pattern works correctly', () => {
    const storageKey = 'installation_progress_test.com';

    const saved = getLocalStorage<number[]>(storageKey, []);
    const completedSteps = new Set(saved);
    expect(completedSteps.size).toBe(0);

    completedSteps.add(1);
    setLocalStorage(storageKey, Array.from(completedSteps));

    const retrieved1 = getLocalStorage<number[]>(storageKey, []);
    expect(new Set(retrieved1)).toEqual(new Set([1]));

    completedSteps.add(2);
    completedSteps.add(4);
    setLocalStorage(storageKey, Array.from(completedSteps));

    const retrievedFinal = getLocalStorage<number[]>(storageKey, []);
    expect(new Set(retrievedFinal)).toEqual(new Set([1, 2, 4]));
  });
});

console.log('✅ Availability and type safety tests defined');
