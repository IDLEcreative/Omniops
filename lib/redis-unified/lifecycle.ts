/**
 * Redis Unified - Lifecycle Management
 */

import { getInstances, resetInstances } from './client';

/**
 * Graceful shutdown helper
 */
export async function gracefulShutdown(): Promise<void> {
  console.log('[Redis] Starting graceful shutdown...');

  const { client, jobManager } = getInstances();

  if (client) {
    await client.disconnect();
  }

  if (jobManager) {
    // Job manager uses the same Redis client, so no separate disconnect needed
  }

  resetInstances();

  console.log('[Redis] Graceful shutdown complete');
}

// Handle process termination
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
