// Types and Interfaces for Enhanced Rate Limiter

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

export interface QueuedRequest {
  timestamp: number;
  priority?: 'high' | 'normal' | 'low';
  metadata?: any;
}

export interface BackoffState {
  currentBackoff: number;
  consecutiveFailures: number;
}

export interface RobotsTxtRules {
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
  expiresAt: number;
}

/**
 * Token Bucket interface
 */
export interface TokenBucket {
  tryConsume(tokens: number): Promise<boolean>;
  getTokens(): number | Promise<number>;
  getWaitTime(): number;
  getResetTime(): number;
  adjustRate(multiplier: number): void;
  getRate(): number;
  getLastUsed(): number;
}

// User agent pool for rotation
export const USER_AGENTS = [
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
export const DEFAULT_CONFIG: RateLimitConfig = {
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
