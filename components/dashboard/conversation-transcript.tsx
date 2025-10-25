'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageContent } from '@/components/chat/MessageContent';
import { Bot, User, AlertCircle } from 'lucide-react';
import { useConversationTranscript } from '@/hooks/use-conversation-transcript';
import type { ConversationMessage } from '@/types/dashboard';

interface ConversationTranscriptProps {
  conversationId: string | null;
  className?: string;
}

export function ConversationTranscript({
  conversationId,
  className = '',
}: ConversationTranscriptProps) {
  const { data, loading, error } = useConversationTranscript({ conversationId });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (data?.messages && scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const timeoutId = setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 100);

        // Cleanup function to prevent memory leaks
        return () => clearTimeout(timeoutId);
      }
    }
  }, [data?.messages]);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div className="space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select a conversation to view the transcript
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="space-y-4 w-full max-w-2xl p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 rounded bg-muted" />
                <div className="h-16 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load transcript: {error.message}
            <br />
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="underline text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              aria-label="Refresh page to retry loading transcript"
            >
              Try refreshing the page
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || data.messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div className="space-y-2">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No messages in this conversation yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea
      ref={scrollRef}
      className={`h-full ${className}`}
      role="region"
      aria-label="Conversation transcript"
    >
      <div className="space-y-4 p-4" aria-live="polite" aria-atomic="false">
        {data.messages.map((message) => {
          try {
            return <Message key={message.id} message={message} />;
          } catch (err) {
            // Handle individual message render errors gracefully
            const error = err instanceof Error ? err : new Error('Unknown error');
            return (
              <div key={message.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to render message: {error.message}</span>
                </div>
              </div>
            );
          }
        })}
      </div>
    </ScrollArea>
  );
}

function Message({ message }: { message: ConversationMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="max-w-sm">
          <Badge variant="outline" className="text-xs">
            {message.content}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={isUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col max-w-[75%]`}>
        <div className="flex items-center gap-2">
          <Badge variant={isUser ? 'default' : 'secondary'} className="text-xs">
            {isUser ? 'Customer' : 'Assistant'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.created_at)}
          </span>
        </div>

        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-muted text-foreground'
          }`}
        >
          <MessageContent
            content={message.content}
            className={isUser ? 'text-white' : ''}
          />
        </div>

        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Sources:</span>{' '}
            {message.metadata.sources.slice(0, 2).join(', ')}
            {message.metadata.sources.length > 2 && ` +${message.metadata.sources.length - 2} more`}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
