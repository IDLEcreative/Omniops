'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MessageSquare, Star } from 'lucide-react';

interface FeedbackStats {
  total: number;
  by_type: Record<string, number>;
  by_sentiment: Record<string, number>;
  average_rating: number;
  nps_score: number;
}

interface FeedbackStatsCardsProps {
  stats: FeedbackStats;
}

export function FeedbackStatsCards({ stats }: FeedbackStatsCardsProps) {
  return (
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
  );
}
