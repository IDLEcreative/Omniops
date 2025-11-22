/**
 * ParentStorageAdapter - Iframe Context Tests
 *
 * Tests adapter behavior when running in an iframe (window.self !== window.top)
 * In this context, storage operations use postMessage to communicate with parent window
 */

import { ParentStorageAdapter } from '@/lib/chat-widget/parent-storage';
import {
  createMockLocalStorage,
  installMockLocalStorage,
  setupIframeContext,
  getFirstRequestId,
  dispatchStorageResponse,
  dispatchStorageResponseAsync,
} from '__tests__/utils/chat-widget/parent-storage-helpers';

describe('ParentStorageAdapter - Iframe Context', () => {
  let adapter: ParentStorageAdapter;
  let mockLocalStorage: Storage;
  let mockParentPostMessage: jest.Mock;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
    installMockLocalStorage(mockLocalStorage);
    mockParentPostMessage = jest.fn();
    setupIframeContext(mockParentPostMessage);
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
    // Mock document.referrer to match expected targetOrigin
    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com/parent-page',
      configurable: true,
    });
    adapter = new ParentStorageAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getItem()', () => {
    it('should request value from parent window via postMessage', async () => {
      const result = adapter.getItem('test-key');

      // Get requestId after postMessage is called
      await new Promise(resolve => setTimeout(resolve, 0));
      const requestId = getFirstRequestId(mockParentPostMessage);

      dispatchStorageResponse(requestId, 'parent-value');

      const finalResult = await result;

      expect(finalResult).toBe('parent-value');
      expect(mockParentPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'getFromParentStorage',
          key: 'test-key',
          requestId: expect.stringContaining('request_'),
        }),
        'https://example.com'
      );
    });

    it('should use targetOrigin from referrer or fallback to *', async () => {
      // Clear the referrer to test fallback
      Object.defineProperty(document, 'referrer', {
        value: '',
        configurable: true,
      });

      const newAdapter = new ParentStorageAdapter();
      newAdapter.getItem('test-key');

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockParentPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'getFromParentStorage',
          key: 'test-key',
        }),
        '*'
      );
    });

    it('should timeout after 500ms and return null', async () => {
      jest.useFakeTimers();

      const promise = adapter.getItem('test-key');
      jest.advanceTimersByTime(500);

      const result = await promise;

      expect(result).toBeNull();
      jest.useRealTimers();
    });

    it('should handle multiple concurrent requests with unique requestIds', async () => {
      const key1Promise = adapter.getItem('key1');
      const key2Promise = adapter.getItem('key2');

      const call1 = mockParentPostMessage.mock.calls[0][0];
      const call2 = mockParentPostMessage.mock.calls[1][0];

      expect(call1.requestId).not.toBe(call2.requestId);

      // Simulate responses
      dispatchStorageResponse(call1.requestId, 'value1');
      dispatchStorageResponse(call2.requestId, 'value2');

      const [result1, result2] = await Promise.all([key1Promise, key2Promise]);

      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
    });

    it('should clean up pending requests after response', async () => {
      const result = adapter.getItem('test-key');

      // Get requestId after postMessage is called
      await new Promise(resolve => setTimeout(resolve, 0));
      const requestId = getFirstRequestId(mockParentPostMessage);

      dispatchStorageResponse(requestId, 'test-value');
      await result;

      // Attempt to send duplicate response
      dispatchStorageResponse(requestId, 'duplicate-value');

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockParentPostMessage).toHaveBeenCalledTimes(1);
    });

    it('should ignore storage responses with unknown requestIds', async () => {
      const promise = adapter.getItem('test-key');

      // Send response with unknown requestId
      dispatchStorageResponse('unknown_request_id', 'wrong-value');

      // Send correct response after delay
      dispatchStorageResponseAsync(getFirstRequestId(mockParentPostMessage), 'correct-value');

      const result = await promise;

      expect(result).toBe('correct-value');
    });

    it('should handle null values from parent storage', async () => {
      const result = adapter.getItem('nonexistent-key');

      // Get requestId after postMessage is called
      await new Promise(resolve => setTimeout(resolve, 0));
      const requestId = getFirstRequestId(mockParentPostMessage);

      dispatchStorageResponse(requestId, null);

      const finalResult = await result;

      expect(finalResult).toBeNull();
    });
  });

  describe('setItem()', () => {
    it('should send value to parent window via postMessage', () => {
      adapter.setItem('test-key', 'test-value');

      expect(mockParentPostMessage).toHaveBeenCalledWith(
        {
          type: 'saveToParentStorage',
          key: 'test-key',
          value: 'test-value',
        },
        'https://example.com'
      );
    });

    it('should use correct targetOrigin', () => {
      adapter.setItem('key', 'value');

      const call = mockParentPostMessage.mock.calls[0];
      expect(call[1]).toBe('https://example.com');
    });
  });

  describe('removeItem()', () => {
    it('should send remove request to parent window via postMessage', () => {
      adapter.removeItem('test-key');

      expect(mockParentPostMessage).toHaveBeenCalledWith(
        {
          type: 'removeFromParentStorage',
          key: 'test-key',
        },
        'https://example.com'
      );
    });

    it('should use correct targetOrigin', () => {
      adapter.removeItem('key');

      const call = mockParentPostMessage.mock.calls[0];
      expect(call[1]).toBe('https://example.com');
    });
  });
});
