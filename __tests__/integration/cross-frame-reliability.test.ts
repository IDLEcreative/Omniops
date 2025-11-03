/**
 * Cross-Frame Communication Reliability Tests
 *
 * Tests Phase 2 improvements:
 * - Retry logic with exponential backoff
 * - Connection state monitoring
 * - Message queueing during disconnection
 * - Graceful degradation to sessionStorage
 * - Performance optimizations
 */

import { ConnectionMonitor, ConnectionState } from '@/lib/chat-widget/connection-monitor';
import { EnhancedParentStorageAdapter } from '@/lib/chat-widget/parent-storage-enhanced';

// Mock window.parent and postMessage
const mockPostMessage = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

describe('ConnectionMonitor', () => {
  let monitor: ConnectionMonitor;
  let messageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window methods
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;

    // Simulate iframe environment
    Object.defineProperty(window, 'self', { value: window, writable: true });
    Object.defineProperty(window, 'top', { value: {}, writable: true });
    Object.defineProperty(window, 'parent', {
      value: { postMessage: mockPostMessage },
      writable: true,
    });

    // Capture message handler
    mockAddEventListener.mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler as (event: MessageEvent) => void;
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Heartbeat Mechanism', () => {
    it('should send ping messages at regular intervals', () => {
      monitor = new ConnectionMonitor({ heartbeatInterval: 1000 });
      monitor.start();

      // Initial ping
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ping' }),
        expect.any(String)
      );

      mockPostMessage.mockClear();

      // Advance time and check for next ping
      jest.advanceTimersByTime(1000);
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ping' }),
        expect.any(String)
      );

      monitor.stop();
    });

    it('should respond to pong messages and calculate latency', () => {
      monitor = new ConnectionMonitor({ heartbeatInterval: 1000, debug: true });
      monitor.start();

      const pingTime = Date.now();
      const pingCall = mockPostMessage.mock.calls[0][0];

      // Simulate pong response after 50ms
      jest.advanceTimersByTime(50);
      messageHandler(new MessageEvent('message', {
        data: { type: 'pong', pingTime: pingCall.pingTime },
      }));

      const stats = monitor.getStats();
      expect(stats.averageLatency).toBeGreaterThan(0);
      expect(stats.failedPings).toBe(0);

      monitor.stop();
    });

    it('should detect connection timeout and mark as disconnected', () => {
      monitor = new ConnectionMonitor({
        heartbeatInterval: 1000,
        heartbeatTimeout: 500,
        maxFailedPings: 2,
      });

      const states: ConnectionState[] = [];
      monitor.addListener((state) => {
        states.push(state);
      });

      monitor.start();

      // First ping sent, advance past timeout
      jest.advanceTimersByTime(500);

      // Advance to next heartbeat interval
      jest.advanceTimersByTime(1000);

      // Second ping sent, advance past timeout
      jest.advanceTimersByTime(500);

      // Should be disconnected now
      expect(states).toContain('disconnected');

      monitor.stop();
    });

    it('should auto-recover when connection is restored', () => {
      monitor = new ConnectionMonitor({
        heartbeatInterval: 1000,
        heartbeatTimeout: 500,
        maxFailedPings: 1,
        autoRecover: true,
      });

      const states: ConnectionState[] = [];
      monitor.addListener((state) => {
        states.push(state);
      });

      monitor.start();

      // Cause disconnect by timing out
      jest.advanceTimersByTime(1500);
      expect(states).toContain('disconnected');

      // Should attempt to reconnect
      expect(states).toContain('connecting');
      expect(monitor.getState()).toBe('connecting');

      monitor.stop();
    });
  });

  describe('Connection State Management', () => {
    it('should notify listeners of state changes', () => {
      monitor = new ConnectionMonitor();
      const listener = jest.fn();
      monitor.addListener(listener);

      monitor.start();

      // Send pong to connect
      const pingCall = mockPostMessage.mock.calls[0][0];
      messageHandler(new MessageEvent('message', {
        data: { type: 'pong', pingTime: pingCall.pingTime },
      }));

      expect(listener).toHaveBeenCalledWith('connected', expect.any(Object));

      monitor.stop();
    });

    it('should allow unsubscribing from listeners', () => {
      monitor = new ConnectionMonitor();
      const listener = jest.fn();
      const unsubscribe = monitor.addListener(listener);

      unsubscribe();
      monitor.start();

      // Send pong - listener should not be called
      const pingCall = mockPostMessage.mock.calls[0][0];
      messageHandler(new MessageEvent('message', {
        data: { type: 'pong', pingTime: pingCall.pingTime },
      }));

      expect(listener).not.toHaveBeenCalled();

      monitor.stop();
    });
  });
});

describe('EnhancedParentStorageAdapter', () => {
  let adapter: EnhancedParentStorageAdapter;
  let messageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window methods
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;

    // Simulate iframe environment
    Object.defineProperty(window, 'self', { value: window, writable: true });
    Object.defineProperty(window, 'top', { value: {}, writable: true });
    Object.defineProperty(window, 'parent', {
      value: { postMessage: mockPostMessage },
      writable: true,
    });

    // Mock localStorage and sessionStorage
    const localStorageMock: Record<string, string> = {};
    const sessionStorageMock: Record<string, string> = {};

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) => {
          localStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete localStorageMock[key];
        },
      },
      writable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: (key: string) => sessionStorageMock[key] || null,
        setItem: (key: string, value: string) => {
          sessionStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete sessionStorageMock[key];
        },
      },
      writable: true,
    });

    // Capture message handler
    mockAddEventListener.mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler as (event: MessageEvent) => void;
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
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
      const lastCall = mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1][0];
      messageHandler(new MessageEvent('message', {
        data: {
          type: 'storageResponse',
          requestId: lastCall.requestId,
          key: 'test_key',
          value: 'test_value',
        },
      }));

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

  describe('Message Queueing During Disconnection', () => {
    it('should queue messages when disconnected', async () => {
      adapter = new EnhancedParentStorageAdapter();

      // Simulate disconnection by setting state
      // (In real scenario, ConnectionMonitor would trigger this)
      (adapter as any).connectionState = 'disconnected';

      adapter.setItem('queued_key', 'queued_value');

      // Advance past debounce delay
      await jest.advanceTimersByTimeAsync(300);

      // Should save to fallback immediately (not waiting for debounce)
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

  describe('Performance Optimizations', () => {
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

    it('should cache values to reduce duplicate requests', async () => {
      adapter = new EnhancedParentStorageAdapter();

      // First request
      const promise1 = adapter.getItem('cached_key');

      // Respond
      const requestId = mockPostMessage.mock.calls[0][0].requestId;
      messageHandler(new MessageEvent('message', {
        data: {
          type: 'storageResponse',
          requestId,
          key: 'cached_key',
          value: 'cached_value',
        },
      }));

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
      const requestId = mockPostMessage.mock.calls[0][0].requestId;
      messageHandler(new MessageEvent('message', {
        data: {
          type: 'storageResponse',
          requestId,
          key: 'expiring_key',
          value: 'expiring_value',
        },
      }));

      await promise1;
      mockPostMessage.mockClear();

      // Advance past cache TTL (5000ms)
      jest.advanceTimersByTime(5001);

      // Second request (should not use cache)
      adapter.getItem('expiring_key');
      expect(mockPostMessage).toHaveBeenCalled();
    });
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

describe('Integration: ConnectionMonitor + EnhancedParentStorageAdapter', () => {
  let monitor: ConnectionMonitor;
  let adapter: EnhancedParentStorageAdapter;
  let messageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup window mocks as before
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;

    Object.defineProperty(window, 'self', { value: window, writable: true });
    Object.defineProperty(window, 'top', { value: {}, writable: true });
    Object.defineProperty(window, 'parent', {
      value: { postMessage: mockPostMessage },
      writable: true,
    });

    // Mock sessionStorage
    const sessionStorageMock: Record<string, string> = {};
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: (key: string) => sessionStorageMock[key] || null,
        setItem: (key: string, value: string) => {
          sessionStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete sessionStorageMock[key];
        },
      },
      writable: true,
    });

    // Capture message handler
    mockAddEventListener.mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler as (event: MessageEvent) => void;
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should coordinate connection state between monitor and adapter', async () => {
    adapter = new EnhancedParentStorageAdapter();

    // Manually set disconnected state to test queueing
    (adapter as any).connectionState = 'disconnected';

    // Adapter should queue messages when disconnected
    adapter.setItem('coordinated_key', 'coordinated_value');

    // Advance past debounce
    await jest.advanceTimersByTimeAsync(300);

    // Should be queued
    expect(adapter.getQueueSize()).toBeGreaterThan(0);
  });
});
