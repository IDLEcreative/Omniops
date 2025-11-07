'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScreenReaderTable } from './ScreenReaderTable';

interface VolumeByHour {
  hour: number;
  count: number;
}

interface VolumeByHourChartProps {
  data: VolumeByHour[];
}

export function VolumeByHourChart({ data }: VolumeByHourChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Volume by Hour</CardTitle>
        <CardDescription>Distribution across 24-hour period</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            role="img"
            aria-label="Bar chart showing conversation volume distribution by hour of day"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tickFormatter={(value) => `${value}:00`}
              label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
            />
            <YAxis label={{ value: 'Conversations', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              labelFormatter={(value) => `${value}:00 - ${value}:59`}
              formatter={(value: number) => [value, 'Conversations']}
            />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" name="Conversations" />
          </BarChart>
        </ResponsiveContainer>
        <ScreenReaderTable
          caption="Volume by hour data"
          headers={['Hour', 'Conversation Count']}
          rows={data.map((row) => [`${row.hour}:00`, row.count.toString()])}
        />
      </CardContent>
    </Card>
  );
}
