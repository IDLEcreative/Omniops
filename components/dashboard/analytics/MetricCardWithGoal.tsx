'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressIndicator } from './ProgressIndicator';
import type { MetricProgress } from '@/types/dashboard';

interface MetricCardWithGoalProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: LucideIcon;
  description?: string;
  formatValue?: (value: number | string) => string;
  className?: string;
  progress?: MetricProgress;
  rightSlot?: React.ReactNode;
}

export function MetricCardWithGoal({
  title,
  value,
  trend,
  icon: Icon,
  description,
  formatValue,
  className,
  progress,
  rightSlot,
}: MetricCardWithGoalProps) {
  const displayValue = formatValue && typeof value === 'number'
    ? formatValue(value)
    : value;

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="text-2xl font-bold">{displayValue}</div>
          {rightSlot && <div className="ml-2">{rightSlot}</div>}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        {trend !== undefined && !rightSlot && (
          <div className={cn(
            'flex items-center text-xs',
            trendPositive && 'text-green-600',
            trendNegative && 'text-red-600',
            trend === 0 && 'text-gray-600'
          )}>
            {trendPositive && <ArrowUp className="h-3 w-3 mr-1" />}
            {trendNegative && <ArrowDown className="h-3 w-3 mr-1" />}
            <span>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% from previous period
            </span>
          </div>
        )}

        {progress && (
          <div className="pt-2 border-t">
            <ProgressIndicator progress={progress} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
