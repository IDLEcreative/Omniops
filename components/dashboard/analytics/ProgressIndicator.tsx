'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { MetricProgress } from '@/types/dashboard';

interface ProgressIndicatorProps {
  progress: MetricProgress;
  className?: string;
}

export function ProgressIndicator({ progress, className }: ProgressIndicatorProps) {
  const {
    current,
    target,
    percentage,
    status,
  } = progress;

  const getStatusColor = () => {
    switch (status) {
      case 'behind':
        return 'text-red-600 bg-red-50';
      case 'at-risk':
        return 'text-yellow-600 bg-yellow-50';
      case 'on-track':
        return 'text-yellow-600 bg-yellow-50';
      case 'achieved':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'behind':
        return 'bg-red-500';
      case 'at-risk':
        return 'bg-orange-500';
      case 'on-track':
        return 'bg-yellow-500';
      case 'achieved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'behind':
        return 'Behind';
      case 'at-risk':
        return 'At Risk';
      case 'on-track':
        return 'On Track';
      case 'achieved':
        return 'Achieved';
      default:
        return 'No Status';
    }
  };

  const cappedProgress = Math.min(percentage, 110);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {current.toFixed(1)} / Goal: {target.toFixed(1)}
        </span>
        <span className={cn('px-2 py-1 rounded-md text-xs font-medium', getStatusColor())}>
          {getStatusLabel()}
        </span>
      </div>

      <div className="space-y-1">
        <Progress
          value={cappedProgress}
          className="h-2"
          indicatorClassName={getProgressBarColor()}
        />
        <p className="text-xs text-muted-foreground text-right">
          {percentage.toFixed(0)}% to goal
        </p>
      </div>
    </div>
  );
}
