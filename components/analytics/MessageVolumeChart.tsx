import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnnotationMarker } from '@/components/dashboard/analytics/AnnotationMarker';
import type { DashboardAnalyticsData, ChartAnnotation } from '@/types/dashboard';

interface MessageVolumeChartProps {
  data: DashboardAnalyticsData;
  annotations?: ChartAnnotation[];
  onAnnotationClick?: (annotation: ChartAnnotation) => void;
}

export function MessageVolumeChart({ data, annotations = [], onAnnotationClick }: MessageVolumeChartProps) {
  const chartData = data.dailySentiment.map((day: any) => {
    const userMessages = Math.round(day.total * 0.5);
    const assistantMessages = day.total - userMessages;

    return {
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      userMessages,
      assistantMessages,
      total: day.total
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Volume</CardTitle>
        <CardDescription>
          Daily message distribution between users and assistant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Messages', angle: -90, position: 'insideLeft' }}
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
            <Legend />
            {annotations.map((annotation) => (
              <AnnotationMarker
                key={annotation.id}
                annotation={annotation}
                dateKey="date"
                onClick={onAnnotationClick}
              />
            ))}
            <Bar
              dataKey="userMessages"
              stackId="a"
              fill="hsl(var(--primary))"
              name="User Messages"
            />
            <Bar
              dataKey="assistantMessages"
              stackId="a"
              fill="hsl(var(--muted))"
              name="Assistant Messages"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
