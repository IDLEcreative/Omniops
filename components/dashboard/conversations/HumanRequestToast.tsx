/**
 * Human Request Toast Notification
 *
 * Displays toast notifications when new human help requests arrive in real-time.
 * Provides quick access to the conversation and shows frustration indicators.
 */

'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AlertCircle, MessageSquare } from 'lucide-react';
import type { HumanRequestEvent } from '@/hooks/use-human-request-subscription';

interface HumanRequestToastProps {
  event: HumanRequestEvent;
}

export function showHumanRequestToast(event: HumanRequestEvent, router: ReturnType<typeof useRouter>) {
  const customerName = event.customerName || 'A customer';
  const timeAgo = formatRelativeTime(event.requestedAt);

  toast(
    <div className="flex items-start gap-3 w-full">
      <div className="flex-shrink-0">
        {event.frustrationDetected ? (
          <AlertCircle className="h-5 w-5 text-red-500" />
        ) : (
          <MessageSquare className="h-5 w-5 text-orange-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">
            🚨 Human Help Requested
          </p>
          {event.frustrationDetected && (
            <span className="text-xs text-red-600 font-medium">⚠️ Frustrated</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {customerName} • {timeAgo}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {event.lastMessage}
        </p>
      </div>
    </div>,
    {
      duration: 8000,
      position: 'top-right',
      action: {
        label: 'View',
        onClick: () => {
          router.push(`/dashboard/conversations?id=${event.conversationId}`);
        },
      },
      dismissible: true,
      classNames: {
        toast: event.frustrationDetected
          ? 'border-red-500 border-l-4'
          : 'border-orange-500 border-l-4',
      },
    }
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const delta = Date.now() - date.getTime();
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
