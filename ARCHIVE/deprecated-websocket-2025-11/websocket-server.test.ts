/**
 * WebSocket Server Integration Tests
 *
 * Tests the WebSocket server initialization, connection handling,
 * and real-time event emission.
 */

import { createServer, Server as HTTPServer } from 'http';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import {
  initializeWebSocket,
  getWebSocketServer,
  emitNewMessage,
  emitSentimentUpdate,
  getConnectionStats,
  closeWebSocket,
} from '@/lib/websocket/server';

describe('WebSocket Server', () => {
  let httpServer: HTTPServer;
  let clientSocket: ClientSocket;
  const PORT = 3001; // Use different port for testing

  beforeAll((done) => {
    // Create HTTP server for testing
    httpServer = createServer();
    httpServer.listen(PORT, () => {
      initializeWebSocket(httpServer);
      done();
    });
  });

  afterAll(async () => {
    await closeWebSocket();
    httpServer.close();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it('should initialize WebSocket server', () => {
    const io = getWebSocketServer();
    expect(io).not.toBeNull();
  });

  it('should accept client connections', (done) => {
    clientSocket = ioc(`http://localhost:${PORT}`, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    clientSocket.on('connect_error', (error) => {
      done(error);
    });
  });

  it('should allow clients to join organization rooms', (done) => {
    clientSocket = ioc(`http://localhost:${PORT}`, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('join:analytics', 'org-123');

      clientSocket.on('analytics:connected', (data) => {
        expect(data.organizationId).toBe('org-123');
        expect(data.timestamp).toBeDefined();
        done();
      });
    });
  });

  it('should emit analytics updates to organization rooms', (done) => {
    const orgId = 'org-456';

    clientSocket = ioc(`http://localhost:${PORT}`, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('join:analytics', orgId);

      clientSocket.on('analytics:new-message', (data) => {
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('content');
        done();
      });

      // Emit message after joining
      setTimeout(() => {
        emitNewMessage(orgId, {
          conversationId: 'conv-123',
          messageId: 'msg-456',
          role: 'assistant',
          content: 'Test message',
          timestamp: new Date(),
        });
      }, 100);
    });
  });

  it('should track connection statistics', (done) => {
    clientSocket = ioc(`http://localhost:${PORT}`, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('join:analytics', 'org-stats');

      setTimeout(() => {
        const stats = getConnectionStats();
        expect(stats).not.toBeNull();
        expect(stats!.totalClients).toBeGreaterThan(0);
        expect(stats!.rooms.length).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  it('should handle ping/pong heartbeat', (done) => {
    clientSocket = ioc(`http://localhost:${PORT}`, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('ping');

      clientSocket.on('pong', (data) => {
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });
  });

  it('should isolate events between organizations', (done) => {
    const org1 = 'org-isolation-1';
    const org2 = 'org-isolation-2';

    const client1 = ioc(`http://localhost:${PORT}`, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    const client2 = ioc(`http://localhost:${PORT}`, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    let client1Received = false;
    let client2Received = false;

    client1.on('connect', () => {
      client1.emit('join:analytics', org1);

      client1.on('analytics:new-message', () => {
        client1Received = true;
      });
    });

    client2.on('connect', () => {
      client2.emit('join:analytics', org2);

      client2.on('analytics:new-message', () => {
        client2Received = true;
      });

      // Emit to org1 only
      setTimeout(() => {
        emitNewMessage(org1, {
          conversationId: 'conv-123',
          messageId: 'msg-456',
          role: 'assistant',
          content: 'Test message',
          timestamp: new Date(),
        });
      }, 100);

      // Check isolation after delay
      setTimeout(() => {
        expect(client1Received).toBe(true);
        expect(client2Received).toBe(false);

        client1.disconnect();
        client2.disconnect();
        done();
      }, 300);
    });
  });
});
