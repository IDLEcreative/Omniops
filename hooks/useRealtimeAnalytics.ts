'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ResponseTimes {
  p50: number;
  p95: number;
  p99: number;
}

export interface EngagementMetrics {
  activeCount: number;
  avgDuration: number;
  avgMessageCount: number;
}

export interface RealtimeMetrics {
  activeSessions: number;
  messagesPerMinute: number;
  responseTimes: ResponseTimes;
  engagement: EngagementMetrics;
  activityFeed: any[];
  timestamp: number;
}

export interface MetricDeltas {
  activeSessions: number;
  messagesPerMinute: number;
}

export interface UseRealtimeAnalyticsOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseRealtimeAnalyticsReturn {
  metrics: RealtimeMetrics | null;
  deltas: MetricDeltas | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

const DEFAULT_METRICS: RealtimeMetrics = {
  activeSessions: 0,
  messagesPerMinute: 0,
  responseTimes: { p50: 0, p95: 0, p99: 0 },
  engagement: { activeCount: 0, avgDuration: 0, avgMessageCount: 0 },
  activityFeed: [],
  timestamp: Date.now()
};

export function useRealtimeAnalytics(
  options: UseRealtimeAnalyticsOptions = {}
): UseRealtimeAnalyticsReturn {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10
  } = options;

  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [deltas, setDeltas] = useState<MetricDeltas | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (eventSourceRef.current) return; // Already connected

    setIsConnecting(true);
    setError(null);

    try {
      const eventSource = new EventSource('/api/realtime/analytics');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'metrics':
              setMetrics(data.data || DEFAULT_METRICS);
              if (data.deltas) {
                setDeltas(data.deltas);
              }
              break;

            case 'event':
              // Handle individual real-time events if needed
              break;

            case 'ping':
              // Keep-alive ping, no action needed
              break;

            case 'connected':
              console.log('Connected to analytics stream:', data.clientId);
              break;

            case 'error':
              console.error('Analytics stream error:', data.error);
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = (event) => {
        if (!mountedRef.current) return;

        console.error('EventSource error:', event);
        setError(new Error('Connection to analytics stream failed'));
        setIsConnected(false);
        setIsConnecting(false);

        // Clean up the failed connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Attempt to reconnect if under the max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        } else {
          setError(new Error('Maximum reconnection attempts reached'));
        }
      };
    } catch (err) {
      console.error('Error creating EventSource:', err);
      setError(err as Error);
      setIsConnecting(false);
    }
  }, [reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    cleanup();
    reconnectAttemptsRef.current = 0;
  }, [cleanup]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [autoConnect, connect, cleanup]);

  return {
    metrics,
    deltas,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect
  };
}