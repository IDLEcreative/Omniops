/**
 * EnhancedParentStorageAdapter Tests - Advanced Features
 * Tests message queueing, caching, and performance optimizations
 */

import { EnhancedParentStorageAdapter } from '@/lib/chat-widget/parent-storage-enhanced';
import {
  setupWindowMocks,
  teardownWindowMocks,
  mockPostMessage,
  getLastPostMessageCall,
  createStorageResponseMessage,
} from '@/__tests__/utils/cross-frame';

describe('EnhancedParentStorageAdapter - Advanced Features', () => {
  let adapter: EnhancedParentStorageAdapter;
  let messageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    messageHandler = setupWindowMocks();
  });

  afterEach(() => {
    teardownWindowMocks();
  });

  describe('Message Queueing During Disconnection', () => {
    it('should queue messages when disconnected', async () => {
      adapter = new EnhancedParentStorageAdapter();

      // Simulate disconnection
      (adapter as any).connectionState = 'disconnected';

      adapter.setItem('queued_key', 'queued_value');

      // Advance past debounce delay
      await jest.advanceTimersByTimeAsync(300);

      // Should save to fallback immediately
      expect(window.sessionStorage.getItem('queued_key')).toBe('queued_value');

      // Check queue size
      expect(adapter.getQueueSize()).toBe(1);
    });

    it('should replay queued messages when reconnected', async () => {
      adapter = new EnhancedParentStorageAdapter();

      // Queue messages while disconnected
      (adapter as any).connectionState = 'disconnected';
      adapter.setItem('key1', 'value1');
      adapter.setItem('key2', 'value2');

      // Advance past debounce to queue the messages
      await jest.advanceTimersByTimeAsync(300);

      expect(adapter.getQueueSize()).toBe(2);

      // Simulate reconnection
      (adapter as any).handleConnectionStateChange('connected', {});

      // Messages should be replayed
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'saveToParentStorage', key: 'key1' }),
        expect.any(String)
      );
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'saveToParentStorage', key: 'key2' }),
        expect.any(String)
      );

      expect(adapter.getQueueSize()).toBe(0);
    });
  });

  describe('Performance Optimizations - Debouncing', () => {
    it('should debounce frequent setItem calls', () => {
      adapter = new EnhancedParentStorageAdapter();

      // Multiple rapid calls
      adapter.setItem('debounced_key', 'value1');
      adapter.setItem('debounced_key', 'value2');
      adapter.setItem('debounced_key', 'value3');

      // Should not send immediately
      expect(mockPostMessage).not.toHaveBeenCalled();

      // Advance past debounce delay
      jest.advanceTimersByTime(300);

      // Should send only once with last value
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'debounced_key', value: 'value3' }),
        expect.any(String)
      );
    });
  });

  describe('Performance Optimizations - Caching', () => {
    it('should cache values to reduce duplicate requests', async () => {
      adapter = new EnhancedParentStorageAdapter();

      // First request
      const promise1 = adapter.getItem('cached_key');

      // Respond
      const requestId = getLastPostMessageCall().requestId;
      messageHandler(createStorageResponseMessage(
        requestId,
        'cached_key',
        'cached_value'
      ));

      await promise1;
      mockPostMessage.mockClear();

      // Second request (should use cache)
      const promise2 = adapter.getItem('cached_key');
      const result = await promise2;

      expect(result).toBe('cached_value');
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('should expire cache after TTL', async () => {
      adapter = new EnhancedParentStorageAdapter();

      // First request
      const promise1 = adapter.getItem('expiring_key');

      // Respond
      const requestId = getLastPostMessageCall().requestId;
      messageHandler(createStorageResponseMessage(
        requestId,
        'expiring_key',
        'expiring_value'
      ));

      await promise1;
      mockPostMessage.mockClear();

      // Advance past cache TTL (5000ms)
      jest.advanceTimersByTime(5001);

      // Second request (should not use cache)
      adapter.getItem('expiring_key');
      expect(mockPostMessage).toHaveBeenCalled();
    });
  });
});
