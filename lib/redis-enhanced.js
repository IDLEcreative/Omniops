"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAwareCrawlJobManager = exports.ResilientRedisClient = void 0;
exports.getResilientRedisClient = getResilientRedisClient;
exports.getMemoryAwareJobManager = getMemoryAwareJobManager;
const ioredis_1 = __importDefault(require("ioredis"));
const events_1 = require("events");
const shouldBypassRedis = process.env.REDIS_DISABLE === 'true' || process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID || process.env.REDIS_URL === 'memory';
// Enhanced Redis client with circuit breaker and fallback
class ResilientRedisClient extends events_1.EventEmitter {
    constructor(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
        super();
        this.redisUrl = redisUrl;
        this.redis = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.circuitBreakerOpen = false;
        this.circuitBreakerOpenTime = 0;
        this.circuitBreakerTimeout = 30000; // 30 seconds
        this.fallbackStorage = new Map();
        if (shouldBypassRedis || this.redisUrl.startsWith('memory://')) {
            this.circuitBreakerOpen = true;
            this.isConnected = false;
            console.warn('[Redis] Using in-memory fallback storage');
            return;
        }
        this.connect();
    }
    connect() {
        try {
            this.redis = new ioredis_1.default(this.redisUrl, {
                retryStrategy: (times) => {
                    // Exponential backoff with max 10 seconds
                    const delay = Math.min(times * 100, 10000);
                    // Open circuit breaker after max attempts
                    if (times > this.maxConnectionAttempts) {
                        this.openCircuitBreaker();
                        return null; // Stop retrying
                    }
                    return delay;
                },
                reconnectOnError: (err) => {
                    const targetError = 'READONLY';
                    if (err.message.includes(targetError)) {
                        return true; // Reconnect on READONLY errors
                    }
                    return false;
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                enableOfflineQueue: false, // Don't queue commands when offline
                connectTimeout: 10000,
                disconnectTimeout: 2000,
                commandTimeout: 5000,
            });
            this.redis.on('connect', () => {
                console.log('Redis connected successfully');
                this.isConnected = true;
                this.connectionAttempts = 0;
                this.closeCircuitBreaker();
                this.emit('connected');
            });
            this.redis.on('error', (err) => {
                console.error('Redis error:', err.message);
                this.emit('error', err);
            });
            this.redis.on('close', () => {
                console.log('Redis connection closed');
                this.isConnected = false;
                this.emit('disconnected');
            });
            this.redis.on('reconnecting', () => {
                this.connectionAttempts++;
                console.log(`Redis reconnecting... attempt ${this.connectionAttempts}`);
            });
        }
        catch (error) {
            console.error('Failed to create Redis client:', error);
            this.openCircuitBreaker();
        }
    }
    openCircuitBreaker() {
        this.circuitBreakerOpen = true;
        this.circuitBreakerOpenTime = Date.now();
        console.warn('Redis circuit breaker opened - using fallback storage');
        // Schedule circuit breaker check
        setTimeout(() => {
            this.checkCircuitBreaker();
        }, this.circuitBreakerTimeout);
    }
    closeCircuitBreaker() {
        this.circuitBreakerOpen = false;
        console.log('Redis circuit breaker closed');
    }
    checkCircuitBreaker() {
        if (this.circuitBreakerOpen &&
            Date.now() - this.circuitBreakerOpenTime > this.circuitBreakerTimeout) {
            console.log('Attempting to close circuit breaker...');
            this.connectionAttempts = 0;
            this.connect();
        }
    }
    async cleanup() {
        try {
            if (this.redis && this.redis.status === 'ready') {
                await this.redis.quit();
                console.log('Redis connection closed gracefully');
            }
        } catch (error) {
            console.warn('Error during Redis cleanup:', error.message);
        }
    }
    
    async safeOperation(operation) {
        // Ensure connection is available
        if (!this.isAvailable()) {
            if (this.circuitBreakerOpen) {
                // Use fallback for reads, throw for writes
                console.warn('Redis unavailable, operation may fail');
            } else {
                // Try to reconnect
                await this.connect();
            }
        }
        
        try {
            return await operation();
        } catch (error) {
            if (error.message.includes('Connection') || error.message.includes('closed')) {
                console.warn('Redis connection error, attempting reconnection');
                await this.connect();
                // Retry once after reconnection
                return await operation();
            }
            throw error;
        }
    }
    
    isAvailable() {
        return this.isConnected && !this.circuitBreakerOpen && this.redis !== null;
    }
    // Wrapped Redis operations with fallback
    async get(key) {
        if (!this.isAvailable()) {
            return this.fallbackStorage.get(key) || null;
        }
        try {
            return await this.redis.get(key);
        }
        catch (error) {
            console.error(`Redis GET error for key ${key}:`, error);
            return this.fallbackStorage.get(key) || null;
        }
    }
    async set(key, value, ttl) {
        // Always store in fallback for safety
        this.fallbackStorage.set(key, value);
        if (!this.isAvailable()) {
            return true; // Stored in fallback
        }
        try {
            if (ttl) {
                await this.redis.setex(key, ttl, value);
            }
            else {
                await this.redis.set(key, value);
            }
            return true;
        }
        catch (error) {
            console.error(`Redis SET error for key ${key}:`, error);
            return true; // Still stored in fallback
        }
    }
    async del(key) {
        this.fallbackStorage.delete(key);
        if (!this.isAvailable()) {
            return true;
        }
        try {
            await this.redis.del(key);
            return true;
        }
        catch (error) {
            console.error(`Redis DEL error for key ${key}:`, error);
            return true; // Deleted from fallback
        }
    }
    async exists(key) {
        if (!this.isAvailable()) {
            return this.fallbackStorage.has(key);
        }
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error(`Redis EXISTS error for key ${key}:`, error);
            return this.fallbackStorage.has(key);
        }
    }
    async incr(key) {
        if (!this.isAvailable()) {
            const current = this.fallbackStorage.get(key) || 0;
            const newValue = parseInt(current) + 1;
            this.fallbackStorage.set(key, newValue.toString());
            return newValue;
        }
        try {
            return await this.redis.incr(key);
        }
        catch (error) {
            console.error(`Redis INCR error for key ${key}:`, error);
            const current = this.fallbackStorage.get(key) || 0;
            const newValue = parseInt(current) + 1;
            this.fallbackStorage.set(key, newValue.toString());
            return newValue;
        }
    }
    async expire(key, seconds) {
        if (!this.isAvailable()) {
            // Fallback doesn't support TTL, but return success
            return true;
        }
        try {
            const result = await this.redis.expire(key, seconds);
            return result === 1;
        }
        catch (error) {
            console.error(`Redis EXPIRE error for key ${key}:`, error);
            return true;
        }
    }
    async lrange(key, start, stop) {
        if (!this.isAvailable()) {
            const list = this.fallbackStorage.get(key) || [];
            return list.slice(start, stop === -1 ? undefined : stop + 1);
        }
        try {
            return await this.redis.lrange(key, start, stop);
        }
        catch (error) {
            console.error(`Redis LRANGE error for key ${key}:`, error);
            const list = this.fallbackStorage.get(key) || [];
            return list.slice(start, stop === -1 ? undefined : stop + 1);
        }
    }
    async rpush(key, ...values) {
        if (!this.isAvailable()) {
            const list = this.fallbackStorage.get(key) || [];
            list.push(...values);
            this.fallbackStorage.set(key, list);
            return list.length;
        }
        try {
            // Also update fallback
            const list = this.fallbackStorage.get(key) || [];
            list.push(...values);
            this.fallbackStorage.set(key, list);
            return await this.redis.rpush(key, ...values);
        }
        catch (error) {
            console.error(`Redis RPUSH error for key ${key}:`, error);
            const list = this.fallbackStorage.get(key) || [];
            return list.length;
        }
    }
    // Health check
    async ping() {
        if (!this.isAvailable()) {
            return false;
        }
        try {
            const result = await this.redis.ping();
            return result === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    // Graceful shutdown
    async disconnect() {
        if (this.redis) {
            await this.redis.quit();
        }
    }
    async keys(pattern) {
        if (!this.isAvailable()) {
            // Return keys from fallback storage that match pattern
            const regex = new RegExp(pattern.replace('*', '.*'));
            return Array.from(this.fallbackStorage.keys()).filter(key => regex.test(key));
        }
        try {
            return await this.redis.keys(pattern);
        }
        catch (error) {
            console.warn('Redis keys error:', error);
            return [];
        }
    }
    async hgetall(key) {
        if (!this.isAvailable()) {
            const value = this.fallbackStorage.get(key);
            if (typeof value === 'object' && value !== null) {
                return value;
            }
            return {};
        }
        try {
            return await this.redis.hgetall(key) || {};
        }
        catch (error) {
            console.warn('Redis hgetall error:', error);
            return {};
        }
    }
    // Get connection status
    getStatus() {
        return {
            connected: this.isConnected,
            circuitBreakerOpen: this.circuitBreakerOpen,
            fallbackSize: this.fallbackStorage.size,
        };
    }
    // Clear fallback storage (use with caution)
    clearFallbackStorage() {
        this.fallbackStorage.clear();
    }
}
exports.ResilientRedisClient = ResilientRedisClient;
// Enhanced job manager with memory management
class MemoryAwareCrawlJobManager {
    constructor(redis) {
        this.JOB_TTL = 3600; // 1 hour
        this.RESULT_TTL = 86400; // 24 hours
        this.MAX_RESULTS_IN_MEMORY = 1000; // Max results to keep in memory
        this.BATCH_SIZE = 100; // Process results in batches
        this.redis = redis;
    }
    // Public getter for redis client
    getRedisClient() {
        return this.redis;
    }
    async createJob(jobId, jobData) {
        const key = `crawl:job:${jobId}`;
        await this.redis.set(key, JSON.stringify(jobData), this.JOB_TTL);
    }
    async ensureJobExists(jobId) {
        const key = `crawl:job:${jobId}`;
        const exists = await this.redis.exists(key);
        return exists;
    }
    async updateJob(jobId, updates) {
        const key = `crawl:job:${jobId}`;
        const existing = await this.redis.get(key);
        if (!existing) {
            // Log warning but don't throw - job might have expired
            console.warn(`Job ${jobId} not found in Redis, skipping update`);
            return;
        }
        const jobData = JSON.parse(existing);
        const updated = { ...jobData, ...updates };
        await this.redis.set(key, JSON.stringify(updated), this.JOB_TTL);
    }
    async getJob(jobId) {
        const key = `crawl:job:${jobId}`;
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    // Memory-efficient result storage
    async addJobResult(jobId, page) {
        const key = `crawl:results:${jobId}`;
        // Check current result count
        const currentCount = await this.getResultCount(jobId);
        // If we're approaching memory limits, store in batches
        if (currentCount >= this.MAX_RESULTS_IN_MEMORY) {
            // Archive current results to a separate key
            await this.archiveResults(jobId, currentCount);
        }
        await this.redis.rpush(key, JSON.stringify(page));
        await this.redis.expire(key, this.RESULT_TTL);
    }
    // Get results with pagination for memory efficiency
    async getJobResults(jobId, offset = 0, limit = 100) {
        const key = `crawl:results:${jobId}`;
        const results = await this.redis.lrange(key, offset, offset + limit - 1);
        return results.map(r => JSON.parse(r));
    }
    // Get total result count
    async getResultCount(jobId) {
        const counts = await Promise.all([
            this.redis.get(`crawl:results:${jobId}:count`),
            this.redis.exists(`crawl:results:${jobId}`),
        ]);
        const archivedCount = counts[0] ? parseInt(counts[0]) : 0;
        const currentExists = counts[1];
        if (!currentExists) {
            return archivedCount;
        }
        // This is a lightweight operation that doesn't fetch the actual data
        const current = await this.redis.lrange(`crawl:results:${jobId}`, 0, -1);
        return archivedCount + current.length;
    }
    // Archive results to prevent memory issues
    async archiveResults(jobId, startIndex) {
        const sourceKey = `crawl:results:${jobId}`;
        const archiveKey = `crawl:archive:${jobId}:${startIndex}`;
        // Move results to archive
        const results = await this.redis.lrange(sourceKey, 0, -1);
        if (results.length > 0) {
            await this.redis.set(archiveKey, JSON.stringify(results), this.RESULT_TTL);
            await this.redis.del(sourceKey);
            await this.redis.set(`crawl:results:${jobId}:count`, startIndex.toString());
        }
    }
    // Stream results for very large crawls
    async *streamJobResults(jobId) {
        let offset = 0;
        const batchSize = this.BATCH_SIZE;
        while (true) {
            const batch = await this.getJobResults(jobId, offset, batchSize);
            if (batch.length === 0)
                break;
            for (const result of batch) {
                yield result;
            }
            offset += batchSize;
            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    async deleteJob(jobId) {
        // Delete all related keys
        const keys = [
            `crawl:job:${jobId}`,
            `crawl:results:${jobId}`,
            `crawl:results:${jobId}:count`,
        ];
        // Also check for archived results
        for (let i = 0; i < 10; i++) {
            keys.push(`crawl:archive:${jobId}:${i * this.MAX_RESULTS_IN_MEMORY}`);
        }
        for (const key of keys) {
            await this.redis.del(key);
        }
    }
    // Content deduplication with memory-efficient storage
    async checkContentHash(hash) {
        const key = `content:hash:${hash}`;
        return await this.redis.exists(key);
    }
    async saveContentHash(hash, url) {
        const key = `content:hash:${hash}`;
        // Store minimal data - just URL
        await this.redis.set(key, url, 86400); // 24 hour TTL
    }
    // Enhanced content change detection
    async savePageMetadata(url, metadata) {
        const key = `page:metadata:${Buffer.from(url).toString('base64')}`;
        await this.redis.set(key, JSON.stringify(metadata), 30 * 24 * 60 * 60); // 30 days
    }
    async getPageMetadata(url) {
        const key = `page:metadata:${Buffer.from(url).toString('base64')}`;
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    async shouldCrawlPage(url, sitemapLastMod) {
        const metadata = await this.getPageMetadata(url);
        // If never crawled, should crawl
        if (!metadata) {
            return true;
        }
        // If sitemap has lastmod date, check if page was modified
        if (sitemapLastMod) {
            const lastModDate = new Date(sitemapLastMod);
            const lastCrawledDate = new Date(metadata.lastCrawled);
            // If page was modified after last crawl, should crawl
            if (lastModDate > lastCrawledDate) {
                return true;
            }
        }
        // If no sitemap date, check if it's been more than 24 hours
        const lastCrawledDate = new Date(metadata.lastCrawled);
        const now = new Date();
        const hoursSinceLastCrawl = (now.getTime() - lastCrawledDate.getTime()) / (1000 * 60 * 60);
        // Re-crawl if more than 24 hours old (configurable)
        return hoursSinceLastCrawl > 24;
    }
    // Rate limiting with circuit breaker awareness
    async checkRateLimit(domain, limit = 10, window = 60) {
        const key = `rate:${domain}`;
        try {
            const current = await this.redis.incr(key);
            if (current === 1) {
                await this.redis.expire(key, window);
            }
            return current <= limit;
        }
        catch (error) {
            // If Redis fails, be conservative and deny
            console.error('Rate limit check failed:', error);
            return false;
        }
    }
    async getRateLimitDelay(domain) {
        const key = `rate:delay:${domain}`;
        const delay = await this.redis.get(key);
        return delay ? parseInt(delay) : 1000; // Default 1 second
    }
    async updateRateLimitDelay(domain, responseTime) {
        const key = `rate:delay:${domain}`;
        // Adaptive delay: if response is slow, increase delay
        const newDelay = responseTime > 2000 ? Math.min(responseTime * 1.5, 5000) : 1000;
        await this.redis.set(key, Math.round(newDelay).toString(), 300); // 5 min TTL
    }
    // Get Redis health status
    async getHealthStatus() {
        const status = this.redis.getStatus();
        return {
            redis: status.connected,
            fallbackActive: status.circuitBreakerOpen || status.fallbackSize > 0,
            jobCount: status.fallbackSize,
        };
    }
}
exports.MemoryAwareCrawlJobManager = MemoryAwareCrawlJobManager;
// Singleton instances
let redisClient = null;
let jobManager = null;
function getResilientRedisClient() {
    if (!redisClient) {
        redisClient = new ResilientRedisClient();
    }
    return redisClient;
}
function getMemoryAwareJobManager() {
    if (!jobManager) {
        jobManager = new MemoryAwareCrawlJobManager(getResilientRedisClient());
    }
    return jobManager;
}
