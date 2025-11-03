/**
 * Enhanced Parent Storage Adapter
 *
 * Provides reliable localStorage functionality across iframe boundaries with:
 * - Retry logic with exponential backoff
 * - Connection state monitoring
 * - Message queueing during disconnection
 * - Graceful degradation to sessionStorage
 * - Performance optimizations (debouncing, batching, caching)
 */

import { connectionMonitor, ConnectionState } from './connection-monitor';

export interface RetryConfig {
  maxAttempts?: number; // Max retry attempts (default: 3)
  initialDelay?: number; // Initial delay in ms (default: 100)
  maxDelay?: number; // Max delay in ms (default: 2000)
  backoffMultiplier?: number; // Multiplier for exponential backoff (default: 2)
}

interface QueuedMessage {
  type: string;
  key: string;
  value?: string;
  requestId?: string;
  timestamp: number;
}

interface PendingRequest {
  resolve: (value: string | null) => void;
  attempts: number;
  lastAttempt: number;
}

export class EnhancedParentStorageAdapter {
  private isInIframe: boolean;
  private requestCounter = 0;
  private pendingRequests = new Map<string, PendingRequest>();
  private messageQueue: QueuedMessage[] = [];
  private cache = new Map<string, { value: string | null; timestamp: number }>();
  private retryConfig: Required<RetryConfig>;
  private connectionState: ConnectionState = 'connecting';
  private debug: boolean;

  // Debounce timers for frequent operations
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  // Performance settings
  private readonly CACHE_TTL = 5000; // 5 seconds cache
  private readonly DEBOUNCE_DELAY = 300; // 300ms debounce for setItem
  private readonly REQUEST_TIMEOUT = 5000; // 5 second timeout for requests

  constructor(retryConfig: RetryConfig = {}, debug: boolean = false) {
    this.isInIframe = window.self !== window.top;
    this.debug = debug || (typeof window !== 'undefined' && (window as any).ChatWidgetDebug);

    this.retryConfig = {
      maxAttempts: retryConfig.maxAttempts ?? 3,
      initialDelay: retryConfig.initialDelay ?? 100,
      maxDelay: retryConfig.maxDelay ?? 2000,
      backoffMultiplier: retryConfig.backoffMultiplier ?? 2,
    };

    if (this.debug) {
      console.log('[EnhancedParentStorageAdapter] Initialized with config:', {
        isInIframe: this.isInIframe,
        retryConfig: this.retryConfig,
      });
    }

    // Listen for storage responses from parent
    if (this.isInIframe) {
      window.addEventListener('message', this.handleMessage);

      // Monitor connection state
      connectionMonitor.addListener((state, stats) => {
        this.handleConnectionStateChange(state, stats);
      });

      // Start connection monitoring
      connectionMonitor.start();
    }
  }

  /**
   * Get item from storage with retry logic and caching
   */
  async getItem(key: string): Promise<string | null> {
    // Check cache first
    const cached = this.getCachedValue(key);
    if (cached !== undefined) {
      if (this.debug) {
        console.log('[EnhancedParentStorageAdapter] Cache hit for:', key);
      }
      return cached;
    }

    if (!this.isInIframe) {
      // Not in iframe, use regular localStorage
      return this.getFromLocalStorage(key);
    }

    // If disconnected, try sessionStorage fallback
    if (this.connectionState === 'disconnected') {
      if (this.debug) {
        console.warn('[EnhancedParentStorageAdapter] Disconnected, using fallback for:', key);
      }
      return this.getFallbackValue(key);
    }

    // In iframe, request from parent with retry
    return this.requestWithRetry(key);
  }

  /**
   * Set item in storage with debouncing
   */
  setItem(key: string, value: string): void {
    // Update cache immediately
    this.setCachedValue(key, value);

    if (!this.isInIframe) {
      // Not in iframe, use regular localStorage
      this.setToLocalStorage(key, value);
      return;
    }

    // Debounce frequent updates
    this.debouncedSetItem(key, value);
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    // Clear from cache
    this.cache.delete(key);

    if (!this.isInIframe) {
      // Not in iframe, use regular localStorage
      this.removeFromLocalStorage(key);
      return;
    }

    // If disconnected, queue the message
    if (this.connectionState === 'disconnected') {
      this.queueMessage({
        type: 'removeFromParentStorage',
        key,
        timestamp: Date.now(),
      });
      return;
    }

    // In iframe, send to parent
    const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    window.parent.postMessage(
      {
        type: 'removeFromParentStorage',
        key,
      },
      targetOrigin
    );

    // Also remove from fallback
    this.removeFromFallback(key);
  }

  /**
   * Get item synchronously (fallback to sessionStorage)
   */
  getItemSync(key: string): string | null {
    // Try cache first
    const cached = this.getCachedValue(key);
    if (cached !== undefined) {
      return cached;
    }

    // Try localStorage
    try {
      return localStorage.getItem(key);
    } catch (error) {
      // Fallback to sessionStorage
      try {
        return sessionStorage.getItem(key);
      } catch (fallbackError) {
        console.error('[EnhancedParentStorageAdapter] All sync storage methods failed:', error);
        return null;
      }
    }
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get queue size (for monitoring)
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    // Clear cache
    this.cache.clear();

    // Remove event listener
    window.removeEventListener('message', this.handleMessage);

    // Stop connection monitoring
    connectionMonitor.stop();
  }

  // Private methods

  private handleMessage = (event: MessageEvent): void => {
    if (event.data?.type === 'storageResponse' && event.data?.requestId) {
      const pending = this.pendingRequests.get(event.data.requestId);
      if (pending) {
        // Cache the value
        this.setCachedValue(event.data.key, event.data.value);

        // Resolve the promise
        pending.resolve(event.data.value);
        this.pendingRequests.delete(event.data.requestId);

        if (this.debug) {
          console.log('[EnhancedParentStorageAdapter] Resolved request:', event.data.requestId);
        }
      }
    }
  };

  private handleConnectionStateChange(state: ConnectionState, stats: any): void {
    const oldState = this.connectionState;
    this.connectionState = state;

    if (this.debug) {
      console.log(
        `[EnhancedParentStorageAdapter] Connection state: ${oldState} → ${state}`,
        stats
      );
    }

    // If reconnected, replay queued messages
    if (state === 'connected' && oldState === 'disconnected') {
      this.replayQueuedMessages();
    }
  }

  private async requestWithRetry(key: string): Promise<string | null> {
    for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
      const requestId = `request_${++this.requestCounter}_${Date.now()}`;

      try {
        const value = await this.sendRequest(key, requestId, attempt);
        return value;
      } catch (error) {
        if (this.debug) {
          console.warn(
            `[EnhancedParentStorageAdapter] Request failed (attempt ${attempt + 1}/${this.retryConfig.maxAttempts}):`,
            error
          );
        }

        // Last attempt failed
        if (attempt === this.retryConfig.maxAttempts - 1) {
          console.error(
            '[EnhancedParentStorageAdapter] All retry attempts failed, using fallback'
          );
          return this.getFallbackValue(key);
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return this.getFallbackValue(key);
  }

  private sendRequest(key: string, requestId: string, attempt: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        attempts: attempt,
        lastAttempt: Date.now(),
      });

      // Send request to parent
      const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      window.parent.postMessage(
        {
          type: 'getFromParentStorage',
          key,
          requestId,
        },
        targetOrigin
      );

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, this.REQUEST_TIMEOUT);
    });
  }

  private debouncedSetItem(key: string, value: string): void {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);

      // If disconnected, queue the message
      if (this.connectionState === 'disconnected') {
        this.queueMessage({
          type: 'saveToParentStorage',
          key,
          value,
          timestamp: Date.now(),
        });
        // Save to fallback immediately
        this.setToFallback(key, value);
        return;
      }

      // Send to parent
      const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      window.parent.postMessage(
        {
          type: 'saveToParentStorage',
          key,
          value,
        },
        targetOrigin
      );

      // Also save to fallback for redundancy
      this.setToFallback(key, value);
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(key, timer);
  }

  private queueMessage(message: QueuedMessage): void {
    this.messageQueue.push(message);

    if (this.debug) {
      console.log('[EnhancedParentStorageAdapter] Queued message:', message.type, message.key);
    }

    // Prevent queue from growing too large (keep last 100 messages)
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  private replayQueuedMessages(): void {
    if (this.messageQueue.length === 0) return;

    if (this.debug) {
      console.log('[EnhancedParentStorageAdapter] Replaying queued messages:', this.messageQueue.length);
    }

    const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    // Replay all queued messages
    this.messageQueue.forEach((message) => {
      window.parent.postMessage(message, targetOrigin);
    });

    // Clear queue
    this.messageQueue = [];
  }

  private getCachedValue(key: string): string | null | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.value;
  }

  private setCachedValue(key: string, value: string | null): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  private getFromLocalStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[EnhancedParentStorageAdapter] localStorage.getItem failed:', error);
      return null;
    }
  }

  private setToLocalStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[EnhancedParentStorageAdapter] localStorage.setItem failed:', error);
    }
  }

  private removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[EnhancedParentStorageAdapter] localStorage.removeItem failed:', error);
    }
  }

  private getFallbackValue(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('[EnhancedParentStorageAdapter] sessionStorage.getItem failed:', error);
      return null;
    }
  }

  private setToFallback(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('[EnhancedParentStorageAdapter] sessionStorage.setItem failed:', error);
    }
  }

  private removeFromFallback(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('[EnhancedParentStorageAdapter] sessionStorage.removeItem failed:', error);
    }
  }
}

// Create singleton instance (only in browser)
export const enhancedParentStorage = typeof window !== 'undefined'
  ? new EnhancedParentStorageAdapter()
  : ({
      getItem: async () => null,
      setItem: () => {},
      removeItem: () => {},
      getItemSync: () => null,
      getConnectionState: () => 'disconnected' as const,
      getQueueSize: () => 0,
      destroy: () => {},
    } as any as EnhancedParentStorageAdapter);
