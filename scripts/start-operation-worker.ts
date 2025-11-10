#!/usr/bin/env tsx
/**
 * Start Operation Worker
 *
 * Starts the BullMQ worker to process autonomous operation jobs.
 * This should be run as a separate process from your web server.
 *
 * Usage:
 *   npx tsx scripts/start-operation-worker.ts
 *
 * Or with PM2 for production:
 *   pm2 start scripts/start-operation-worker.ts --name operation-worker
 */

import { startOperationProcessing } from '@/lib/autonomous/queue';

console.log('🤖 Autonomous Operations Worker');
console.log('='.repeat(70));
console.log(`Started at: ${new Date().toISOString()}`);
console.log(`Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
console.log('='.repeat(70));
console.log('');

// Start the worker
const processor = startOperationProcessing({
  maxConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
  rateLimitPerOrg: parseInt(process.env.RATE_LIMIT_PER_ORG || '10'),
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
});

console.log('✅ Worker is now processing jobs from the queue');
console.log('Press Ctrl+C to stop gracefully\n');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⏸️  SIGTERM received, shutting down gracefully...');
  await processor.stop();
  console.log('✅ Worker stopped');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⏸️  SIGINT received, shutting down gracefully...');
  await processor.stop();
  console.log('✅ Worker stopped');
  process.exit(0);
});

// Keep process alive
process.stdin.resume();
