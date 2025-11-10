/**
 * Retry Handler
 *
 * Handles request retry logic with exponential backoff.
 */

import type { RetryConfig, PendingRequest } from './types';

export class RetryHandler {
  private requestCounter = 0;
  private pendingRequests = new Map<string, PendingRequest>();
  private retryConfig: Required<RetryConfig>;
  private readonly requestTimeout: number;
  private debug: boolean;

  constructor(retryConfig: RetryConfig = {}, requestTimeout: number = 5000, debug: boolean = false) {
    this.retryConfig = {
      maxAttempts: retryConfig.maxAttempts ?? 3,
      initialDelay: retryConfig.initialDelay ?? 100,
      maxDelay: retryConfig.maxDelay ?? 2000,
      backoffMultiplier: retryConfig.backoffMultiplier ?? 2,
    };
    this.requestTimeout = requestTimeout;
    this.debug = debug;
  }

  /**
   * Execute request with retry logic
   */
  async executeWithRetry(
    key: string,
    sendFn: (requestId: string) => void,
    fallbackFn: () => string | null
  ): Promise<string | null> {
    for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
      const requestId = `request_${++this.requestCounter}_${Date.now()}`;

      try {
        const value = await this.sendRequest(key, requestId, attempt, sendFn);
        return value;
      } catch (error) {
        if (this.debug) {
          console.warn(
            `[RetryHandler] Request failed (attempt ${attempt + 1}/${this.retryConfig.maxAttempts}):`,
            error
          );
        }

        // Last attempt failed
        if (attempt === this.retryConfig.maxAttempts - 1) {
          console.error('[RetryHandler] All retry attempts failed, using fallback');
          return fallbackFn();
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return fallbackFn();
  }

  /**
   * Send a single request
   */
  private sendRequest(
    key: string,
    requestId: string,
    attempt: number,
    sendFn: (requestId: string) => void
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        attempts: attempt,
        lastAttempt: Date.now(),
      });

      // Send request
      sendFn(requestId);

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, this.requestTimeout);
    });
  }

  /**
   * Resolve pending request
   */
  resolve(requestId: string, value: string | null): boolean {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      pending.resolve(value);
      this.pendingRequests.delete(requestId);

      if (this.debug) {
        console.log('[RetryHandler] Resolved request:', requestId);
      }
      return true;
    }
    return false;
  }

  /**
   * Get pending requests count
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}
