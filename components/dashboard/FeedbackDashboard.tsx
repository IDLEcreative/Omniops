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
import { AlertCircle, ThumbsDown, MessageSquare } from 'lucide-react';
import { FeedbackStatsCards } from './FeedbackStatsCards';
import { FeedbackItem } from './FeedbackItem';

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
      {stats && <FeedbackStatsCards stats={stats} />}

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
                <FeedbackItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
