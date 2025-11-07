/**
 * Real-time Analytics Hook
 *
 * Connects to WebSocket server for real-time analytics updates.
 * Automatically handles reconnection, room management, and event processing.
 *
 * @module hooks/use-realtime-analytics
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface RealtimeAnalyticsOptions {
  organizationId: string | null;
  enabled?: boolean;
}

interface AnalyticsUpdate {
  type: 'message' | 'sentiment' | 'metrics';
  timestamp: Date;
  data: any;
}

interface UseRealtimeAnalyticsResult {
  socket: Socket | null;
  isConnected: boolean;
  latestUpdate: AnalyticsUpdate | null;
  connectionError: Error | null;
  reconnectAttempts: number;
}

/**
 * Hook for real-time analytics updates via WebSocket
 *
 * Automatically connects to WebSocket server and subscribes to analytics
 * events for the specified organization. Handles reconnection and cleanup.
 *
 * @param options - Configuration options
 * @returns WebSocket connection state and latest updates
 *
 * @example
 * ```tsx
 * const { isConnected, latestUpdate } = useRealtimeAnalytics({
 *   organizationId: 'org-123',
 *   enabled: true
 * });
 *
 * useEffect(() => {
 *   if (latestUpdate?.type === 'message') {
 *     // Refresh message count
 *   }
 * }, [latestUpdate]);
 * ```
 */
export function useRealtimeAnalytics({
  organizationId,
  enabled = true,
}: RealtimeAnalyticsOptions): UseRealtimeAnalyticsResult {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<AnalyticsUpdate | null>(null);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Don't connect if disabled or no organization ID
    if (!enabled || !organizationId) {
      cleanup();
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get WebSocket URL
    const wsUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    // Create socket connection
    const socketInstance = io(wsUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);

      // Join organization room
      socketInstance.emit('join:analytics', organizationId);
    });

    socketInstance.on('analytics:connected', (data: { organizationId: string; timestamp: string }) => {
      console.log('[WebSocket] Joined analytics room:', data.organizationId);
    });

    socketInstance.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);

      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - try to reconnect
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setConnectionError(error);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber: number) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      setReconnectAttempts(attemptNumber);

      // Re-join organization room after reconnection
      socketInstance.emit('join:analytics', organizationId);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('[WebSocket] Reconnection attempt:', attemptNumber);
      setReconnectAttempts(attemptNumber);
    });

    socketInstance.on('reconnect_error', (error: Error) => {
      console.error('[WebSocket] Reconnection error:', error.message);
      setConnectionError(error);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed - max attempts reached');
      setConnectionError(new Error('Max reconnection attempts reached'));
    });

    // Analytics event handlers
    socketInstance.on('analytics:update', (data: AnalyticsUpdate) => {
      console.log('[WebSocket] Analytics update:', data.type);
      setLatestUpdate({
        ...data,
        timestamp: new Date(data.timestamp),
      });
    });

    socketInstance.on('analytics:new-message', (data: any) => {
      console.log('[WebSocket] New message event');
      setLatestUpdate({
        type: 'message',
        timestamp: new Date(data.timestamp),
        data,
      });
    });

    socketInstance.on('analytics:sentiment-update', (data: any) => {
      console.log('[WebSocket] Sentiment update event');
      setLatestUpdate({
        type: 'sentiment',
        timestamp: new Date(data.timestamp),
        data,
      });
    });

    // Pong response for heartbeat
    socketInstance.on('pong', (data: { timestamp: string }) => {
      // Heartbeat acknowledged
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      cleanup();
      socketInstance.emit('leave:analytics', organizationId);
      socketInstance.disconnect();
    };
  }, [organizationId, enabled, cleanup]);

  // Heartbeat ping every 30 seconds when connected
  useEffect(() => {
    if (!socket || !isConnected) return;

    const pingInterval = setInterval(() => {
      socket.emit('ping');
    }, 30000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    latestUpdate,
    connectionError,
    reconnectAttempts,
  };
}
