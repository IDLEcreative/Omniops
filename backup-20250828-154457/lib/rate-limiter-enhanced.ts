import { EventEmitter } from 'events';
import Redis from 'ioredis';
import crypto from 'crypto';

// Types and Interfaces
export interface RateLimitConfig {
  // Basic configuration
  requestsPerSecond: number;
  burstSize: number;
  
  // Per-domain configuration
  domainLimits?: Map<string, DomainLimit>;
  
  // Adaptive throttling
  adaptiveThrottling: boolean;
  throttleOnStatusCodes: number[];
  
  // Circuit breaker
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  
  // Exponential backoff
  enableExponentialBackoff: boolean;
  initialBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
  
  // Jitter
  jitterEnabled: boolean;
  jitterRangeMs: number;
  
  // Anti-detection
  randomizeTimings: boolean;
  respectRobotsTxt: boolean;
  rotateUserAgents: boolean;
  
  // Redis configuration
  useRedis: boolean;
  redisUrl?: string;
}

export interface DomainLimit {
  requestsPerSecond: number;
  burstSize: number;
  priority: 'high' | 'normal' | 'low';
  customHeaders?: Record<string, string>;
  customUserAgents?: string[];
  minDelay?: number;
  maxDelay?: number;
}

export interface RateLimitResponse {
  allowed: boolean;
  waitTimeMs: number;
  tokensRemaining: number;
  resetTime: number;
  reason?: string;
  headers?: Record<string, string>;
  userAgent?: string;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  successCount: number;
  lastFailureTime: number;
  nextRetryTime: number;
}

export interface RequestMetrics {
  domain: string;
  timestamp: number;
  responseTime: number;
  statusCode: number;
  success: boolean;
  retryCount: number;
}

// User agent pool for rotation
const USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  
  // Chrome on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
  
  // Firefox on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15) Gecko/20100101 Firefox/120.0',
  
  // Safari on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  
  // Mobile Chrome Android
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  
  // Mobile Safari iOS
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
];

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  requestsPerSecond: 10,
  burstSize: 20,
  adaptiveThrottling: true,
  throttleOnStatusCodes: [429, 503, 509],
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,
  enableExponentialBackoff: true,
  initialBackoffMs: 1000,
  maxBackoffMs: 60000,
  backoffMultiplier: 2,
  jitterEnabled: true,
  jitterRangeMs: 500,
  randomizeTimings: true,
  respectRobotsTxt: true,
  rotateUserAgents: true,
  useRedis: false,
};

/**
 * Enhanced Rate Limiter with sophisticated features for web scraping
 */
export class EnhancedRateLimiter extends EventEmitter {
  private config: RateLimitConfig;
  private redis: Redis | null = null;
  
  // Token buckets per domain
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  
  // Circuit breakers per domain
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  
  // Request queue
  private requestQueue: Map<string, QueuedRequest[]> = new Map();
  
  // Sliding window for tracking request history
  private slidingWindow: Map<string, RequestMetrics[]> = new Map();
  
  // Backoff state per domain
  private backoffState: Map<string, BackoffState> = new Map();
  
  // User agent rotation state
  private userAgentIndex: Map<string, number> = new Map();
  
  // Robots.txt cache
  private robotsTxtCache: Map<string, RobotsTxtRules> = new Map();
  
  constructor(config?: Partial<RateLimitConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.useRedis && this.config.redisUrl) {
      this.initializeRedis();
    }
    
    // Start cleanup interval
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
    // Check circuit breaker first
    const circuitBreaker = this.getCircuitBreaker(domain);
    if (circuitBreaker.state === 'open') {
      const waitTime = Math.max(0, circuitBreaker.nextRetryTime - Date.now());
      return {
        allowed: false,
        waitTimeMs: waitTime,
        tokensRemaining: 0,
        resetTime: circuitBreaker.nextRetryTime,
        reason: 'Circuit breaker open',
      };
    }
    
    // Get domain-specific configuration
    const domainConfig = this.getDomainConfig(domain);
    
    // Get or create token bucket
    const bucket = await this.getTokenBucket(domain, domainConfig);
    
    // Check if tokens are available
    const tokensAvailable = await bucket.tryConsume(1);
    
    if (!tokensAvailable) {
      // Calculate wait time with jitter
      let waitTime = bucket.getWaitTime();
      
      // Apply exponential backoff if enabled
      if (this.config.enableExponentialBackoff && options?.retryCount) {
        waitTime = this.calculateBackoff(domain, options.retryCount);
      }
      
      // Add jitter
      if (this.config.jitterEnabled) {
        waitTime += this.addJitter();
      }
      
      // Queue the request if priority is high
      if (options?.priority === 'high') {
        await this.queueRequest(domain, { 
          timestamp: Date.now(),
          priority: options.priority,
        });
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
    
    // Request is allowed
    const tokensRemaining = await Promise.resolve(bucket.getTokens());
    const response: RateLimitResponse = {
      allowed: true,
      waitTimeMs: 0,
      tokensRemaining,
      resetTime: bucket.getResetTime(),
    };
    
    // Add randomized delay for anti-detection
    if (this.config.randomizeTimings) {
      response.waitTimeMs = this.getRandomDelay(domainConfig);
    }
    
    // Rotate user agent if enabled
    if (this.config.rotateUserAgents) {
      response.userAgent = this.getNextUserAgent(domain, domainConfig);
    }
    
    // Add custom headers if specified
    if (domainConfig.customHeaders) {
      response.headers = this.getRequestHeaders(domainConfig);
    }
    
    return response;
  }
  
  /**
   * Report request result for adaptive throttling
   */
  async reportRequestResult(metrics: RequestMetrics): Promise<void> {
    // Update sliding window
    this.updateSlidingWindow(metrics.domain, metrics);
    
    // Update circuit breaker
    if (metrics.success) {
      this.recordSuccess(metrics.domain);
    } else {
      this.recordFailure(metrics.domain, metrics.statusCode);
    }
    
    // Adaptive throttling based on response
    if (this.config.adaptiveThrottling) {
      await this.adaptThrottling(metrics);
    }
    
    // Store metrics in Redis if available
    if (this.redis) {
      await this.storeMetricsInRedis(metrics);
    }
  }
  
  /**
   * Adapt throttling based on response metrics
   */
  private async adaptThrottling(metrics: RequestMetrics): Promise<void> {
    const bucket = this.tokenBuckets.get(metrics.domain);
    if (!bucket) return;
    
    // Slow down on rate limit responses
    if (this.config.throttleOnStatusCodes.includes(metrics.statusCode)) {
      // Reduce rate by 50%
      bucket.adjustRate(0.5);
      
      // Increase backoff
      const backoff = this.backoffState.get(metrics.domain) || { 
        currentBackoff: this.config.initialBackoffMs,
        consecutiveFailures: 0,
      };
      
      backoff.consecutiveFailures++;
      backoff.currentBackoff = Math.min(
        backoff.currentBackoff * this.config.backoffMultiplier,
        this.config.maxBackoffMs
      );
      
      this.backoffState.set(metrics.domain, backoff);
      
      this.emit('throttle-adjusted', {
        domain: metrics.domain,
        newRate: bucket.getRate(),
        reason: `Status code ${metrics.statusCode}`,
      });
    } 
    // Speed up on successful responses
    else if (metrics.success && metrics.responseTime < 1000) {
      // Gradually increase rate
      bucket.adjustRate(1.1);
      
      // Reset backoff on success
      this.backoffState.delete(metrics.domain);
    }
  }
  
  /**
   * Get domain-specific configuration
   */
  private getDomainConfig(domain: string): DomainLimit {
    // Check for specific domain configuration
    const specificConfig = this.config.domainLimits?.get(domain);
    if (specificConfig) {
      return specificConfig;
    }
    
    // Check for wildcard domain configuration
    for (const [pattern, config] of this.config.domainLimits || []) {
      if (this.matchDomain(domain, pattern)) {
        return config;
      }
    }
    
    // Return default configuration
    return {
      requestsPerSecond: this.config.requestsPerSecond,
      burstSize: this.config.burstSize,
      priority: 'normal',
      minDelay: 100,
      maxDelay: 2000,
    };
  }
  
  /**
   * Match domain against pattern (supports wildcards)
   */
  private matchDomain(domain: string, pattern: string): boolean {
    if (pattern === domain) return true;
    
    // Support wildcard patterns like *.example.com
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return domain.endsWith(suffix);
    }
    
    return false;
  }
  
  /**
   * Get or create token bucket for domain
   */
  private async getTokenBucket(domain: string, config: DomainLimit): Promise<TokenBucket> {
    if (this.redis) {
      // Use Redis-backed token bucket for distributed rate limiting
      return new RedisTokenBucket(
        this.redis,
        domain,
        config.requestsPerSecond,
        config.burstSize
      );
    }
    
    // Use in-memory token bucket
    let bucket = this.tokenBuckets.get(domain);
    if (!bucket) {
      bucket = new InMemoryTokenBucket(
        config.requestsPerSecond,
        config.burstSize
      );
      this.tokenBuckets.set(domain, bucket);
    }
    
    return bucket;
  }
  
  /**
   * Get circuit breaker for domain
   */
  private getCircuitBreaker(domain: string): CircuitBreakerState {
    let breaker = this.circuitBreakers.get(domain);
    if (!breaker) {
      breaker = {
        state: 'closed',
        failures: 0,
        successCount: 0,
        lastFailureTime: 0,
        nextRetryTime: 0,
      };
      this.circuitBreakers.set(domain, breaker);
    }
    
    // Check if circuit breaker should transition to half-open
    if (breaker.state === 'open' && Date.now() >= breaker.nextRetryTime) {
      breaker.state = 'half-open';
      breaker.successCount = 0;
      this.emit('circuit-breaker-half-open', { domain });
    }
    
    return breaker;
  }
  
  /**
   * Record successful request
   */
  private recordSuccess(domain: string): void {
    const breaker = this.getCircuitBreaker(domain);
    
    if (breaker.state === 'half-open') {
      breaker.successCount++;
      
      // Close circuit breaker after 3 successful requests
      if (breaker.successCount >= 3) {
        breaker.state = 'closed';
        breaker.failures = 0;
        this.emit('circuit-breaker-closed', { domain });
      }
    } else if (breaker.state === 'closed') {
      // Reset failure count on success
      breaker.failures = 0;
    }
  }
  
  /**
   * Record failed request
   */
  private recordFailure(domain: string, statusCode: number): void {
    const breaker = this.getCircuitBreaker(domain);
    
    // Don't count client errors as failures (except 429)
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      return;
    }
    
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    
    // Open circuit breaker if threshold exceeded
    if (breaker.failures >= this.config.circuitBreakerThreshold) {
      breaker.state = 'open';
      breaker.nextRetryTime = Date.now() + this.config.circuitBreakerTimeout;
      
      this.emit('circuit-breaker-open', { 
        domain,
        failures: breaker.failures,
        nextRetryTime: breaker.nextRetryTime,
      });
    }
    
    // If in half-open state, immediately re-open
    if (breaker.state === 'half-open') {
      breaker.state = 'open';
      breaker.nextRetryTime = Date.now() + this.config.circuitBreakerTimeout;
    }
  }
  
  /**
   * Calculate exponential backoff with jitter
   */
  private calculateBackoff(domain: string, retryCount: number): number {
    const backoff = this.backoffState.get(domain) || {
      currentBackoff: this.config.initialBackoffMs,
      consecutiveFailures: retryCount,
    };
    
    const baseDelay = Math.min(
      this.config.initialBackoffMs * Math.pow(this.config.backoffMultiplier, retryCount),
      this.config.maxBackoffMs
    );
    
    // Add jitter to prevent thundering herd
    const jitter = this.config.jitterEnabled ? this.addJitter() : 0;
    
    return baseDelay + jitter;
  }
  
  /**
   * Add random jitter to timing
   */
  private addJitter(): number {
    return Math.random() * this.config.jitterRangeMs;
  }
  
  /**
   * Get randomized delay for anti-detection
   */
  private getRandomDelay(config: DomainLimit): number {
    const min = config.minDelay || 100;
    const max = config.maxDelay || 2000;
    
    // Use a more natural distribution (not uniform)
    // This simulates human-like timing patterns
    const random = Math.random();
    const skewed = Math.pow(random, 2); // Bias towards lower values
    
    return min + (max - min) * skewed;
  }
  
  /**
   * Get next user agent for rotation
   */
  private getNextUserAgent(domain: string, config: DomainLimit): string {
    // Use custom user agents if provided
    const agents = config.customUserAgents || USER_AGENTS;
    
    // Get current index for domain
    let index = this.userAgentIndex.get(domain) || 0;
    
    // Get user agent
    const userAgent = agents[index % agents.length];
    
    // Update index for next request
    // Add some randomness to rotation pattern
    if (Math.random() < 0.7) {
      index++;
    } else {
      // Sometimes skip ahead to be less predictable
      index += Math.floor(Math.random() * 3) + 1;
    }
    
    this.userAgentIndex.set(domain, index);
    
    return userAgent || USER_AGENTS[0] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }
  
  /**
   * Get request headers with anti-detection measures
   */
  private getRequestHeaders(config: DomainLimit): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
    
    // Add random cache control header
    if (Math.random() < 0.3) {
      headers['Cache-Control'] = 'no-cache';
    }
    
    // Add random referer (sometimes)
    if (Math.random() < 0.4) {
      headers['Referer'] = 'https://www.google.com/';
    }
    
    // Merge with custom headers
    return { ...headers, ...config.customHeaders };
  }
  
  /**
   * Queue a request for later processing
   */
  private async queueRequest(domain: string, request: QueuedRequest): Promise<void> {
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
    
    this.emit('request-queued', { domain, queueSize: queue.length });
  }
  
  /**
   * Process queued requests for a domain
   */
  async processQueue(domain: string): Promise<QueuedRequest[]> {
    const queue = this.requestQueue.get(domain) || [];
    const processed: QueuedRequest[] = [];
    
    while (queue.length > 0) {
      const result = await this.checkRateLimit(domain);
      if (!result.allowed) {
        break;
      }
      
      const request = queue.shift();
      if (request) {
        processed.push(request);
      }
    }
    
    if (queue.length === 0) {
      this.requestQueue.delete(domain);
    }
    
    return processed;
  }
  
  /**
   * Update sliding window with new metrics
   */
  private updateSlidingWindow(domain: string, metrics: RequestMetrics): void {
    let window = this.slidingWindow.get(domain);
    if (!window) {
      window = [];
      this.slidingWindow.set(domain, window);
    }
    
    window.push(metrics);
    
    // Keep only last 5 minutes of data
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    window = window.filter(m => m.timestamp > fiveMinutesAgo);
    this.slidingWindow.set(domain, window);
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
    const window = this.slidingWindow.get(domain) || [];
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = window.filter(m => m.timestamp > oneMinuteAgo);
    
    const bucket = this.tokenBuckets.get(domain);
    const breaker = this.getCircuitBreaker(domain);
    
    return {
      requestsPerMinute: recentRequests.length,
      averageResponseTime: recentRequests.length > 0
        ? recentRequests.reduce((sum, m) => sum + m.responseTime, 0) / recentRequests.length
        : 0,
      successRate: recentRequests.length > 0
        ? recentRequests.filter(m => m.success).length / recentRequests.length
        : 1,
      currentRate: bucket?.getRate() || this.config.requestsPerSecond,
      circuitBreakerState: breaker.state,
    };
  }
  
  /**
   * Store metrics in Redis for distributed tracking
   */
  private async storeMetricsInRedis(metrics: RequestMetrics): Promise<void> {
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
  
  /**
   * Check robots.txt for a domain
   */
  async checkRobotsTxt(url: string): Promise<boolean> {
    if (!this.config.respectRobotsTxt) {
      return true;
    }
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Check cache
      const cached = this.robotsTxtCache.get(domain);
      if (cached && cached.expiresAt > Date.now()) {
        return this.isAllowedByRobots(urlObj.pathname, cached);
      }
      
      // Fetch robots.txt (this would need actual implementation)
      // For now, return true
      return true;
    } catch (error) {
      console.error('Error checking robots.txt:', error);
      return true; // Allow on error
    }
  }
  
  /**
   * Check if path is allowed by robots.txt rules
   */
  private isAllowedByRobots(path: string, rules: RobotsTxtRules): boolean {
    // Check disallow rules
    for (const disallowedPath of rules.disallow) {
      if (path.startsWith(disallowedPath)) {
        return false;
      }
    }
    
    // Check allow rules (override disallow)
    for (const allowedPath of rules.allow) {
      if (path.startsWith(allowedPath)) {
        return true;
      }
    }
    
    return true;
  }
  
  /**
   * Start cleanup interval for memory management
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      // Clean up sliding windows
      for (const [domain, window] of this.slidingWindow.entries()) {
        const filtered = window.filter(m => m.timestamp > fiveMinutesAgo);
        if (filtered.length === 0) {
          this.slidingWindow.delete(domain);
        } else {
          this.slidingWindow.set(domain, filtered);
        }
      }
      
      // Clean up old circuit breakers
      for (const [domain, breaker] of this.circuitBreakers.entries()) {
        if (breaker.state === 'closed' && 
            breaker.lastFailureTime < fiveMinutesAgo) {
          this.circuitBreakers.delete(domain);
        }
      }
      
      // Clean up old token buckets
      for (const [domain, bucket] of this.tokenBuckets.entries()) {
        if (bucket instanceof InMemoryTokenBucket && 
            bucket.getLastUsed() < fiveMinutesAgo) {
          this.tokenBuckets.delete(domain);
        }
      }
      
      // Clean up empty queues
      for (const [domain, queue] of this.requestQueue.entries()) {
        if (queue.length === 0) {
          this.requestQueue.delete(domain);
        }
      }
      
    }, 60000); // Run every minute
  }
  
  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    
    this.tokenBuckets.clear();
    this.circuitBreakers.clear();
    this.requestQueue.clear();
    this.slidingWindow.clear();
    this.backoffState.clear();
    this.userAgentIndex.clear();
    this.robotsTxtCache.clear();
  }
}

/**
 * Token Bucket interface
 */
interface TokenBucket {
  tryConsume(tokens: number): Promise<boolean>;
  getTokens(): number | Promise<number>;
  getWaitTime(): number;
  getResetTime(): number;
  adjustRate(multiplier: number): void;
  getRate(): number;
  getLastUsed(): number;
}

/**
 * In-memory token bucket implementation
 */
class InMemoryTokenBucket implements TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private lastUsed: number;
  
  constructor(
    private ratePerSecond: number,
    private capacity: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
    this.lastUsed = Date.now();
  }
  
  async tryConsume(tokensToConsume: number): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= tokensToConsume) {
      this.tokens -= tokensToConsume;
      this.lastUsed = Date.now();
      return true;
    }
    
    return false;
  }
  
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.ratePerSecond;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  getTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
  
  getWaitTime(): number {
    if (this.tokens >= 1) {
      return 0;
    }
    
    const tokensNeeded = 1 - this.tokens;
    const secondsToWait = tokensNeeded / this.ratePerSecond;
    
    return Math.ceil(secondsToWait * 1000);
  }
  
  getResetTime(): number {
    const tokensNeeded = this.capacity - this.tokens;
    const secondsToReset = tokensNeeded / this.ratePerSecond;
    
    return Date.now() + Math.ceil(secondsToReset * 1000);
  }
  
  adjustRate(multiplier: number): void {
    this.ratePerSecond = Math.max(0.1, this.ratePerSecond * multiplier);
  }
  
  getRate(): number {
    return this.ratePerSecond;
  }
  
  getLastUsed(): number {
    return this.lastUsed;
  }
}

/**
 * Redis-backed token bucket for distributed rate limiting
 */
class RedisTokenBucket implements TokenBucket {
  private lastUsed: number = Date.now();
  
  constructor(
    private redis: Redis,
    private key: string,
    private ratePerSecond: number,
    private capacity: number
  ) {}
  
  async tryConsume(tokensToConsume: number): Promise<boolean> {
    const now = Date.now();
    const script = `
      local key = KEYS[1]
      local rate = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local requested = tonumber(ARGV[4])
      
      local bucket = redis.call('hmget', key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or capacity
      local last_refill = tonumber(bucket[2]) or now
      
      -- Refill tokens
      local time_passed = (now - last_refill) / 1000
      local tokens_to_add = time_passed * rate
      tokens = math.min(capacity, tokens + tokens_to_add)
      
      -- Try to consume
      if tokens >= requested then
        tokens = tokens - requested
        redis.call('hmset', key, 'tokens', tokens, 'last_refill', now)
        redis.call('expire', key, 300)
        return 1
      else
        redis.call('hmset', key, 'tokens', tokens, 'last_refill', now)
        redis.call('expire', key, 300)
        return 0
      end
    `;
    
    try {
      const result = await this.redis.eval(
        script,
        1,
        this.key,
        this.ratePerSecond,
        this.capacity,
        now,
        tokensToConsume
      );
      
      this.lastUsed = now;
      return result === 1;
    } catch (error) {
      console.error('Redis token bucket error:', error);
      return false;
    }
  }
  
  async getTokens(): Promise<number> {
    try {
      const bucket = await this.redis.hmget(this.key, 'tokens');
      return parseInt(bucket[0] || String(this.capacity));
    } catch {
      return 0;
    }
  }
  
  getWaitTime(): number {
    // Simplified calculation
    return Math.ceil(1000 / this.ratePerSecond);
  }
  
  getResetTime(): number {
    return Date.now() + (this.capacity / this.ratePerSecond) * 1000;
  }
  
  adjustRate(multiplier: number): void {
    this.ratePerSecond = Math.max(0.1, this.ratePerSecond * multiplier);
  }
  
  getRate(): number {
    return this.ratePerSecond;
  }
  
  getLastUsed(): number {
    return this.lastUsed;
  }
}

// Supporting interfaces
interface QueuedRequest {
  timestamp: number;
  priority?: 'high' | 'normal' | 'low';
  metadata?: any;
}

interface BackoffState {
  currentBackoff: number;
  consecutiveFailures: number;
}

interface RobotsTxtRules {
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
  expiresAt: number;
}

// Export factory function for easy creation
export function createRateLimiter(config?: Partial<RateLimitConfig>): EnhancedRateLimiter {
  return new EnhancedRateLimiter(config);
}

// Export preset configurations
export const RateLimiterPresets = {
  // Conservative: Slow and careful
  conservative: {
    requestsPerSecond: 1,
    burstSize: 5,
    adaptiveThrottling: true,
    circuitBreakerThreshold: 3,
    enableExponentialBackoff: true,
    jitterEnabled: true,
    randomizeTimings: true,
    rotateUserAgents: true,
  },
  
  // Moderate: Balanced approach
  moderate: {
    requestsPerSecond: 5,
    burstSize: 15,
    adaptiveThrottling: true,
    circuitBreakerThreshold: 5,
    enableExponentialBackoff: true,
    jitterEnabled: true,
    randomizeTimings: true,
    rotateUserAgents: true,
  },
  
  // Aggressive: Fast but risky
  aggressive: {
    requestsPerSecond: 20,
    burstSize: 50,
    adaptiveThrottling: true,
    circuitBreakerThreshold: 10,
    enableExponentialBackoff: false,
    jitterEnabled: false,
    randomizeTimings: false,
    rotateUserAgents: true,
  },
  
  // Stealth: Maximum anti-detection
  stealth: {
    requestsPerSecond: 0.5,
    burstSize: 3,
    adaptiveThrottling: true,
    circuitBreakerThreshold: 2,
    enableExponentialBackoff: true,
    initialBackoffMs: 5000,
    maxBackoffMs: 120000,
    jitterEnabled: true,
    jitterRangeMs: 2000,
    randomizeTimings: true,
    respectRobotsTxt: true,
    rotateUserAgents: true,
  },
} as const;

// Example usage documentation
export const RateLimiterExamples = {
  // Basic usage
  basic: `
    const limiter = new EnhancedRateLimiter();
    
    const result = await limiter.checkRateLimit('example.com');
    if (result.allowed) {
      // Make request with suggested headers and user agent
      const response = await fetch(url, {
        headers: result.headers,
        'User-Agent': result.userAgent,
      });
      
      // Report result for adaptive throttling
      await limiter.reportRequestResult({
        domain: 'example.com',
        timestamp: Date.now(),
        responseTime: response.time,
        statusCode: response.status,
        success: response.ok,
        retryCount: 0,
      });
    } else {
      // Wait before retrying
      await sleep(result.waitTimeMs);
    }
  `,
  
  // With domain-specific limits
  domainSpecific: `
    const limiter = new EnhancedRateLimiter({
      domainLimits: new Map([
        ['api.github.com', {
          requestsPerSecond: 10,
          burstSize: 30,
          priority: 'high',
          customHeaders: {
            'Authorization': 'Bearer token',
          },
        }],
        ['*.googleapis.com', {
          requestsPerSecond: 100,
          burstSize: 200,
          priority: 'high',
        }],
      ]),
    });
  `,
  
  // With Redis for distributed systems
  distributed: `
    const limiter = new EnhancedRateLimiter({
      useRedis: true,
      redisUrl: process.env.REDIS_URL,
      requestsPerSecond: 10,
      burstSize: 20,
    });
    
    // Rate limits are now shared across all instances
  `,
  
  // Integration with scraper
  scraperIntegration: `
    // In scraper-api.ts
    const rateLimiter = new EnhancedRateLimiter(RateLimiterPresets.moderate);
    
    // Before making request
    const rateLimit = await rateLimiter.checkRateLimit(domain, {
      priority: 'normal',
      retryCount: attempt,
    });
    
    if (!rateLimit.allowed) {
      if (rateLimit.reason === 'Circuit breaker open') {
        throw new Error('Too many failures, circuit breaker open');
      }
      await sleep(rateLimit.waitTimeMs);
      return retry();
    }
    
    // Apply delay for anti-detection
    if (rateLimit.waitTimeMs > 0) {
      await sleep(rateLimit.waitTimeMs);
    }
    
    // Make request with rotation
    const page = await browser.newPage();
    await page.setUserAgent(rateLimit.userAgent);
    await page.setExtraHTTPHeaders(rateLimit.headers);
  `,
};