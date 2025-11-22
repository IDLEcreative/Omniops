/**
 * Custom Next.js Server with Scheduled Content Refresh
 *
 * This server initializes the cron-based content refresh system that runs
 * daily at 2:00 AM UTC to keep all domain content up-to-date.
 *
 * Usage:
 *   Development: npm run dev (uses next dev, no cron)
 *   Production:  npm run start:server (uses this file with cron)
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeContentRefresh } from './lib/cron/scheduled-content-refresh';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Initialize the scheduled content refresh system
  const cronEnabled = process.env.CRON_ENABLED === 'true';

  if (cronEnabled) {
    console.log('\n🕐 Initializing scheduled content refresh...');
    initializeContentRefresh();
    console.log('✅ Cron job initialized - content will refresh daily at 2:00 AM UTC\n');
  } else {
    console.log('\n⏸️  Scheduled refresh DISABLED (CRON_ENABLED=false)\n');
  }

  // Create HTTP server
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      const cronStatus = process.env.CRON_ENABLED === 'true'
        ? `✅ ${process.env.CRON_SCHEDULE || '0 2 * * *'}`
        : '⏸️  Disabled';
      const cronMode = process.env.CRON_REFRESH_MODE === 'incremental' ? '(Incremental)' : '(Full)';

      console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Server ready                                           ║
║                                                            ║
║  > Local:    http://${hostname}:${port}                       ║
║  > Network:  http://0.0.0.0:${port}                         ║
║                                                            ║
║  📅 Scheduled Refresh: ${cronStatus.padEnd(35)} ║
║  🔧 Refresh Mode: ${cronMode.padEnd(42)} ║
║  🔐 CRON_SECRET: ${process.env.CRON_SECRET ? '✅ Configured' : '❌ Missing'}                        ║
╚════════════════════════════════════════════════════════════╝
      `);

      if (!process.env.CRON_SECRET) {
        console.warn('\n⚠️  WARNING: CRON_SECRET not set in environment variables!');
        console.warn('   Set CRON_SECRET in .env.local to secure the cron endpoint.\n');
      }
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
