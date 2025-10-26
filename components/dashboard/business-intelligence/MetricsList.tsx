'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
}

function MetricCard({ title, value, subtitle, trend, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-gray-500">{icon}</div>
          {trend && (
            trend === 'up'
              ? <TrendingUp className="h-4 w-4 text-green-500" />
              : <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-500">
            {title}
            {subtitle && <span className="ml-1">({subtitle})</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricsListProps {
  metrics: Array<MetricCardProps>;
}

export function MetricsList({ metrics }: MetricsListProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <MetricCard key={idx} {...metric} />
      ))}
    </div>
  );
}
