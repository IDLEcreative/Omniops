import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeWebSocket } from './lib/websocket/server';
import { initializeContentRefresh, stopContentRefresh } from './lib/cron/scheduled-content-refresh';
import { initializeScheduledReports } from './lib/cron/scheduled-reports';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize WebSocket server
  initializeWebSocket(server);

  // Initialize scheduled jobs
  initializeContentRefresh();
  initializeScheduledReports();

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server initialized`);
    console.log(`> Scheduled content refresh initialized`);
    console.log(`> Scheduled reports initialized`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');

    // Stop scheduled jobs
    stopContentRefresh();

    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forcing shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});
