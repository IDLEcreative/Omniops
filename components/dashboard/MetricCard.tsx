'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  loading = false,
  className,
  icon,
  color = 'default'
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;

    const iconClass = cn('w-4 h-4', {
      'text-green-600': trend === 'up',
      'text-red-600': trend === 'down',
      'text-gray-500': trend === 'neutral'
    });

    switch (trend) {
      case 'up':
        return <ArrowUp className={iconClass} />;
      case 'down':
        return <ArrowDown className={iconClass} />;
      case 'neutral':
        return <Minus className={iconClass} />;
      default:
        return null;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  if (loading) {
    return (
      <div className={cn(
        'rounded-lg border p-6 animate-pulse',
        getColorClasses(),
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          {icon && (
            <div className="ml-4 h-10 w-10 bg-gray-200 rounded"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border p-6 transition-all duration-200 hover:shadow-md',
      getColorClasses(),
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">
              {value}
            </span>
            {trend && trendValue && (
              <span className="ml-2 flex items-center text-sm">
                {getTrendIcon()}
                <span className={cn(
                  'ml-1',
                  {
                    'text-green-600': trend === 'up',
                    'text-red-600': trend === 'down',
                    'text-gray-500': trend === 'neutral'
                  }
                )}>
                  {trendValue}
                </span>
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}