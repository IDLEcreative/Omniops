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
