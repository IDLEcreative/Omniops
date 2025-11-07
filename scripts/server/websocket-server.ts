/**
 * Custom Next.js Server with WebSocket Support
 *
 * Extends the default Next.js server to support WebSocket connections
 * for real-time analytics updates via Socket.IO.
 *
 * Usage:
 *   npm run dev:ws    - Development mode with WebSocket
 *   npm run start:ws  - Production mode with WebSocket
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeWebSocket } from './lib/websocket/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
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

  // Start listening
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready at ws://${hostname}:${port}/api/socket`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    console.log('\n> Shutting down gracefully...');

    server.close(() => {
      console.log('> HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('> Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});
