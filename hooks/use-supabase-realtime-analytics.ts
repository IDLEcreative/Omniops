/**
 * Supabase Realtime Analytics Hook
 *
 * Connects to Supabase Realtime Broadcast channels for real-time analytics updates.
 * This replaces the Socket.IO WebSocket implementation with Supabase Realtime,
 * which works on serverless platforms like Vercel.
 *
 * @module hooks/use-supabase-realtime-analytics
 */

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeAnalyticsOptions {
  organizationId: string | null;
  enabled?: boolean;
}

interface AnalyticsUpdate {
  type: 'message' | 'sentiment' | 'metrics';
  timestamp: Date;
  data: any;
}

interface UseSupabaseRealtimeAnalyticsResult {
  channel: RealtimeChannel | null;
  isConnected: boolean;
  latestUpdate: AnalyticsUpdate | null;
  connectionError: Error | null;
}

/**
 * Hook for real-time analytics updates via Supabase Realtime
 *
 * Automatically subscribes to Broadcast channel for the specified organization.
 * Updates are received in real-time and trigger dashboard refreshes.
 *
 * @param options - Configuration options
 * @returns Realtime connection state and latest updates
 *
 * @example
 * ```tsx
 * const { isConnected, latestUpdate } = useSupabaseRealtimeAnalytics({
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
export function useSupabaseRealtimeAnalytics({
  organizationId,
  enabled = true,
}: RealtimeAnalyticsOptions): UseSupabaseRealtimeAnalyticsResult {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<AnalyticsUpdate | null>(null);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  const cleanup = useCallback(() => {
    if (channel) {
      channel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
    }
  }, [channel]);

  useEffect(() => {
    // Don't connect if disabled or no organization ID
    if (!enabled || !organizationId) {
      cleanup();
      return;
    }

    const supabase = createClient();
    const channelName = `analytics:${organizationId}`;

    // Create channel and subscribe to broadcast events
    const realtimeChannel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'analytics:new-message' }, (payload) => {
        console.log('[Supabase Realtime] New message event:', payload);
        setLatestUpdate({
          type: 'message',
          timestamp: new Date(payload.payload.timestamp),
          data: payload.payload,
        });
      })
      .on('broadcast', { event: 'analytics:sentiment-update' }, (payload) => {
        console.log('[Supabase Realtime] Sentiment update event:', payload);
        setLatestUpdate({
          type: 'sentiment',
          timestamp: new Date(payload.payload.timestamp),
          data: payload.payload,
        });
      })
      .on('broadcast', { event: 'analytics:metrics-update' }, (payload) => {
        console.log('[Supabase Realtime] Metrics update event:', payload);
        setLatestUpdate({
          type: 'metrics',
          timestamp: new Date(payload.payload.timestamp),
          data: payload.payload,
        });
      })
      .subscribe((status) => {
        console.log('[Supabase Realtime] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          console.log('[Supabase Realtime] Connected to channel:', channelName);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError(new Error('Channel subscription error'));
          console.error('[Supabase Realtime] Channel error');
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionError(new Error('Connection timed out'));
          console.error('[Supabase Realtime] Connection timed out');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('[Supabase Realtime] Channel closed');
        }
      });

    setChannel(realtimeChannel);

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log('[Supabase Realtime] Cleaning up channel:', channelName);
      realtimeChannel.unsubscribe();
    };
  }, [organizationId, enabled]);

  return {
    channel,
    isConnected,
    latestUpdate,
    connectionError,
  };
}
