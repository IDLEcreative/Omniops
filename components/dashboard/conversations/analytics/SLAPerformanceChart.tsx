/**
 * SLA Performance Chart
 *
 * Displays distribution of agent response times across SLA buckets.
 * Shows how quickly agents respond to human handoff requests.
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SLAPerformance {
  within5min: number;
  within15min: number;
  within30min: number;
  over30min: number;
}

interface SLAPerformanceChartProps {
  data: SLAPerformance;
}

const SLA_COLORS = {
  within5min: '#10b981', // green
  within15min: '#3b82f6', // blue
  within30min: '#f59e0b', // orange
  over30min: '#ef4444', // red
};

export function SLAPerformanceChart({ data }: SLAPerformanceChartProps) {
  const chartData = [
    { range: '0-5 min', count: data.within5min, color: SLA_COLORS.within5min },
    { range: '5-15 min', count: data.within15min, color: SLA_COLORS.within15min },
    { range: '15-30 min', count: data.within30min, color: SLA_COLORS.within30min },
    { range: '30+ min', count: data.over30min, color: SLA_COLORS.over30min },
  ];

  const total = data.within5min + data.within15min + data.within30min + data.over30min;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA Performance Distribution</CardTitle>
        <CardDescription>
          Agent response time breakdown ({total} total responses tracked)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="range"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [
                  `${value} requests (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                  'Count',
                ]}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SLA_COLORS.within5min }} />
            <span className="text-muted-foreground">Excellent (0-5 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SLA_COLORS.within15min }} />
            <span className="text-muted-foreground">Good (5-15 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SLA_COLORS.within30min }} />
            <span className="text-muted-foreground">Acceptable (15-30 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SLA_COLORS.over30min }} />
            <span className="text-muted-foreground">Needs Improvement (30+ min)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
