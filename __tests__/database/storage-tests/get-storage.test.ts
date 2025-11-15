/**
 * Tests for getLocalStorage and getSessionStorage
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getLocalStorage, getSessionStorage } from '@/lib/utils/storage';
import { logger } from '@/lib/logger';

describe('getLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

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

describe('getSessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

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

  test('sessionStorage handles SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - global window intentionally undefined for SSR simulation
    delete global.window;

    expect(getSessionStorage('test', 'default')).toBe('default');

    global.window = originalWindow;
  });
});

console.log('✅ Get storage tests defined');
