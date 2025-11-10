/**
 * Service Initialization for Scraper Worker
 * Initializes Supabase and OpenAI clients with error handling
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { DatabaseOptimizer } from '../../db-optimization.js';
import { checkEnvironmentVariables } from './environment-validator.js';
import { reportInitError } from './redis-manager.js';

/**
 * Initialize Supabase and OpenAI services
 * @param {Object} redis - Redis client instance
 * @param {Object} redisClient - The resilient Redis client
 * @param {string} jobId - Job identifier for logging
 * @param {NodeJS.Timeout} keepaliveInterval - Redis keepalive interval to clear on error
 * @returns {Promise<{supabase: Object, openai: Object}>} Initialized service clients
 */
export async function initializeServices(redis, redisClient, jobId, keepaliveInterval) {
  // Check environment variables first
  await checkEnvironmentVariables(redis, redisClient, jobId, keepaliveInterval);

  let supabase;
  let openai;

  try {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Initialize the database optimizer for bulk operations
    global.dbOptimizer = new DatabaseOptimizer(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log(`[Worker ${jobId}] Supabase client initialized`);
  } catch (error) {
    const errorMsg = `Failed to initialize Supabase client: ${error.message}`;
    console.error(`[Worker ${jobId}] ${errorMsg}`);
    await reportInitError(redis, redisClient, jobId, errorMsg);
    clearInterval(keepaliveInterval);
    await redisClient.disconnect();
    process.exit(1);
  }

  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log(`[Worker ${jobId}] OpenAI client initialized`);
  } catch (error) {
    const errorMsg = `Failed to initialize OpenAI client: ${error.message}`;
    console.error(`[Worker ${jobId}] ${errorMsg}`);
    await reportInitError(redis, redisClient, jobId, errorMsg);
    clearInterval(keepaliveInterval);
    await redisClient.disconnect();
    process.exit(1);
  }

  return { supabase, openai };
}
