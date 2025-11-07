'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScreenReaderTable } from './ScreenReaderTable';

interface StatusOverTime {
  date: string;
  active: number;
  waiting: number;
  resolved: number;
}

interface StatusOverTimeChartProps {
  data: StatusOverTime[];
}

export function StatusOverTimeChart({ data }: StatusOverTimeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution Over Time</CardTitle>
        <CardDescription>Active, Waiting, and Resolved conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={data}
            role="img"
            aria-label="Stacked area chart showing distribution of conversation statuses over time"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
            />
            <YAxis label={{ value: 'Conversations', angle: -90, position: 'insideLeft' }} />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
            <Legend />
            <Area
              type="monotone"
              dataKey="active"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              name="Active"
            />
            <Area
              type="monotone"
              dataKey="waiting"
              stackId="1"
              stroke="#ffc658"
              fill="#ffc658"
              name="Waiting"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stackId="1"
              stroke="#82ca9d"
              fill="#82ca9d"
              name="Resolved"
            />
          </AreaChart>
        </ResponsiveContainer>
        <ScreenReaderTable
          caption="Status distribution over time data"
          headers={['Date', 'Active', 'Waiting', 'Resolved']}
          rows={data.map((row) => [
            new Date(row.date).toLocaleDateString(),
            row.active.toString(),
            row.waiting.toString(),
            row.resolved.toString()
          ])}
        />
      </CardContent>
    </Card>
  );
}
