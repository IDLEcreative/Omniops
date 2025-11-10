/**
 * ParentStorageAdapter - Edge Cases and Message Listener Tests
 *
 * Tests edge cases including rapid operations, special characters,
 * and message event filtering behavior
 */

import { ParentStorageAdapter } from '@/lib/chat-widget/parent-storage';
import {
  createMockLocalStorage,
  installMockLocalStorage,
  setupNonIframeContext,
  setupIframeContext,
  dispatchNonStorageMessage,
  dispatchMalformedStorageResponse,
} from '__tests__/utils/chat-widget/parent-storage-helpers';

describe('ParentStorageAdapter - Edge Cases', () => {
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

  it('should handle rapid consecutive operations', () => {
    const mockParentPostMessage = jest.fn();
    setupIframeContext(mockParentPostMessage);

    const adapter = new ParentStorageAdapter();

    // Rapid operations
    adapter.setItem('key1', 'value1');
    adapter.setItem('key2', 'value2');
    adapter.removeItem('key3');

    expect(mockParentPostMessage).toHaveBeenCalledTimes(3);
  });

  it('should handle empty string values', () => {
    setupNonIframeContext();
    const adapter = new ParentStorageAdapter();

    adapter.setItem('test-key', '');

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', '');
  });

  it('should handle special characters in keys and values', () => {
    setupNonIframeContext();
    const adapter = new ParentStorageAdapter();

    const specialKey = 'key:with:colons/and/slashes';
    const specialValue = 'value with\nnewlines\tand\ttabs';

    adapter.setItem(specialKey, specialValue);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      specialKey,
      specialValue
    );
  });
});

describe('ParentStorageAdapter - Message Event Listener', () => {
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

  it('should only process storageResponse messages', () => {
    const mockParentPostMessage = jest.fn();
    setupIframeContext(mockParentPostMessage);

    const adapter = new ParentStorageAdapter();

    // Send non-storage message
    dispatchNonStorageMessage();

    // Should not throw or cause issues
    expect(mockParentPostMessage).not.toHaveBeenCalled();
  });

  it('should ignore messages without requestId', () => {
    const mockParentPostMessage = jest.fn();
    setupIframeContext(mockParentPostMessage);

    const adapter = new ParentStorageAdapter();

    // Send malformed message
    dispatchMalformedStorageResponse();

    // Should not cause errors
    expect(mockParentPostMessage).not.toHaveBeenCalled();
  });
});
