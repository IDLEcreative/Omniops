/**
 * Connection Monitor
 *
 * Monitors the connection between iframe and parent window using heartbeat mechanism.
 * Provides connection state tracking, auto-recovery, and event emitters.
 */

export type ConnectionState = 'connected' | 'disconnected' | 'connecting';

export interface ConnectionStats {
  lastPingTime: number | null;
  lastPongTime: number | null;
  failedPings: number;
  totalPings: number;
  averageLatency: number;
}

export type ConnectionListener = (state: ConnectionState, stats: ConnectionStats) => void;

export interface ConnectionMonitorConfig {
  heartbeatInterval?: number; // ms between pings (default: 5000)
  heartbeatTimeout?: number; // ms to wait for pong (default: 2000)
  maxFailedPings?: number; // Max failed pings before disconnect (default: 3)
  autoRecover?: boolean; // Auto-recover when connection restored (default: true)
  debug?: boolean;
}

export class ConnectionMonitor {
  private state: ConnectionState = 'connecting';
  private heartbeatInterval: number;
  private heartbeatTimeout: number;
  private maxFailedPings: number;
  private autoRecover: boolean;
  private debug: boolean;

  private stats: ConnectionStats = {
    lastPingTime: null,
    lastPongTime: null,
    failedPings: 0,
    totalPings: 0,
    averageLatency: 0,
  };

  private listeners: ConnectionListener[] = [];
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pongTimer: NodeJS.Timeout | null = null;
  private latencies: number[] = [];
  private isInIframe: boolean;
  private targetOrigin: string;

  constructor(config: ConnectionMonitorConfig = {}) {
    this.heartbeatInterval = config.heartbeatInterval ?? 5000;
    this.heartbeatTimeout = config.heartbeatTimeout ?? 2000;
    this.maxFailedPings = config.maxFailedPings ?? 3;
    this.autoRecover = config.autoRecover ?? true;
    this.debug = config.debug ?? false;
    this.isInIframe = window.self !== window.top;
    // SECURITY: Get parent origin from referrer or ancestorOrigins
    // In iframe context, document.referrer gives us the parent's URL
    this.targetOrigin = document.referrer ? new URL(document.referrer).origin :
                        (window.location.ancestorOrigins && window.location.ancestorOrigins[0]) || '*';

    if (this.debug) {
      console.log('[ConnectionMonitor] Initialized with config:', {
        heartbeatInterval: this.heartbeatInterval,
        heartbeatTimeout: this.heartbeatTimeout,
        maxFailedPings: this.maxFailedPings,
        autoRecover: this.autoRecover,
        isInIframe: this.isInIframe,
      });
    }
  }

  /**
   * Start monitoring connection
   */
  start(): void {
    if (!this.isInIframe) {
      // Not in iframe, always connected
      this.setState('connected');
      return;
    }

    if (this.debug) {
      console.log('[ConnectionMonitor] Starting heartbeat monitoring');
    }

    // Listen for pong responses
    window.addEventListener('message', this.handleMessage);

    // Start heartbeat
    this.sendPing();
  }

  /**
   * Stop monitoring connection
   */
  stop(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }

    window.removeEventListener('message', this.handleMessage);

    if (this.debug) {
      console.log('[ConnectionMonitor] Stopped');
    }
  }

  /**
   * Add connection state listener
   */
  addListener(listener: ConnectionListener): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Manually trigger connection check
   */
  checkConnection(): void {
    if (!this.isInIframe) {
      this.setState('connected');
      return;
    }

    this.sendPing();
  }

  private handleMessage = (event: MessageEvent): void => {
    if (event.data?.type === 'pong' && event.data?.pingTime) {
      this.handlePong(event.data.pingTime);
    }
  };

  private sendPing(): void {
    if (!this.isInIframe) return;

    const pingTime = Date.now();
    this.stats.lastPingTime = pingTime;
    this.stats.totalPings++;

    if (this.debug) {
      console.log('[ConnectionMonitor] Sending ping', pingTime);
    }

    // Send ping to parent
    window.parent.postMessage(
      {
        type: 'ping',
        pingTime,
      },
      this.targetOrigin
    );

    // Set timeout for pong response
    this.pongTimer = setTimeout(() => {
      this.handlePongTimeout();
    }, this.heartbeatTimeout);

    // Schedule next ping
    this.heartbeatTimer = setTimeout(() => {
      this.sendPing();
    }, this.heartbeatInterval);
  }

  private handlePong(pingTime: number): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }

    const pongTime = Date.now();
    const latency = pongTime - pingTime;

    this.stats.lastPongTime = pongTime;
    this.stats.failedPings = 0;

    // Track latency (keep last 10 measurements)
    this.latencies.push(latency);
    if (this.latencies.length > 10) {
      this.latencies.shift();
    }
    this.stats.averageLatency =
      this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;

    if (this.debug) {
      console.log('[ConnectionMonitor] Received pong, latency:', latency + 'ms');
    }

    // Update state to connected if not already
    if (this.state !== 'connected') {
      this.setState('connected');
    }
  }

  private handlePongTimeout(): void {
    this.stats.failedPings++;

    if (this.debug) {
      console.warn(
        `[ConnectionMonitor] Pong timeout (${this.stats.failedPings}/${this.maxFailedPings})`
      );
    }

    if (this.stats.failedPings >= this.maxFailedPings) {
      this.setState('disconnected');
    }
  }

  private setState(newState: ConnectionState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;

    if (this.debug) {
      console.log(`[ConnectionMonitor] State changed: ${oldState} → ${newState}`);
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(newState, this.getStats());
      } catch (error) {
        console.error('[ConnectionMonitor] Listener error:', error);
      }
    });

    // Auto-recover: if disconnected and auto-recover enabled, try reconnecting
    if (newState === 'disconnected' && this.autoRecover) {
      if (this.debug) {
        console.log('[ConnectionMonitor] Auto-recovery enabled, attempting reconnection');
      }
      // Reset failed pings counter for new attempt
      this.stats.failedPings = 0;
      this.setState('connecting');
    }
  }
}

/**
 * Create singleton instance for iframe (only in browser)
 */
export const connectionMonitor = typeof window !== 'undefined'
  ? new ConnectionMonitor({
      debug: (window as any).ChatWidgetDebug,
    })
  : null;

/**
 * Cleanup connection monitor on page unload to prevent memory leaks
 * This ensures event listeners and timers are properly cleaned up
 */
if (typeof window !== 'undefined' && connectionMonitor) {
  window.addEventListener('beforeunload', () => {
    connectionMonitor.stop();
  });
}
