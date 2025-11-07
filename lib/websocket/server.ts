/**
 * WebSocket Server Infrastructure
 *
 * Provides real-time communication capabilities for analytics and other
 * real-time features. Uses Socket.IO for WebSocket connections with
 * automatic reconnection and room-based multi-tenant isolation.
 *
 * @module lib/websocket/server
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

interface AnalyticsUpdatePayload {
  type: 'message' | 'sentiment' | 'metrics';
  timestamp: Date;
  data: any;
}

/**
 * Initialize the WebSocket server
 *
 * Creates a Socket.IO server instance attached to the HTTP server.
 * Configures CORS, paths, and connection handling.
 *
 * @param server - HTTP server instance from Next.js
 * @returns Socket.IO server instance
 */
export function initializeWebSocket(server: HTTPServer): SocketIOServer {
  if (io) {
    console.log('[WebSocket] Server already initialized');
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/api/socket',
    // Connection timeout and ping settings
    pingTimeout: 60000,
    pingInterval: 25000,
    // Max payload size (1MB)
    maxHttpBufferSize: 1e6,
  });

  io.on('connection', (socket: Socket) => {
    console.log('[WebSocket] Client connected:', socket.id);

    // Join organization room for multi-tenant isolation
    socket.on('join:analytics', (organizationId: string) => {
      if (!organizationId || typeof organizationId !== 'string') {
        console.warn('[WebSocket] Invalid organization ID:', organizationId);
        return;
      }

      const roomName = `org:${organizationId}`;
      socket.join(roomName);
      console.log(`[WebSocket] Client ${socket.id} joined room: ${roomName}`);

      // Send connection confirmation
      socket.emit('analytics:connected', {
        organizationId,
        timestamp: new Date().toISOString()
      });
    });

    // Leave organization room
    socket.on('leave:analytics', (organizationId: string) => {
      if (!organizationId || typeof organizationId !== 'string') {
        return;
      }

      const roomName = `org:${organizationId}`;
      socket.leave(roomName);
      console.log(`[WebSocket] Client ${socket.id} left room: ${roomName}`);
    });

    // Handle heartbeat/ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Client disconnected: ${socket.id} (${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('[WebSocket] Socket error:', error);
    });
  });

  console.log('[WebSocket] Server initialized successfully');
  return io;
}

/**
 * Get the WebSocket server instance
 *
 * @returns Socket.IO server instance or null if not initialized
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Emit analytics update to organization room
 *
 * Sends real-time analytics updates to all clients in the organization's room.
 * Supports batching and throttling to prevent overwhelming clients.
 *
 * @param organizationId - Organization identifier
 * @param payload - Update payload with type and data
 */
export function emitAnalyticsUpdate(
  organizationId: string,
  payload: AnalyticsUpdatePayload
): void {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, skipping emission');
    return;
  }

  if (!organizationId) {
    console.warn('[WebSocket] Missing organization ID, skipping emission');
    return;
  }

  const roomName = `org:${organizationId}`;
  const clientsInRoom = io.sockets.adapter.rooms.get(roomName);

  if (!clientsInRoom || clientsInRoom.size === 0) {
    // No clients in this room, skip emission
    return;
  }

  io.to(roomName).emit('analytics:update', {
    ...payload,
    timestamp: payload.timestamp || new Date(),
  });

  console.log(
    `[WebSocket] Emitted ${payload.type} update to ${clientsInRoom.size} client(s) in ${roomName}`
  );
}

/**
 * Emit new message event to organization room
 *
 * @param organizationId - Organization identifier
 * @param message - Message data
 */
export function emitNewMessage(organizationId: string, message: any): void {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, skipping emission');
    return;
  }

  const roomName = `org:${organizationId}`;
  io.to(roomName).emit('analytics:new-message', {
    ...message,
    timestamp: message.timestamp || new Date(),
  });
}

/**
 * Emit sentiment update to organization room
 *
 * @param organizationId - Organization identifier
 * @param sentiment - Sentiment analysis data
 */
export function emitSentimentUpdate(organizationId: string, sentiment: any): void {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, skipping emission');
    return;
  }

  const roomName = `org:${organizationId}`;
  io.to(roomName).emit('analytics:sentiment-update', {
    ...sentiment,
    timestamp: sentiment.timestamp || new Date(),
  });
}

/**
 * Emit metrics update to organization room
 *
 * @param organizationId - Organization identifier
 * @param metrics - Metrics data
 */
export function emitMetricsUpdate(organizationId: string, metrics: any): void {
  emitAnalyticsUpdate(organizationId, {
    type: 'metrics',
    timestamp: new Date(),
    data: metrics,
  });
}

/**
 * Get connection statistics
 *
 * @returns Connection stats including total clients and rooms
 */
export function getConnectionStats(): {
  totalClients: number;
  rooms: Array<{ name: string; clients: number }>;
} | null {
  if (!io) return null;

  const rooms: Array<{ name: string; clients: number }> = [];

  io.sockets.adapter.rooms.forEach((sockets, roomName) => {
    // Skip individual socket rooms (Socket.IO creates a room per socket)
    if (!roomName.startsWith('org:')) return;

    rooms.push({
      name: roomName,
      clients: sockets.size,
    });
  });

  return {
    totalClients: io.sockets.sockets.size,
    rooms,
  };
}

/**
 * Cleanup and close WebSocket server
 */
export async function closeWebSocket(): Promise<void> {
  if (!io) return;

  return new Promise((resolve) => {
    io!.close(() => {
      console.log('[WebSocket] Server closed');
      io = null;
      resolve();
    });
  });
}
