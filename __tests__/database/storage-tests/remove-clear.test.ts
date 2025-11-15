/**
 * Tests for removeLocalStorage and clearLocalStorage
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { removeLocalStorage, clearLocalStorage } from '@/lib/utils/storage';
import { logger } from '@/lib/logger';

describe('removeLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

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
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

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

console.log('✅ Remove/clear storage tests defined');
