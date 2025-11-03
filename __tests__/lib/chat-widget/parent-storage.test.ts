/**
 * Functionality Tests for ParentStorageAdapter
 *
 * Tests the cross-frame localStorage adapter that enables the chat widget
 * to store conversation data in the parent window's localStorage instead
 * of the iframe's, ensuring data persistence across page navigation.
 *
 * Key functionality tested:
 * 1. Storage operations in iframe context (via postMessage)
 * 2. Storage operations in non-iframe context (direct localStorage)
 * 3. Async getItem() with request/response matching
 * 4. Timeout handling for storage requests
 * 5. Synchronous fallback (getItemSync)
 * 6. Proper cleanup of pending requests
 */

import { ParentStorageAdapter } from '@/lib/chat-widget/parent-storage';

describe('ParentStorageAdapter', () => {
  let adapter: ParentStorageAdapter;
  let originalWindow: Window & typeof globalThis;
  let mockLocalStorage: Storage;
  let mockPostMessage: jest.Mock;
  let mockParentPostMessage: jest.Mock;

  beforeEach(() => {
    // Save original window
    originalWindow = window;

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0,
    };

    // Replace global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock postMessage functions
    mockPostMessage = jest.fn();
    mockParentPostMessage = jest.fn();

    // Mock environment variables
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Non-iframe Context (window.self === window.top)', () => {
    beforeEach(() => {
      // Simulate non-iframe context
      Object.defineProperty(window, 'self', {
        value: window,
        writable: true,
      });
      Object.defineProperty(window, 'top', {
        value: window,
        writable: true,
      });

      adapter = new ParentStorageAdapter();
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
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
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

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      });

      it('should handle localStorage errors gracefully', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
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
    });

    describe('removeItem()', () => {
      it('should remove value from regular localStorage when not in iframe', () => {
        adapter.removeItem('test-key');

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
      });

      it('should handle localStorage errors gracefully', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
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

  describe('Iframe Context (window.self !== window.top)', () => {
    beforeEach(() => {
      // Simulate iframe context
      const mockTop = { ...window };
      Object.defineProperty(window, 'self', {
        value: window,
        writable: true,
      });
      Object.defineProperty(window, 'top', {
        value: mockTop,
        writable: true,
      });

      Object.defineProperty(window, 'parent', {
        value: {
          postMessage: mockParentPostMessage,
        },
        writable: true,
      });

      adapter = new ParentStorageAdapter();
    });

    describe('getItem()', () => {
      it('should request value from parent window via postMessage', async () => {
        // Simulate response from parent
        setTimeout(() => {
          const event = new MessageEvent('message', {
            data: {
              type: 'storageResponse',
              requestId: expect.stringContaining('request_'),
              value: 'parent-value',
            },
          });

          // Extract requestId from the postMessage call
          const callArgs = mockParentPostMessage.mock.calls[0];
          const requestId = callArgs[0].requestId;

          // Create response with actual requestId
          const responseEvent = new MessageEvent('message', {
            data: {
              type: 'storageResponse',
              requestId: requestId,
              value: 'parent-value',
            },
          });

          window.dispatchEvent(responseEvent);
        }, 10);

        const result = await adapter.getItem('test-key');

        expect(result).toBe('parent-value');
        expect(mockParentPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'getFromParentStorage',
            key: 'test-key',
            requestId: expect.stringContaining('request_'),
          }),
          'https://example.com'
        );
      });

      it('should use targetOrigin from env or window.location.origin', async () => {
        process.env.NEXT_PUBLIC_APP_URL = '';

        Object.defineProperty(window, 'location', {
          value: { origin: 'https://fallback.com' },
          writable: true,
        });

        const newAdapter = new ParentStorageAdapter();

        // Don't wait for response, just verify postMessage call
        newAdapter.getItem('test-key');

        // Wait a tick for the postMessage to be called
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockParentPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'getFromParentStorage',
            key: 'test-key',
          }),
          'https://fallback.com'
        );
      });

      it('should timeout after 500ms and return null', async () => {
        jest.useFakeTimers();

        const promise = adapter.getItem('test-key');

        // Fast-forward time by 500ms
        jest.advanceTimersByTime(500);

        const result = await promise;

        expect(result).toBeNull();

        jest.useRealTimers();
      });

      it('should handle multiple concurrent requests with unique requestIds', async () => {
        const key1Promise = adapter.getItem('key1');
        const key2Promise = adapter.getItem('key2');

        // Get the requestIds from postMessage calls
        const call1 = mockParentPostMessage.mock.calls[0][0];
        const call2 = mockParentPostMessage.mock.calls[1][0];

        expect(call1.requestId).not.toBe(call2.requestId);

        // Simulate responses
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            type: 'storageResponse',
            requestId: call1.requestId,
            value: 'value1',
          },
        }));

        window.dispatchEvent(new MessageEvent('message', {
          data: {
            type: 'storageResponse',
            requestId: call2.requestId,
            value: 'value2',
          },
        }));

        const [result1, result2] = await Promise.all([key1Promise, key2Promise]);

        expect(result1).toBe('value1');
        expect(result2).toBe('value2');
      });

      it('should clean up pending requests after response', async () => {
        setTimeout(() => {
          const call = mockParentPostMessage.mock.calls[0][0];
          window.dispatchEvent(new MessageEvent('message', {
            data: {
              type: 'storageResponse',
              requestId: call.requestId,
              value: 'test-value',
            },
          }));
        }, 10);

        await adapter.getItem('test-key');

        // Attempt to send duplicate response
        setTimeout(() => {
          const call = mockParentPostMessage.mock.calls[0][0];
          window.dispatchEvent(new MessageEvent('message', {
            data: {
              type: 'storageResponse',
              requestId: call.requestId,
              value: 'duplicate-value',
            },
          }));
        }, 20);

        // Wait for any potential duplicate handling
        await new Promise(resolve => setTimeout(resolve, 50));

        // No error should be thrown, duplicate should be ignored
        expect(mockParentPostMessage).toHaveBeenCalledTimes(1);
      });

      it('should ignore storage responses with unknown requestIds', async () => {
        const promise = adapter.getItem('test-key');

        // Send response with unknown requestId
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            type: 'storageResponse',
            requestId: 'unknown_request_id',
            value: 'wrong-value',
          },
        }));

        // Send correct response after delay
        setTimeout(() => {
          const call = mockParentPostMessage.mock.calls[0][0];
          window.dispatchEvent(new MessageEvent('message', {
            data: {
              type: 'storageResponse',
              requestId: call.requestId,
              value: 'correct-value',
            },
          }));
        }, 10);

        const result = await promise;

        expect(result).toBe('correct-value');
      });

      it('should handle null values from parent storage', async () => {
        setTimeout(() => {
          const call = mockParentPostMessage.mock.calls[0][0];
          window.dispatchEvent(new MessageEvent('message', {
            data: {
              type: 'storageResponse',
              requestId: call.requestId,
              value: null,
            },
          }));
        }, 10);

        const result = await adapter.getItem('nonexistent-key');

        expect(result).toBeNull();
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

  describe('getItemSync()', () => {
    it('should use regular localStorage regardless of iframe context', () => {
      // Test in non-iframe context
      Object.defineProperty(window, 'self', {
        value: window,
        writable: true,
      });
      Object.defineProperty(window, 'top', {
        value: window,
        writable: true,
      });

      const adapter1 = new ParentStorageAdapter();
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue('sync-value');

      const result1 = adapter1.getItemSync('test-key');

      expect(result1).toBe('sync-value');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');

      // Clear mocks
      jest.clearAllMocks();

      // Test in iframe context
      const mockTop = { ...window };
      Object.defineProperty(window, 'self', {
        value: window,
        writable: true,
      });
      Object.defineProperty(window, 'top', {
        value: mockTop,
        writable: true,
      });

      const adapter2 = new ParentStorageAdapter();
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue('sync-value-iframe');

      const result2 = adapter2.getItemSync('test-key');

      expect(result2).toBe('sync-value-iframe');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully and return null', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
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

  describe('Edge Cases', () => {
    it('should handle rapid consecutive operations', async () => {
      // Simulate iframe context
      const mockTop = { ...window };
      Object.defineProperty(window, 'self', { value: window, writable: true });
      Object.defineProperty(window, 'top', { value: mockTop, writable: true });
      Object.defineProperty(window, 'parent', {
        value: { postMessage: mockParentPostMessage },
        writable: true,
      });

      const adapter = new ParentStorageAdapter();

      // Rapid operations
      adapter.setItem('key1', 'value1');
      adapter.setItem('key2', 'value2');
      adapter.removeItem('key3');

      expect(mockParentPostMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle empty string values', async () => {
      Object.defineProperty(window, 'self', { value: window, writable: true });
      Object.defineProperty(window, 'top', { value: window, writable: true });

      const adapter = new ParentStorageAdapter();

      adapter.setItem('test-key', '');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', '');
    });

    it('should handle special characters in keys and values', async () => {
      Object.defineProperty(window, 'self', { value: window, writable: true });
      Object.defineProperty(window, 'top', { value: window, writable: true });

      const adapter = new ParentStorageAdapter();

      const specialKey = 'key:with:colons/and/slashes';
      const specialValue = 'value with\nnewlines\tand\ttabs';

      adapter.setItem(specialKey, specialValue);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(specialKey, specialValue);
    });
  });

  describe('Message Event Listener', () => {
    it('should only process storageResponse messages', () => {
      // Simulate iframe context
      const mockTop = { ...window };
      Object.defineProperty(window, 'self', { value: window, writable: true });
      Object.defineProperty(window, 'top', { value: mockTop, writable: true });

      const adapter = new ParentStorageAdapter();

      // Send non-storage message
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'otherMessage',
          requestId: 'test',
          value: 'data',
        },
      }));

      // Should not throw or cause issues
      expect(mockParentPostMessage).not.toHaveBeenCalled();
    });

    it('should ignore messages without requestId', () => {
      const mockTop = { ...window };
      Object.defineProperty(window, 'self', { value: window, writable: true });
      Object.defineProperty(window, 'top', { value: mockTop, writable: true });

      const adapter = new ParentStorageAdapter();

      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'storageResponse',
          value: 'data',
        },
      }));

      // Should not cause errors
      expect(mockParentPostMessage).not.toHaveBeenCalled();
    });
  });
});
