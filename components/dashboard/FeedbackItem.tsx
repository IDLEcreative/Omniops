'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bug,
  Lightbulb,
  Star,
} from 'lucide-react';

interface FeedbackItemData {
  id: string;
  type: 'satisfaction' | 'bug' | 'feature_request' | 'general' | 'nps';
  rating?: number;
  nps_score?: number;
  message?: string;
  category?: string;
  sentiment: 'negative' | 'neutral' | 'positive';
  is_urgent: boolean;
  domain: string;
  created_at: string;
  conversation_id?: string;
}

interface FeedbackItemProps {
  item: FeedbackItemData;
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return <ThumbsUp className="h-4 w-4 text-green-600" />;
    case 'negative':
      return <ThumbsDown className="h-4 w-4 text-red-600" />;
    default:
      return <MessageSquare className="h-4 w-4 text-gray-600" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'bug':
      return <Bug className="h-4 w-4 text-red-600" />;
    case 'feature_request':
      return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    case 'nps':
      return <Star className="h-4 w-4 text-blue-600" />;
    default:
      return <MessageSquare className="h-4 w-4 text-gray-600" />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function FeedbackItem({ item }: FeedbackItemProps) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        item.is_urgent ? 'border-red-300 bg-red-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTypeIcon(item.type)}
          <span className="font-medium capitalize">
            {item.type.replace('_', ' ')}
          </span>
          {item.is_urgent && (
            <Badge variant="destructive">Urgent</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getSentimentIcon(item.sentiment)}
          <span className="text-sm text-gray-500">
            {formatDate(item.created_at)}
          </span>
        </div>
      </div>

      {item.rating && (
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= item.rating!
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {item.nps_score !== undefined && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">
            NPS Score:
          </span>
          <span className="ml-2 font-semibold">
            {item.nps_score}/10
          </span>
        </div>
      )}

      {item.message && (
        <p className="text-gray-700 mb-2">{item.message}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{item.domain}</span>
        {item.category && (
          <Badge variant="outline">{item.category}</Badge>
        )}
        {item.conversation_id && (
          <Button variant="link" size="sm" className="p-0 h-auto">
            View Conversation
          </Button>
        )}
      </div>
    </div>
  );
}
