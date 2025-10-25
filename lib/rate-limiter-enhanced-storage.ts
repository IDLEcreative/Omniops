// Storage implementations for Enhanced Rate Limiter
import Redis from 'ioredis';
import type { TokenBucket } from './rate-limiter-enhanced-types';

/**
 * In-memory token bucket implementation
 */
export class InMemoryTokenBucket implements TokenBucket {
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
export class RedisTokenBucket implements TokenBucket {
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
