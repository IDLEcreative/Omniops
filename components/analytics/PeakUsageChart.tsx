import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PeakUsagePattern } from '@/lib/analytics/business-intelligence-types';

interface PeakUsageChartProps {
  data: PeakUsagePattern;
}

export function PeakUsageChart({ data }: PeakUsageChartProps) {
  const chartData = data.hourlyDistribution.map((hour, index) => ({
    hour: `${index}:00`,
    messages: hour.avgMessages,
    responseTime: hour.avgResponseTime
  }));

  const peakHourIndices = new Set(data.peakHours.map(h => h.hour));
  const quietHourIndices = new Set(data.quietHours.map(h => h.hour));

  const getBarColor = (index: number) => {
    if (peakHourIndices.has(index)) return '#ef4444';
    if (quietHourIndices.has(index)) return '#94a3b8';
    return 'hsl(var(--primary))';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak Usage Patterns</CardTitle>
        <CardDescription>
          Hourly message volume with peak hours highlighted in red
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="hour"
              className="text-xs"
              tick={{ fontSize: 10 }}
              interval={2}
            />
            <YAxis
              label={{ value: 'Avg Messages', angle: -90, position: 'insideLeft' }}
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="messages" name="Average Messages">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Peak Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded" />
            <span>Quiet Hours</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
