#!/usr/bin/env -S npx tsx

import { ScraperCleanupService } from '../lib/scraper-cleanup';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';

  const cleanup = new ScraperCleanupService(process.env.REDIS_URL);

  try {
    switch (command) {
      case 'run':
        console.log('🧹 Running one-time cleanup...');
        const staleJobs = await cleanup.cleanupStaleJobs();
        const queuedJobs = await cleanup.cleanupQueuedJobs();
        console.log(`✅ Cleanup complete: ${staleJobs} stale jobs, ${queuedJobs} queued jobs cleaned`);
        break;

      case 'watch':
        console.log('👀 Starting auto-cleanup service...');
        cleanup.startAutoCleanup();
        
        process.on('SIGINT', async () => {
          console.log('\n⏹️  Stopping auto-cleanup...');
          await cleanup.disconnect();
          process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
          console.log('\n⏹️  Stopping auto-cleanup...');
          await cleanup.disconnect();
          process.exit(0);
        });
        
        console.log('Auto-cleanup is running. Press Ctrl+C to stop.');
        break;

      case 'status':
        console.log('📊 Checking scraper status...');
        const redis = (cleanup as any).redis;
        
        const crawlKeys = await redis.keys('crawl:crawl_*');
        const queueLength = await redis.llen('scrape:queue');
        
        const stats = {
          processing: 0,
          pending: 0,
          completed: 0,
          failed: 0,
          stale: 0,
        };

        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000;

        for (const key of crawlKeys) {
          const job = await redis.hgetall(key);
          if (!job.status) continue;

          stats[job.status as keyof typeof stats] = (stats[job.status as keyof typeof stats] || 0) + 1;

          if ((job.status === 'processing' || job.status === 'pending') && job.startedAt) {
            const age = now - new Date(job.startedAt).getTime();
            if (age > twoHours) {
              stats.stale++;
            }
          }
        }

        console.log('\n📈 Scraper Status:');
        console.log(`  Total jobs: ${crawlKeys.length}`);
        console.log(`  Processing: ${stats.processing}`);
        console.log(`  Pending: ${stats.pending}`);
        console.log(`  Completed: ${stats.completed}`);
        console.log(`  Failed: ${stats.failed}`);
        console.log(`  Stale (>2hrs): ${stats.stale}`);
        console.log(`  Queue length: ${queueLength}`);
        break;

      default:
        console.log('Usage: npx tsx scripts/scraper-cleanup.ts [command]');
        console.log('Commands:');
        console.log('  run    - Run one-time cleanup (default)');
        console.log('  watch  - Start auto-cleanup service');
        console.log('  status - Show scraper status');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (command !== 'watch') {
      await cleanup.disconnect();
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});