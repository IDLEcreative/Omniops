// Analytics and monitoring for Enhanced Rate Limiter
import Redis from 'ioredis';
import type {
  RequestMetrics,
  QueuedRequest,
  RateLimitConfig,
  TokenBucket,
  BackoffState,
  CircuitBreakerState,
} from './rate-limiter-enhanced-types';

/**
 * Sliding Window Analytics
 */
export class SlidingWindowAnalytics {
  private slidingWindow: Map<string, RequestMetrics[]> = new Map();

  updateSlidingWindow(domain: string, metrics: RequestMetrics): void {
    let window = this.slidingWindow.get(domain);
    if (!window) {
      window = [];
      this.slidingWindow.set(domain, window);
    }

    window.push(metrics);

    // Keep only last 5 minutes of data
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    window = window.filter((m) => m.timestamp > fiveMinutesAgo);
    this.slidingWindow.set(domain, window);
  }

  cleanup(fiveMinutesAgo: number): void {
    Array.from(this.slidingWindow.entries()).forEach(([domain, window]) => {
      const filtered = window.filter((m) => m.timestamp > fiveMinutesAgo);
      if (filtered.length === 0) {
        this.slidingWindow.delete(domain);
      } else {
        this.slidingWindow.set(domain, filtered);
      }
    });
  }

  getWindow(domain: string): RequestMetrics[] {
    return this.slidingWindow.get(domain) || [];
  }

  clear(): void {
    this.slidingWindow.clear();
  }
}

/**
 * Request Queue Manager
 */
export class RequestQueueManager {
  private requestQueue: Map<string, QueuedRequest[]> = new Map();

  async queueRequest(domain: string, request: QueuedRequest): Promise<number> {
    let queue = this.requestQueue.get(domain);
    if (!queue) {
      queue = [];
      this.requestQueue.set(domain, queue);
    }

    queue.push(request);

    // Sort by priority and timestamp
    queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal'];
      }
      return a.timestamp - b.timestamp;
    });

    // Limit queue size to prevent memory issues
    if (queue.length > 1000) {
      queue = queue.slice(0, 1000);
      this.requestQueue.set(domain, queue);
    }

    return queue.length;
  }

  getQueue(domain: string): QueuedRequest[] {
    return this.requestQueue.get(domain) || [];
  }

  dequeue(domain: string): QueuedRequest | undefined {
    const queue = this.requestQueue.get(domain);
    if (!queue || queue.length === 0) {
      return undefined;
    }

    const request = queue.shift();

    if (queue.length === 0) {
      this.requestQueue.delete(domain);
    }

    return request;
  }

  cleanup(): void {
    Array.from(this.requestQueue.entries()).forEach(([domain, queue]) => {
      if (queue.length === 0) {
        this.requestQueue.delete(domain);
      }
    });
  }

  clear(): void {
    this.requestQueue.clear();
  }
}

/**
 * Redis Metrics Storage
 */
export class RedisMetricsStorage {
  constructor(private redis: Redis | null) {}

  async storeMetrics(metrics: RequestMetrics): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `metrics:${metrics.domain}:${Date.now()}`;
      await this.redis.setex(key, 300, JSON.stringify(metrics)); // 5 minute TTL

      // Update aggregated statistics
      const statsKey = `stats:${metrics.domain}`;
      await this.redis.hincrby(statsKey, 'total_requests', 1);

      if (metrics.success) {
        await this.redis.hincrby(statsKey, 'successful_requests', 1);
      } else {
        await this.redis.hincrby(statsKey, 'failed_requests', 1);
      }

      // Set TTL on stats key
      await this.redis.expire(statsKey, 3600); // 1 hour TTL
    } catch (error) {
      console.error('Failed to store metrics in Redis:', error);
    }
  }
}

/**
 * Statistics Calculator
 */
export class StatisticsCalculator {
  getStatistics(
    domain: string,
    slidingWindow: SlidingWindowAnalytics,
    tokenBuckets: Map<string, TokenBucket>,
    circuitBreakers: Map<string, CircuitBreakerState>,
    config: RateLimitConfig
  ): {
    requestsPerMinute: number;
    averageResponseTime: number;
    successRate: number;
    currentRate: number;
    circuitBreakerState: string;
  } {
    const window = slidingWindow.getWindow(domain);
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = window.filter((m) => m.timestamp > oneMinuteAgo);

    const bucket = tokenBuckets.get(domain);
    const breaker = circuitBreakers.get(domain);

    return {
      requestsPerMinute: recentRequests.length,
      averageResponseTime:
        recentRequests.length > 0
          ? recentRequests.reduce((sum, m) => sum + m.responseTime, 0) / recentRequests.length
          : 0,
      successRate:
        recentRequests.length > 0
          ? recentRequests.filter((m) => m.success).length / recentRequests.length
          : 1,
      currentRate: bucket?.getRate() || config.requestsPerSecond,
      circuitBreakerState: breaker?.state || 'closed',
    };
  }
}

/**
 * Adaptive Throttling Manager
 */
export class AdaptiveThrottlingManager {
  constructor(private config: RateLimitConfig) {}

  async adaptThrottling(
    metrics: RequestMetrics,
    tokenBucket: TokenBucket | undefined,
    backoffState: Map<string, BackoffState>
  ): Promise<{ newRate?: number; reason?: string }> {
    if (!tokenBucket) {
      return {};
    }

    // Slow down on rate limit responses
    if (this.config.throttleOnStatusCodes.includes(metrics.statusCode)) {
      // Reduce rate by 50%
      tokenBucket.adjustRate(0.5);

      // Increase backoff
      const backoff = backoffState.get(metrics.domain) || {
        currentBackoff: this.config.initialBackoffMs,
        consecutiveFailures: 0,
      };
      backoff.consecutiveFailures++;
      backoff.currentBackoff = Math.min(
        backoff.currentBackoff * this.config.backoffMultiplier,
        this.config.maxBackoffMs
      );
      backoffState.set(metrics.domain, backoff);

      return {
        newRate: tokenBucket.getRate(),
        reason: `Status code ${metrics.statusCode}`,
      };
    }
    // Speed up on successful responses
    else if (metrics.success && metrics.responseTime < 1000) {
      // Gradually increase rate
      tokenBucket.adjustRate(1.1);

      // Reset backoff on success
      backoffState.delete(metrics.domain);

      return {
        newRate: tokenBucket.getRate(),
        reason: 'Fast successful response',
      };
    }

    return {};
  }
}
