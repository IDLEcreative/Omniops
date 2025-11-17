import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnnotationMarker } from '@/components/dashboard/analytics/AnnotationMarker';
import type { DashboardAnalyticsData, ChartAnnotation } from '@/types/dashboard';

interface ResponseTimeChartProps {
  data: DashboardAnalyticsData;
  annotations?: ChartAnnotation[];
  onAnnotationClick?: (annotation: ChartAnnotation) => void;
}

export function ResponseTimeChart({ data, annotations = [], onAnnotationClick }: ResponseTimeChartProps) {
  const chartData = data.dailySentiment.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    responseTime: data.responseTime,
    messages: day.total
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time Trends</CardTitle>
        <CardDescription>
          Average response time over the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }}
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
            <Line
              type="monotone"
              dataKey="responseTime"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Response Time (s)"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
