/**
 * ParentStorageAdapter - Non-iframe Context Tests
 *
 * Tests adapter behavior when not running in an iframe (window.self === window.top)
 * In this context, storage operations use regular localStorage directly
 */

import { ParentStorageAdapter } from '@/lib/chat-widget/parent-storage';
import {
  createMockLocalStorage,
  installMockLocalStorage,
  setupNonIframeContext,
} from '__tests__/utils/chat-widget/parent-storage-helpers';

describe('ParentStorageAdapter - Non-iframe Context', () => {
  let adapter: ParentStorageAdapter;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
    installMockLocalStorage(mockLocalStorage);
    setupNonIframeContext();
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
    adapter = new ParentStorageAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getItem()', () => {
    it('should retrieve value from regular localStorage when not in iframe', async () => {
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue('test-value');

      const result = await adapter.getItem('test-key');

      expect(result).toBe('test-value');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = await adapter.getItem('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should handle localStorage errors gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      (mockLocalStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const result = await adapter.getItem('test-key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ParentStorageAdapter] localStorage.getItem failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('setItem()', () => {
    it('should store value in regular localStorage when not in iframe', () => {
      adapter.setItem('test-key', 'test-value');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        'test-value'
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      (mockLocalStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      adapter.setItem('test-key', 'test-value');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ParentStorageAdapter] localStorage.setItem failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty string values', () => {
      adapter.setItem('test-key', '');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', '');
    });

    it('should handle special characters in keys and values', () => {
      const specialKey = 'key:with:colons/and/slashes';
      const specialValue = 'value with\nnewlines\tand\ttabs';

      adapter.setItem(specialKey, specialValue);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        specialKey,
        specialValue
      );
    });
  });

  describe('removeItem()', () => {
    it('should remove value from regular localStorage when not in iframe', () => {
      adapter.removeItem('test-key');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      (mockLocalStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      adapter.removeItem('test-key');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ParentStorageAdapter] localStorage.removeItem failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
