/**
 * Tests for setLocalStorage and setSessionStorage
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { setLocalStorage, setSessionStorage, getLocalStorage } from '@/lib/utils/storage';
import { logger } from '@/lib/logger';

describe('setLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

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

describe('setSessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
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

    expect(setSessionStorage('test', 'value')).toBe(false);

    global.window = originalWindow;
  });
});

console.log('✅ Set storage tests defined');
