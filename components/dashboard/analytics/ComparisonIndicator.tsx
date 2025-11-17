import type { ComparisonMetric } from '@/types/dashboard';
import { getTrendColor, getTrendIcon, formatPercentChange } from '@/lib/dashboard/analytics/comparison';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ComparisonIndicatorProps {
  current: number;
  previous: number;
  comparison: ComparisonMetric;
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  increaseIsGood?: boolean;
  className?: string;
}

/**
 * Format value based on format type
 */
function formatValue(value: number, format: 'number' | 'percentage' | 'currency' | 'duration'): string {
  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return `$${value.toFixed(2)}`;
    case 'duration':
      if (value < 60) return `${value}s`;
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    case 'number':
    default:
      return value.toLocaleString();
  }
}

export function ComparisonIndicator({
  current,
  previous,
  comparison,
  format = 'number',
  increaseIsGood = true,
  className = '',
}: ComparisonIndicatorProps) {
  const { percentChange, trend } = comparison;

  if (trend === 'neutral') {
    return (
      <span className={`text-sm text-gray-500 ${className}`}>
        No change
      </span>
    );
  }

  const colorClass = getTrendColor(trend, increaseIsGood);
  const icon = getTrendIcon(trend);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`text-sm font-medium ${colorClass} ${className}`}>
            {formatPercentChange(percentChange)} {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div>Current: {formatValue(current, format)}</div>
            <div>Previous: {formatValue(previous, format)}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
