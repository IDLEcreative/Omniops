import { EventEmitter } from 'events';
import Redis from 'ioredis';

// Import types and constants
export * from './rate-limiter-enhanced-types';
import {
  RateLimitConfig,
  RateLimitResponse,
  RequestMetrics,
  QueuedRequest,
  CircuitBreakerState,
  BackoffState,
  TokenBucket,
  DomainLimit,
  DEFAULT_CONFIG,
  USER_AGENTS,
} from './rate-limiter-enhanced-types';

// Import storage implementations
import { InMemoryTokenBucket, RedisTokenBucket } from './rate-limiter-enhanced-storage';

// Import strategies
import {
  CircuitBreakerManager,
  BackoffStrategy,
  UserAgentRotation,
  HeaderBuilder,
  DomainConfigManager,
} from './rate-limiter-enhanced-strategies';

// Import analytics
import {
  SlidingWindowAnalytics,
  RequestQueueManager,
  RedisMetricsStorage,
  StatisticsCalculator,
  AdaptiveThrottlingManager,
} from './rate-limiter-enhanced-analytics';

/**
 * Enhanced Rate Limiter with sophisticated features for web scraping
 */
export class EnhancedRateLimiter extends EventEmitter {
  private config: RateLimitConfig;
  private redis: Redis | null = null;

  // Storage
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private backoffState: Map<string, BackoffState> = new Map();
  private userAgentIndex: Map<string, number> = new Map();

  // Strategy managers
  private circuitBreakerManager: CircuitBreakerManager;
  private backoffStrategy: BackoffStrategy;
  private userAgentRotation: UserAgentRotation;
  private headerBuilder: HeaderBuilder;
  private domainConfigManager: DomainConfigManager;

  // Analytics managers
  private slidingWindow: SlidingWindowAnalytics;
  private requestQueueManager: RequestQueueManager;
  private redisMetrics: RedisMetricsStorage;
  private statsCalculator: StatisticsCalculator;
  private adaptiveThrottling: AdaptiveThrottlingManager;

  private cleanupInterval?: NodeJS.Timeout;

  constructor(config?: Partial<RateLimitConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize managers
    this.circuitBreakerManager = new CircuitBreakerManager(this.config);
    this.backoffStrategy = new BackoffStrategy(this.config);
    this.userAgentRotation = new UserAgentRotation();
    this.headerBuilder = new HeaderBuilder();
    this.domainConfigManager = new DomainConfigManager(this.config);
    this.slidingWindow = new SlidingWindowAnalytics();
    this.requestQueueManager = new RequestQueueManager();
    this.redisMetrics = new RedisMetricsStorage(null);
    this.statsCalculator = new StatisticsCalculator();
    this.adaptiveThrottling = new AdaptiveThrottlingManager(this.config);

    if (this.config.useRedis && this.config.redisUrl) {
      this.initializeRedis();
    }

    this.startCleanupInterval();
  }

  private initializeRedis() {
    try {
      this.redis = new Redis(this.config.redisUrl!, {
        retryStrategy: (times) => Math.min(times * 100, 10000),
        maxRetriesPerRequest: 3,
      });

      this.redis.on('error', (err) => {
        console.error('Redis error in rate limiter:', err);
        this.emit('redis-error', err);
      });

      this.redis.on('connect', () => {
        console.log('Rate limiter connected to Redis');
        this.emit('redis-connected');
      });

      this.redisMetrics = new RedisMetricsStorage(this.redis);
    } catch (error) {
      console.error('Failed to initialize Redis for rate limiter:', error);
    }
  }

  /**
   * Check if a request is allowed and get rate limit information
   */
  async checkRateLimit(domain: string, options?: {
    priority?: 'high' | 'normal' | 'low';
    retryCount?: number;
  }): Promise<RateLimitResponse> {
    const circuitBreaker = this.circuitBreakerManager.getCircuitBreaker(domain, this.circuitBreakers);
    if (circuitBreaker.state === 'open') {
      return {
        allowed: false,
        waitTimeMs: Math.max(0, circuitBreaker.nextRetryTime - Date.now()),
        tokensRemaining: 0,
        resetTime: circuitBreaker.nextRetryTime,
        reason: 'Circuit breaker open',
      };
    }
    const domainConfig = this.domainConfigManager.getDomainConfig(domain);
    const bucket = await this.getTokenBucket(domain, domainConfig);
    const tokensAvailable = await bucket.tryConsume(1);

    if (!tokensAvailable) {
      let waitTime = bucket.getWaitTime();
      if (this.config.enableExponentialBackoff && options?.retryCount) {
        waitTime = this.backoffStrategy.calculateBackoff(domain, options.retryCount, this.backoffState);
      }
      if (this.config.jitterEnabled) {
        waitTime += this.backoffStrategy.addJitter();
      }
      if (options?.priority === 'high') {
        await this.requestQueueManager.queueRequest(domain, { timestamp: Date.now(), priority: options.priority });
      }
      const tokens = await Promise.resolve(bucket.getTokens());
      return {
        allowed: false,
        waitTimeMs: waitTime,
        tokensRemaining: tokens,
        resetTime: Date.now() + waitTime,
        reason: 'Rate limit exceeded',
      };
    }

    const tokensRemaining = await Promise.resolve(bucket.getTokens());
    const response: RateLimitResponse = {
      allowed: true,
      waitTimeMs: this.config.randomizeTimings ? this.backoffStrategy.getRandomDelay(domainConfig) : 0,
      tokensRemaining,
      resetTime: bucket.getResetTime(),
    };
    if (this.config.rotateUserAgents) {
      response.userAgent = this.userAgentRotation.getNextUserAgent(domain, domainConfig, USER_AGENTS, this.userAgentIndex);
    }
    if (domainConfig.customHeaders) {
      response.headers = this.headerBuilder.getRequestHeaders(domainConfig);
    }
    return response;
  }

  /**
   * Report request result for adaptive throttling
   */
  async reportRequestResult(metrics: RequestMetrics): Promise<void> {
    this.slidingWindow.updateSlidingWindow(metrics.domain, metrics);
    if (metrics.success) {
      this.circuitBreakerManager.recordSuccess(metrics.domain, this.circuitBreakers);
    } else {
      this.circuitBreakerManager.recordFailure(metrics.domain, metrics.statusCode, this.circuitBreakers);
    }
    if (this.config.adaptiveThrottling) {
      const result = await this.adaptiveThrottling.adaptThrottling(
        metrics,
        this.tokenBuckets.get(metrics.domain),
        this.backoffState
      );
      if (result.newRate) {
        this.emit('throttle-adjusted', { domain: metrics.domain, newRate: result.newRate, reason: result.reason });
      }
    }
    await this.redisMetrics.storeMetrics(metrics);
  }

  /**
   * Get or create token bucket for domain
   */
  private async getTokenBucket(domain: string, config: DomainLimit): Promise<TokenBucket> {
    if (this.redis) {
      return new RedisTokenBucket(this.redis, domain, config.requestsPerSecond, config.burstSize);
    }
    let bucket = this.tokenBuckets.get(domain);
    if (!bucket) {
      bucket = new InMemoryTokenBucket(config.requestsPerSecond, config.burstSize);
      this.tokenBuckets.set(domain, bucket);
    }
    return bucket;
  }

  /**
   * Process queued requests for a domain
   */
  async processQueue(domain: string): Promise<QueuedRequest[]> {
    const processed: QueuedRequest[] = [];
    while (true) {
      const request = this.requestQueueManager.dequeue(domain);
      if (!request) break;
      const result = await this.checkRateLimit(domain);
      if (!result.allowed) {
        await this.requestQueueManager.queueRequest(domain, request);
        break;
      }
      processed.push(request);
    }
    return processed;
  }

  /**
   * Get statistics for a domain
   */
  getStatistics(domain: string): {
    requestsPerMinute: number;
    averageResponseTime: number;
    successRate: number;
    currentRate: number;
    circuitBreakerState: string;
  } {
    return this.statsCalculator.getStatistics(
      domain,
      this.slidingWindow,
      this.tokenBuckets,
      this.circuitBreakers,
      this.config
    );
  }

  /**
   * Start cleanup interval for memory management
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      this.slidingWindow.cleanup(fiveMinutesAgo);

      Array.from(this.circuitBreakers.entries()).forEach(([domain, breaker]) => {
        if (breaker.state === 'closed' && breaker.lastFailureTime < fiveMinutesAgo) {
          this.circuitBreakers.delete(domain);
        }
      });

      Array.from(this.tokenBuckets.entries()).forEach(([domain, bucket]) => {
        if (bucket instanceof InMemoryTokenBucket && bucket.getLastUsed() < fiveMinutesAgo) {
          this.tokenBuckets.delete(domain);
        }
      });

      this.requestQueueManager.cleanup();
    }, 60000);
  }

  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    if (this.redis) await this.redis.quit();
    this.tokenBuckets.clear();
    this.circuitBreakers.clear();
    this.backoffState.clear();
    this.userAgentIndex.clear();
    this.slidingWindow.clear();
    this.requestQueueManager.clear();
  }
}

// Export factory function for easy creation
export function createRateLimiter(config?: Partial<RateLimitConfig>): EnhancedRateLimiter {
  return new EnhancedRateLimiter(config);
}
