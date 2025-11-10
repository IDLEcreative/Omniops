/**
 * Mock Storage Adapters for Session Management Tests
 */

import { jest } from '@jest/globals';
import type { StorageAdapter } from '@/components/ChatWidget/hooks/useSessionManagement';

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

export function createSlowStorage(
  delayMs: number = 100,
  initialData: Record<string, string> = {}
): StorageAdapter {
  const storage = new Map<string, string>(Object.entries(initialData));

  return {
    getItem: jest.fn(async (key: string) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return storage.get(key) || null;
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      storage.set(key, value);
    }),
  };
}

export function createFailingStorage(errorMessage: string = 'Storage error'): StorageAdapter {
  return {
    getItem: jest.fn(async () => {
      throw new Error(errorMessage);
    }),
    setItem: jest.fn(async () => {
      throw new Error(errorMessage);
    }),
  };
}
