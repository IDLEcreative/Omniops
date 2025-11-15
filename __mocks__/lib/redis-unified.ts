/**
 * Mock Redis Unified Module
 * Prevents Jest from trying to resolve the problematic directory export
 */

export const getRedisClient = jest.fn();
export const getJobManager = jest.fn();
export const QUEUE_NAMESPACES = {};
export const QUEUE_PRIORITIES = {};
export const RATE_LIMITS = {};
export const DEDUP_CONFIG = {};
export const getQueueKey = jest.fn();
export const isDuplicateJob = jest.fn();
export const checkRateLimit = jest.fn();
export const gracefulShutdown = jest.fn();
export type ResilientRedisClient = any;
export type MemoryAwareCrawlJobManager = any;
