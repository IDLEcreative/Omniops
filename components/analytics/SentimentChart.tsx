import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DashboardAnalyticsData } from '@/types/dashboard';

interface SentimentChartProps {
  data: DashboardAnalyticsData;
}

const COLORS = {
  positive: '#22c55e',
  neutral: '#94a3b8',
  negative: '#ef4444'
};

export function SentimentChart({ data }: SentimentChartProps) {
  const totalMessages = data.metrics.totalMessages;
  const positiveCount = data.metrics.positiveMessages;
  const negativeCount = data.metrics.negativeMessages;
  const neutralCount = totalMessages - positiveCount - negativeCount;

  const chartData = [
    { name: 'Positive', value: positiveCount, percentage: ((positiveCount / totalMessages) * 100).toFixed(1) },
    { name: 'Neutral', value: neutralCount, percentage: ((neutralCount / totalMessages) * 100).toFixed(1) },
    { name: 'Negative', value: negativeCount, percentage: ((negativeCount / totalMessages) * 100).toFixed(1) }
  ].filter(item => item.value > 0);

  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Distribution</CardTitle>
        <CardDescription>
          Breakdown of message sentiment across all conversations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`${value} messages`, 'Count']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
