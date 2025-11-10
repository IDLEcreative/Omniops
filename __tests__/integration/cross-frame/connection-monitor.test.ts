/**
 * ConnectionMonitor Tests
 * Tests Phase 2 improvements for heartbeat mechanism and connection state management
 */

import { ConnectionMonitor, ConnectionState } from '@/lib/chat-widget/connection-monitor';
import {
  setupWindowMocks,
  teardownWindowMocks,
  mockPostMessage,
  mockAddEventListener,
} from '@/__tests__/utils/cross-frame';

describe('ConnectionMonitor', () => {
  let monitor: ConnectionMonitor;
  let messageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    messageHandler = setupWindowMocks();
  });

  afterEach(() => {
    teardownWindowMocks();
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
