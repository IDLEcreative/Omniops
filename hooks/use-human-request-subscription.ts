/**
 * Real-Time Human Request Subscription Hook
 *
 * Subscribes to Supabase real-time updates for conversations where users
 * request human assistance. Provides browser notifications, sound alerts,
 * and toast notifications for support agents.
 */

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface HumanRequestEvent {
  conversationId: string;
  customerName: string | null;
  lastMessage: string;
  requestedAt: string;
  frustrationDetected?: boolean;
}

export interface UseHumanRequestSubscriptionOptions {
  onNewRequest?: (event: HumanRequestEvent) => void;
  enableBrowserNotifications?: boolean;
  enableSoundAlert?: boolean;
  enableToast?: boolean;
}

export function useHumanRequestSubscription(
  options: UseHumanRequestSubscriptionOptions = {}
) {
  const {
    onNewRequest,
    enableBrowserNotifications = true,
    enableSoundAlert = false,
    enableToast = true,
  } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((event: HumanRequestEvent) => {
    if (!enableBrowserNotifications) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification('🚨 Human Help Requested', {
        body: event.customerName
          ? `${event.customerName} needs assistance`
          : 'A customer needs assistance',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `human-request-${event.conversationId}`,
        requireInteraction: true,
        data: {
          conversationId: event.conversationId,
          url: `/dashboard/conversations?id=${event.conversationId}`,
        },
      });

      notification.onclick = () => {
        window.focus();
        if (notification.data?.url) {
          window.location.href = notification.data.url;
        }
        notification.close();
      };
    }
  }, [enableBrowserNotifications]);

  // Play sound alert
  const playSoundAlert = useCallback(() => {
    if (!enableSoundAlert) return;

    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
    }

    audioRef.current.play().catch((error) => {
      console.warn('Failed to play notification sound:', error);
    });
  }, [enableSoundAlert]);

  // Handle new human request
  const handleNewRequest = useCallback(
    (payload: any) => {
      const conversation = payload.new;

      // Only process if this is a new human request
      const metadata = conversation.metadata || {};
      if (!metadata.assigned_to_human || !metadata.requested_human_at) {
        return;
      }

      const event: HumanRequestEvent = {
        conversationId: conversation.id,
        customerName: conversation.customer_name,
        lastMessage: conversation.last_message || 'No message',
        requestedAt: metadata.requested_human_at,
        frustrationDetected: metadata.frustration_detected,
      };

      // Trigger callbacks
      onNewRequest?.(event);
      showBrowserNotification(event);
      playSoundAlert();
    },
    [onNewRequest, showBrowserNotification, playSoundAlert]
  );

  // Set up real-time subscription
  useEffect(() => {
    const supabase = createClient();

    // Request notification permission on mount
    if (enableBrowserNotifications) {
      requestNotificationPermission();
    }

    // Subscribe to conversations table updates
    channelRef.current = supabase
      .channel('human-requests')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: 'status=eq.waiting',
        },
        handleNewRequest
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to human request updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to human requests');
        }
      });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    enableBrowserNotifications,
    handleNewRequest,
    requestNotificationPermission,
  ]);

  return {
    requestNotificationPermission,
  };
}
