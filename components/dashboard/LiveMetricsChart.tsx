'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface LiveMetricsChartProps {
  data: DataPoint[];
  title?: string;
  loading?: boolean;
  className?: string;
  color?: string;
  height?: number;
  showArea?: boolean;
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
}

export function LiveMetricsChart({
  data,
  title = 'Live Metrics',
  loading = false,
  className,
  color = '#3B82F6',
  height = 300,
  showArea = false,
  yAxisLabel,
  formatValue = (v) => v.toString()
}: LiveMetricsChartProps) {
  const formattedData = useMemo(() => {
    // Keep only the last 20 data points for smooth animation
    const recentData = data.slice(-20);

    return recentData.map(point => ({
      time: format(new Date(point.timestamp), 'HH:mm:ss'),
      value: point.value,
      label: point.label || format(new Date(point.timestamp), 'HH:mm:ss')
    }));
  }, [data]);

  const ChartComponent = showArea ? AreaChart : LineChart;

  if (loading) {
    return (
      <div className={cn(
        'rounded-lg border bg-white p-6',
        className
      )}>
        <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className={`bg-gray-100 rounded animate-pulse`} style={{ height }}></div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border bg-white p-6',
      className
    )}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={formattedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="time"
            stroke="#6B7280"
            tick={{ fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis
            stroke="#6B7280"
            tick={{ fontSize: 12 }}
            tickFormatter={formatValue}
            tickMargin={8}
            label={yAxisLabel ? {
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: 12, fill: '#6B7280' }
            } : undefined}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value: any) => [formatValue(value), 'Value']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          {showArea ? (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={`${color}20`}
              strokeWidth={2}
              dot={false}
              animationDuration={300}
              animationEasing="ease-in-out"
            />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              animationDuration={300}
              animationEasing="ease-in-out"
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {formattedData.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          No data available yet
        </div>
      )}
    </div>
  );
}

export default LiveMetricsChart;