// Rate limiting strategies and algorithms for Enhanced Rate Limiter
import type {
  RateLimitConfig,
  DomainLimit,
  CircuitBreakerState,
  BackoffState,
  RobotsTxtRules,
} from './rate-limiter-enhanced-types';

/**
 * Circuit Breaker Management
 */
export class CircuitBreakerManager {
  constructor(private config: RateLimitConfig) {}

  getCircuitBreaker(
    domain: string,
    breakers: Map<string, CircuitBreakerState>
  ): CircuitBreakerState {
    let breaker = breakers.get(domain);
    if (!breaker) {
      breaker = {
        state: 'closed',
        failures: 0,
        successCount: 0,
        lastFailureTime: 0,
        nextRetryTime: 0,
      };
      breakers.set(domain, breaker);
    }

    // Check if circuit breaker should transition to half-open
    if (breaker.state === 'open' && Date.now() >= breaker.nextRetryTime) {
      breaker.state = 'half-open';
      breaker.successCount = 0;
    }

    return breaker;
  }

  recordSuccess(domain: string, breakers: Map<string, CircuitBreakerState>): void {
    const breaker = this.getCircuitBreaker(domain, breakers);

    if (breaker.state === 'half-open') {
      breaker.successCount++;

      // Close circuit breaker after 3 successful requests
      if (breaker.successCount >= 3) {
        breaker.state = 'closed';
        breaker.failures = 0;
      }
    } else if (breaker.state === 'closed') {
      // Reset failure count on success
      breaker.failures = 0;
    }
  }

  recordFailure(
    domain: string,
    statusCode: number,
    breakers: Map<string, CircuitBreakerState>
  ): void {
    const breaker = this.getCircuitBreaker(domain, breakers);

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
    }

    // If in half-open state, immediately re-open
    if (breaker.state === 'half-open') {
      breaker.state = 'open';
      breaker.nextRetryTime = Date.now() + this.config.circuitBreakerTimeout;
    }
  }
}

/**
 * Backoff Strategy Manager
 */
export class BackoffStrategy {
  constructor(private config: RateLimitConfig) {}

  calculateBackoff(domain: string, retryCount: number, backoffState: Map<string, BackoffState>): number {
    const backoff = backoffState.get(domain) || {
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

  addJitter(): number {
    return Math.random() * this.config.jitterRangeMs;
  }

  getRandomDelay(config: DomainLimit): number {
    const min = config.minDelay || 100;
    const max = config.maxDelay || 2000;

    // Use a more natural distribution (not uniform)
    // This simulates human-like timing patterns
    const random = Math.random();
    const skewed = Math.pow(random, 2); // Bias towards lower values

    return min + (max - min) * skewed;
  }
}

/**
 * User Agent Rotation Manager
 */
export class UserAgentRotation {
  getNextUserAgent(
    domain: string,
    config: DomainLimit,
    userAgents: string[],
    userAgentIndex: Map<string, number>
  ): string {
    // Use custom user agents if provided
    const agents = config.customUserAgents || userAgents;

    // Get current index for domain
    let index = userAgentIndex.get(domain) || 0;

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

    userAgentIndex.set(domain, index);

    return userAgent || agents[0] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }
}

/**
 * Request Header Builder
 */
export class HeaderBuilder {
  getRequestHeaders(config: DomainLimit): Record<string, string> {
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
}

/**
 * Domain Configuration Manager
 */
export class DomainConfigManager {
  constructor(private config: RateLimitConfig) {}

  getDomainConfig(domain: string): DomainLimit {
    // Check for specific domain configuration
    const specificConfig = this.config.domainLimits?.get(domain);
    if (specificConfig) {
      return specificConfig;
    }

    // Check for wildcard domain configuration
    if (this.config.domainLimits) {
      const entries = Array.from(this.config.domainLimits.entries());
      for (const [pattern, config] of entries) {
        if (this.matchDomain(domain, pattern)) {
          return config;
        }
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

  private matchDomain(domain: string, pattern: string): boolean {
    if (pattern === domain) return true;

    // Support wildcard patterns like *.example.com
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return domain.endsWith(suffix);
    }

    return false;
  }
}


/**
 * Robots.txt Checker
 */
export class RobotsTxtChecker {
  constructor(private config: RateLimitConfig) {}

  async checkRobotsTxt(url: string, robotsTxtCache: Map<string, RobotsTxtRules>): Promise<boolean> {
    if (!this.config.respectRobotsTxt) {
      return true;
    }

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check cache
      const cached = robotsTxtCache.get(domain);
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
}
