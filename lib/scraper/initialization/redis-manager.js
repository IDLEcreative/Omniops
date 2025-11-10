/**
 * Redis Connection Management for Scraper Worker
 * Handles Redis connection, keepalive, and error reporting
 */

/**
 * Wait for Redis connection to be available
 * @param {Object} redisClient - The resilient Redis client
 * @param {string} jobId - Job identifier for logging
 * @throws {Error} If Redis connection fails after 10 attempts
 */
export async function waitForRedis(redisClient, jobId) {
  let attempts = 0;
  while (!redisClient.isAvailable() && attempts < 10) {
    console.log(`[Worker ${jobId}] Waiting for Redis connection... (attempt ${attempts + 1})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  if (!redisClient.isAvailable()) {
    throw new Error('Failed to connect to Redis after 10 attempts');
  }
}

/**
 * Setup keepalive interval to prevent Redis connection timeout
 * @param {Object} redis - Redis client instance
 * @param {Object} redisClient - The resilient Redis client
 * @param {string} jobId - Job identifier for logging
 * @returns {NodeJS.Timeout} Interval ID for cleanup
 */
export function setupRedisKeepalive(redis, redisClient, jobId) {
  const keepaliveInterval = setInterval(async () => {
    try {
      if (redis && redisClient.isAvailable()) {
        await redis.ping();
        console.log(`[Worker ${jobId}] Redis keepalive ping successful`);
      }
    } catch (error) {
      console.warn(`[Worker ${jobId}] Redis keepalive failed:`, error.message);
      // The resilient client will handle reconnection automatically
    }
  }, 30000); // Ping every 30 seconds

  return keepaliveInterval;
}

/**
 * Report initialization errors to Redis with fallback
 * @param {Object} redis - Redis client instance
 * @param {Object} redisClient - The resilient Redis client
 * @param {string} jobId - Job identifier
 * @param {string} error - Error message to report
 */
export async function reportInitError(redis, redisClient, jobId, error) {
  try {
    await redisClient.safeOperation(async () => {
      await redis.hset(`crawl:${jobId}`, {
        status: 'failed',
        error: error,
        completedAt: new Date().toISOString(),
      });
      await redis.expire(`crawl:${jobId}`, 300); // Keep error for 5 minutes
    });
  } catch (redisError) {
    console.error(`[Worker ${jobId}] Failed to report error to Redis (will use fallback):`, redisError);
    // Store in fallback storage if Redis is unavailable
    redisClient.fallbackStorage.set(`crawl:${jobId}`, {
      status: 'failed',
      error: error,
      completedAt: new Date().toISOString(),
    });
  }
}
