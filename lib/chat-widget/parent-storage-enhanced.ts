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
import { CacheManager } from './storage/cache-manager';
import { LocalStorageOperations, FallbackStorageOperations } from './storage/local-storage';
import { RetryHandler } from './storage/retry-handler';
import { MessageQueue } from './storage/message-queue';
import type { QueuedMessage } from './storage/types';

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export class EnhancedParentStorageAdapter {
  private isInIframe: boolean;
  private connectionState: ConnectionState = 'connecting';
  private debug: boolean;

  // Component instances
  private cache: CacheManager;
  private localStorage: LocalStorageOperations;
  private fallbackStorage: FallbackStorageOperations;
  private retryHandler: RetryHandler;
  private messageQueue: MessageQueue;

  // Debounce timers for frequent operations
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_DELAY = 300;

  constructor(retryConfig: RetryConfig = {}, debug: boolean = false) {
    this.isInIframe = window.self !== window.top;
    this.debug = debug || (typeof window !== 'undefined' && (window as any).ChatWidgetDebug);

    // Initialize components
    this.cache = new CacheManager(5000); // 5 second TTL
    this.localStorage = new LocalStorageOperations();
    this.fallbackStorage = new FallbackStorageOperations();
    this.retryHandler = new RetryHandler(retryConfig, 5000, this.debug);
    this.messageQueue = new MessageQueue(100, this.debug);

    if (this.debug) {
      console.log('[EnhancedParentStorageAdapter] Initialized', { isInIframe: this.isInIframe });
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
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      if (this.debug) console.log('[EnhancedParentStorageAdapter] Cache hit for:', key);
      return cached;
    }

    if (!this.isInIframe) return this.localStorage.getItem(key);

    // If disconnected, try fallback
    if (this.connectionState === 'disconnected') {
      if (this.debug) console.warn('[EnhancedParentStorageAdapter] Disconnected, using fallback');
      return this.fallbackStorage.getItem(key);
    }

    // Request from parent with retry
    return this.retryHandler.executeWithRetry(
      key,
      (requestId) => this.sendGetRequest(key, requestId),
      () => this.fallbackStorage.getItem(key)
    );
  }

  /**
   * Set item in storage with debouncing
   */
  setItem(key: string, value: string): void {
    this.cache.set(key, value);

    if (!this.isInIframe) {
      this.localStorage.setItem(key, value);
      return;
    }

    this.debouncedSetItem(key, value);
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    this.cache.delete(key);

    if (!this.isInIframe) {
      this.localStorage.removeItem(key);
      return;
    }

    if (this.connectionState === 'disconnected') {
      this.messageQueue.enqueue({ type: 'removeFromParentStorage', key, timestamp: Date.now() });
      return;
    }

    this.sendMessage({ type: 'removeFromParentStorage', key });
    this.fallbackStorage.removeItem(key);
  }

  /**
   * Get item synchronously (fallback to sessionStorage)
   */
  getItemSync(key: string): string | null {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;

    return this.localStorage.getItem(key) || this.fallbackStorage.getItem(key);
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getQueueSize(): number {
    return this.messageQueue.size();
  }

  destroy(): void {
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.cache.clear();
    window.removeEventListener('message', this.handleMessage);
    connectionMonitor.stop();
  }

  // Private methods

  private handleMessage = (event: MessageEvent): void => {
    if (event.data?.type === 'storageResponse' && event.data?.requestId) {
      this.cache.set(event.data.key, event.data.value);
      this.retryHandler.resolve(event.data.requestId, event.data.value);
    }
  };

  private handleConnectionStateChange(state: ConnectionState, stats: any): void {
    const oldState = this.connectionState;
    this.connectionState = state;

    if (this.debug) {
      console.log(`[EnhancedParentStorageAdapter] Connection: ${oldState} → ${state}`, stats);
    }

    // If reconnected, replay queued messages
    if (state === 'connected' && oldState === 'disconnected') {
      this.messageQueue.replay((msg) => this.sendMessage(msg));
    }
  }

  private sendGetRequest(key: string, requestId: string): void {
    this.sendMessage({ type: 'getFromParentStorage', key, requestId });
  }

  private debouncedSetItem(key: string, value: string): void {
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);

      if (this.connectionState === 'disconnected') {
        this.messageQueue.enqueue({ type: 'saveToParentStorage', key, value, timestamp: Date.now() });
        this.fallbackStorage.setItem(key, value);
        return;
      }

      this.sendMessage({ type: 'saveToParentStorage', key, value });
      this.fallbackStorage.setItem(key, value);
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(key, timer);
  }

  private sendMessage(message: any): void {
    const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    window.parent.postMessage(message, targetOrigin);
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
