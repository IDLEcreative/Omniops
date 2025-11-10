/**
 * ParentStorageAdapter - Synchronous Operations Tests
 *
 * Tests the getItemSync() method which uses synchronous localStorage access
 * This method works the same in both iframe and non-iframe contexts
 */

import { ParentStorageAdapter } from '@/lib/chat-widget/parent-storage';
import {
  createMockLocalStorage,
  installMockLocalStorage,
  setupNonIframeContext,
  setupIframeContext,
} from '__tests__/utils/chat-widget/parent-storage-helpers';

describe('ParentStorageAdapter - getItemSync()', () => {
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
    installMockLocalStorage(mockLocalStorage);
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should use regular localStorage in non-iframe context', () => {
    setupNonIframeContext();
    const adapter = new ParentStorageAdapter();
    (mockLocalStorage.getItem as jest.Mock).mockReturnValue('sync-value');

    const result = adapter.getItemSync('test-key');

    expect(result).toBe('sync-value');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should use regular localStorage in iframe context', () => {
    const mockParentPostMessage = jest.fn();
    setupIframeContext(mockParentPostMessage);

    const adapter = new ParentStorageAdapter();
    (mockLocalStorage.getItem as jest.Mock).mockReturnValue(
      'sync-value-iframe'
    );

    const result = adapter.getItemSync('test-key');

    expect(result).toBe('sync-value-iframe');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should handle errors gracefully and return null', () => {
    setupNonIframeContext();
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation();
    (mockLocalStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error('Sync access denied');
    });

    const adapter = new ParentStorageAdapter();
    const result = adapter.getItemSync('test-key');

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ParentStorageAdapter] Sync getItem failed:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
