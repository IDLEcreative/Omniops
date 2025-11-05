'use client';

/**
 * Feedback Dashboard Component
 *
 * Displays user feedback with:
 * - Recent feedback items
 * - Satisfaction score trends
 * - Common issues/requests
 * - Customer sentiment analysis
 * - Actionable insights
 *
 * Used by: Admin dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Lightbulb,
  Bug,
  Star,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface FeedbackItem {
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

interface FeedbackStats {
  total: number;
  by_type: Record<string, number>;
  by_sentiment: Record<string, number>;
  average_rating: number;
  nps_score: number;
}

interface FeedbackDashboardProps {
  domain?: string;
}

// ============================================================================
// Component
// ============================================================================

export default function FeedbackDashboard({ domain }: FeedbackDashboardProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'negative'>('all');

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);
      if (filter === 'urgent') params.append('urgent_only', 'true');
      if (filter === 'negative') params.append('sentiment', 'negative');
      params.append('limit', '50');

      const response = await fetch(`/api/feedback?${params.toString()}`);
      const data = await response.json();

      setFeedback(data.feedback || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  }, [domain, filter]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">
                  {stats.average_rating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">/ 5.0</div>
              </div>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(stats.average_rating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                NPS Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{stats.nps_score}</div>
                {stats.nps_score >= 50 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : stats.nps_score >= 0 ? (
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.nps_score >= 50
                  ? 'Excellent'
                  : stats.nps_score >= 0
                  ? 'Good'
                  : 'Needs Improvement'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Positive</span>
                  <span className="font-semibold">
                    {stats.by_sentiment.positive || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Neutral</span>
                  <span className="font-semibold">
                    {stats.by_sentiment.neutral || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Negative</span>
                  <span className="font-semibold">
                    {stats.by_sentiment.negative || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All Feedback
        </Button>
        <Button
          variant={filter === 'urgent' ? 'default' : 'outline'}
          onClick={() => setFilter('urgent')}
          size="sm"
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Urgent
        </Button>
        <Button
          variant={filter === 'negative' ? 'default' : 'outline'}
          onClick={() => setFilter('negative')}
          size="sm"
        >
          <ThumbsDown className="h-4 w-4 mr-1" />
          Negative
        </Button>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            Latest feedback from your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
