/**
 * EnhancedParentStorageAdapter Tests - Core Features
 * Tests retry logic, connection state, and graceful degradation
 */

import { EnhancedParentStorageAdapter } from '@/lib/chat-widget/parent-storage-enhanced';
import {
  setupWindowMocks,
  teardownWindowMocks,
  mockPostMessage,
  mockRemoveEventListener,
  mockAddEventListener,
  getLastPostMessageCall,
  createStorageResponseMessage,
} from '@/__tests__/utils/cross-frame';

describe('EnhancedParentStorageAdapter', () => {
  let adapter: EnhancedParentStorageAdapter;
  let messageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    messageHandler = setupWindowMocks();
  });

  afterEach(() => {
    teardownWindowMocks();
  });

  describe('Retry Logic with Exponential Backoff', () => {
    it('should retry failed requests with exponential backoff', async () => {
      adapter = new EnhancedParentStorageAdapter({
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
      });

      // Start request
      const promise = adapter.getItem('test_key');

      // Let first request timeout (5000ms)
      await jest.advanceTimersByTimeAsync(5000);

      // Should retry after 100ms
      await jest.advanceTimersByTimeAsync(100);

      // Let second request timeout
      await jest.advanceTimersByTimeAsync(5000);

      // Should retry after 200ms (exponential backoff)
      await jest.advanceTimersByTimeAsync(200);

      // Respond on third attempt
      const lastCall = getLastPostMessageCall();
      messageHandler(createStorageResponseMessage(
        lastCall.requestId,
        'test_key',
        'test_value'
      ));

      const result = await promise;
      expect(result).toBe('test_value');
    });

    it('should fallback to sessionStorage after all retries fail', async () => {
      adapter = new EnhancedParentStorageAdapter({
        maxAttempts: 2,
        initialDelay: 100,
      });

      // Set fallback value
      window.sessionStorage.setItem('test_key', 'fallback_value');

      // Start request
      const promise = adapter.getItem('test_key');

      // Let all attempts timeout with backoff
      await jest.advanceTimersByTimeAsync(5000 + 100); // First attempt + backoff
      await jest.advanceTimersByTimeAsync(5000); // Second attempt timeout

      const result = await promise;
      expect(result).toBe('fallback_value');
    }, 10000); // Increase test timeout
  });

  describe('Graceful Degradation', () => {
    it('should use localStorage when not in iframe', async () => {
      // Simulate not in iframe
      Object.defineProperty(window, 'top', { value: window, writable: true });

      adapter = new EnhancedParentStorageAdapter();

      window.localStorage.setItem('local_key', 'local_value');

      const result = await adapter.getItem('local_key');
      expect(result).toBe('local_value');

      // Should not send postMessage
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', async () => {
      // Simulate not in iframe
      Object.defineProperty(window, 'top', { value: window, writable: true });

      // Mock localStorage failure
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('localStorage unavailable');
          },
        },
        writable: true,
      });

      adapter = new EnhancedParentStorageAdapter();

      const result = await adapter.getItem('error_key');
      expect(result).toBe(null); // Should return null instead of throwing
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      adapter = new EnhancedParentStorageAdapter();

      // Create some state
      adapter.setItem('cleanup_key', 'cleanup_value');

      // Destroy
      adapter.destroy();

      // Should remove event listener
      expect(mockRemoveEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });
});
