'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScreenReaderTable } from './ScreenReaderTable';

interface MessageLengthDist {
  range: string;
  count: number;
}

interface MessageLengthChartProps {
  data: MessageLengthDist[];
}

export function MessageLengthChart({ data }: MessageLengthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Length Distribution</CardTitle>
        <CardDescription>Conversations grouped by message count</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            role="img"
            aria-label="Bar chart showing distribution of conversations by message count"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="range"
              label={{ value: 'Message Count Range', position: 'insideBottom', offset: -5 }}
            />
            <YAxis label={{ value: 'Conversations', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value: number) => [value, 'Conversations']} />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Conversations" />
          </BarChart>
        </ResponsiveContainer>
        <ScreenReaderTable
          caption="Message length distribution data"
          headers={['Message Count Range', 'Conversation Count']}
          rows={data.map((row) => [row.range, row.count.toString()])}
        />
      </CardContent>
    </Card>
  );
}
