/**
 * Type definitions for Redis Enhanced modules
 * Extracted from redis-enhanced.ts for better modularity
 */

export interface RedisStatus {
  connected: boolean;
  circuitBreakerOpen: boolean;
  fallbackSize: number;
}

export interface HealthStatus {
  redis: boolean;
  fallbackActive: boolean;
  jobCount: number;
}

export interface PageMetadata {
  contentHash: string;
  lastModified?: string;
  lastCrawled: string;
}

export interface JobData {
  [key: string]: any;
}

export interface RedisConfig {
  redisUrl?: string;
  maxConnectionAttempts?: number;
  circuitBreakerTimeout?: number;
}

export interface JobManagerConfig {
  jobTTL?: number;
  resultTTL?: number;
  maxResultsInMemory?: number;
  batchSize?: number;
}

/**
 * Interface for ResilientRedisClient to break circular dependencies
 * This allows jobs and memory modules to import the interface instead of the class
 */
export interface IResilientRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  rpush(key: string, ...values: string[]): Promise<number>;
  ping(): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
  hgetall(key: string): Promise<Record<string, string>>;
  disconnect(): Promise<void>;
  getStatus(): RedisStatus;
  clearFallbackStorage(): void;
}
