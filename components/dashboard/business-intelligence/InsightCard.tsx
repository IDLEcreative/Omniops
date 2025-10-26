'use client';

import { AlertCircle, TrendingDown, Activity, CheckCircle } from 'lucide-react';

export interface Insight {
  priority: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  details?: Array<{ query: string }>;
}

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const icons: Record<string, React.ReactNode> = {
    critical: <AlertCircle className="h-4 w-4" />,
    high: <TrendingDown className="h-4 w-4" />,
    medium: <Activity className="h-4 w-4" />,
    low: <CheckCircle className="h-4 w-4" />
  };

  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${colors[insight.priority] || colors.low}`}>
      {icons[insight.priority] || icons.low}
      <div className="flex-1">
        <p className="text-sm font-medium">{insight.message}</p>
        {insight.details && (
          <p className="text-xs mt-1 opacity-75">
            Top issues: {insight.details.map((d) => d.query).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
