'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, User, Bot, Mail, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Message {
  messageId: string;
  content: string;
  role: string;
  createdAt: string;
  sentiment?: string;
  relevanceScore: number;
  highlight: string;
  customerEmail?: string;
  domainName?: string;
}

interface ConversationPreviewProps {
  conversationId: string;
  messages: Message[];
}

export function ConversationPreview({
  conversationId,
  messages
}: ConversationPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  // Sort messages by timestamp
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const firstMessage = sortedMessages[0];
  const lastMessage = sortedMessages[sortedMessages.length - 1];
  const avgRelevance = messages.reduce((acc, m) => acc + m.relevanceScore, 0) / messages.length;

  // Determine overall sentiment
  const sentiments = messages.map(m => m.sentiment).filter(Boolean);
  const overallSentiment = sentiments.find(s => s === 'negative') ||
                           sentiments.find(s => s === 'positive') ||
                           'neutral';

  // Early return if no messages
  if (!firstMessage) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-muted-foreground">
                {conversationId.substring(0, 8)}...
              </span>
              <Badge variant="outline" className="text-xs">
                {messages.length} message{messages.length > 1 ? 's' : ''}
              </Badge>
              <Badge
                variant={
                  overallSentiment === 'positive' ? 'default' :
                  overallSentiment === 'negative' ? 'destructive' : 'secondary'
                }
                className="text-xs"
              >
                {overallSentiment}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {firstMessage?.customerEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {firstMessage.customerEmail}
                </span>
              )}
              {firstMessage?.domainName && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {firstMessage.domainName}
                </span>
              )}
              {firstMessage && (
                <span>
                  {format(new Date(firstMessage.createdAt), 'PPp')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {Math.round(avgRelevance * 100)}% match
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 w-7 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Preview - Show highlighted snippet */}
        <div className="space-y-2">
          {!expanded ? (
            // Show only the best matching message
            <div className="space-y-2">
              {messages.slice(0, 1).map((message) => (
                <div key={message.messageId} className="flex gap-2">
                  <div className="mt-0.5">
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Bot className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-sm line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: message.highlight }}
                    />
                  </div>
                </div>
              ))}
              {messages.length > 1 && (
                <p className="text-xs text-muted-foreground pl-6">
                  +{messages.length - 1} more message{messages.length > 2 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            // Show all messages when expanded
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedMessages.map((message) => (
                <div key={message.messageId} className="flex gap-2">
                  <div className="mt-0.5">
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Bot className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.role === 'user' ? 'Customer' : 'Assistant'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), 'p')}
                      </span>
                      {message.sentiment && (
                        <Badge
                          variant={
                            message.sentiment === 'positive' ? 'default' :
                            message.sentiment === 'negative' ? 'destructive' : 'secondary'
                          }
                          className="text-xs h-4"
                        >
                          {message.sentiment}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs h-4">
                        {Math.round(message.relevanceScore * 100)}%
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        'text-sm rounded-lg p-2',
                        message.role === 'user' ? 'bg-blue-50' : 'bg-green-50'
                      )}
                    >
                      {/* Show highlighted version if available, otherwise full content */}
                      {message.highlight.includes('<mark>') ? (
                        <div dangerouslySetInnerHTML={{ __html: message.highlight }} />
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export options when expanded */}
        {expanded && (
          <div className="mt-4 pt-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Export single conversation
                window.open(`/api/search/export/pdf?conversationId=${conversationId}&format=conversation_transcript`, '_blank');
              }}
            >
              Export Conversation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}