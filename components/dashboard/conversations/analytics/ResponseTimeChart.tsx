'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScreenReaderTable } from './ScreenReaderTable';

interface ResponseTimeTrend {
  date: string;
  avgMinutes: number;
}

interface ResponseTimeChartProps {
  data: ResponseTimeTrend[];
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Response Time Trend</CardTitle>
        <CardDescription>Time to first assistant response (minutes)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            role="img"
            aria-label="Line chart showing average response time trend over time"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
            />
            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number) => [`${value.toFixed(2)} min`, 'Avg Response']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgMinutes"
              stroke="#8884d8"
              strokeWidth={2}
              name="Avg Response (min)"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <ScreenReaderTable
          caption="Response time trend data"
          headers={['Date', 'Average Response Time (minutes)']}
          rows={data.map((row) => [
            new Date(row.date).toLocaleDateString(),
            row.avgMinutes.toFixed(2)
          ])}
        />
      </CardContent>
    </Card>
  );
}
