/**
 * Safe localStorage utilities with error handling
 *
 * Handles edge cases like:
 * - Private browsing mode (Safari blocks localStorage)
 * - Storage quota exceeded
 * - Disabled storage in browser settings
 */

import { logger } from '@/lib/logger';

/**
 * Safely get an item from localStorage
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    logger.warn('localStorage.getItem failed', { key, error });
    return defaultValue;
  }
}

/**
 * Safely set an item in localStorage
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // Handle quota exceeded or private browsing
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        logger.warn('localStorage quota exceeded', { key });
      } else if (error.name === 'SecurityError') {
        logger.warn('localStorage blocked (private browsing?)', { key });
      } else {
        logger.warn('localStorage.setItem failed', { key, error });
      }
    }
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 */
export function removeLocalStorage(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.warn('localStorage.removeItem failed', { key, error });
    return false;
  }
}

/**
 * Safely clear all localStorage
 */
export function clearLocalStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    logger.warn('localStorage.clear failed', { error });
    return false;
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * SessionStorage variants (same API, different storage)
 */
export function getSessionStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = window.sessionStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    logger.warn('sessionStorage.getItem failed', { key, error });
    return defaultValue;
  }
}

export function setSessionStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.warn('sessionStorage.setItem failed', { key, error });
    return false;
  }
}
