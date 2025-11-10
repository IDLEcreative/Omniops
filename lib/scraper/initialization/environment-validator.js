/**
 * Environment Variable Validation for Scraper Worker
 * Validates required environment variables before service initialization
 */

import { reportInitError } from './redis-manager.js';

/**
 * Check required environment variables
 * @param {Object} redis - Redis client instance
 * @param {Object} redisClient - The resilient Redis client
 * @param {string} jobId - Job identifier for logging
 * @param {NodeJS.Timeout} keepaliveInterval - Redis keepalive interval to clear on error
 * @throws {Error} Exits process if required variables are missing
 */
export async function checkEnvironmentVariables(redis, redisClient, jobId, keepaliveInterval) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const errorMsg = 'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)';
    console.error(`[Worker ${jobId}] Error: ${errorMsg}`);
    await reportInitError(redis, redisClient, jobId, errorMsg);
    clearInterval(keepaliveInterval);
    await redisClient.disconnect();
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    const errorMsg = 'Missing OPENAI_API_KEY environment variable';
    console.error(`[Worker ${jobId}] Error: ${errorMsg}`);
    await reportInitError(redis, redisClient, jobId, errorMsg);
    clearInterval(keepaliveInterval);
    await redisClient.disconnect();
    process.exit(1);
  }
}
