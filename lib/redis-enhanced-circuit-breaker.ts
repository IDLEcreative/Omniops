/**
 * Circuit breaker functionality for Redis connection management
 * Extracted from redis-enhanced.ts for better modularity
 */

import type Redis from 'ioredis';
import { EventEmitter } from 'events';

export class RedisCircuitBreaker extends EventEmitter {
  private circuitBreakerOpen: boolean = false;
  private circuitBreakerOpenTime: number = 0;
  private circuitBreakerTimeout: number = 30000; // 30 seconds
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;

  constructor(
    private redis: Redis | null,
    private isConnected: boolean,
    private reconnectCallback: () => void
  ) {
    super();
  }

  openCircuitBreaker() {
    this.circuitBreakerOpen = true;
    this.circuitBreakerOpenTime = Date.now();
    console.warn('Redis circuit breaker opened - using fallback storage');

    setTimeout(() => {
      this.checkCircuitBreaker();
    }, this.circuitBreakerTimeout);
  }

  closeCircuitBreaker() {
    this.circuitBreakerOpen = false;
    console.log('Redis circuit breaker closed');
  }

  checkCircuitBreaker() {
    if (this.circuitBreakerOpen &&
      Date.now() - this.circuitBreakerOpenTime > this.circuitBreakerTimeout) {
      console.log('Attempting to close circuit breaker...');
      this.connectionAttempts = 0;
      this.reconnectCallback();
    }
  }

  incrementAttempts() {
    this.connectionAttempts++;
  }

  resetAttempts() {
    this.connectionAttempts = 0;
  }

  shouldStopRetrying(times: number): boolean {
    return times > this.maxConnectionAttempts;
  }

  isCircuitBreakerOpen(): boolean {
    return this.circuitBreakerOpen;
  }

  getAttempts(): number {
    return this.connectionAttempts;
  }
}
