/**
 * Redis Fallback - Type Definitions
 *
 * Shared interfaces and types for Redis fallback implementation
 */

export interface StoredItem {
  value: string;
  expiry?: number;
}

export interface RedisStatus {
  type: 'redis' | 'memory' | 'unavailable';
  available: boolean;
}

export interface RedisOperations {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<'OK' | null>;
  setex(key: string, seconds: number, value: string): Promise<'OK' | null>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  zadd(key: string, score: number, member: string): Promise<number>;
  zrange(key: string, start: number, stop: number, withScores?: 'WITHSCORES'): Promise<string[]>;
  zrem(key: string, ...members: string[]): Promise<number>;
  zcard(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  quit(): Promise<'OK'>;
}
