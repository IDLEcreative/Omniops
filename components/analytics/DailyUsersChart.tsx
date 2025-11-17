'use client';

import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users } from 'lucide-react';
import { AnnotationMarker } from '@/components/dashboard/analytics/AnnotationMarker';
import type { ChartAnnotation } from '@/types/dashboard';

interface DailyUserData {
  date: string;
  users: number;
  newUsers: number;
  returningUsers: number;
  sessions: number;
  avgSessionDuration: number;
  pageViews: number;
}

interface DailyUsersChartProps {
  data: DailyUserData[];
  showNewVsReturning?: boolean;
  annotations?: ChartAnnotation[];
  onAnnotationClick?: (annotation: ChartAnnotation) => void;
}

export function DailyUsersChart({
  data,
  showNewVsReturning = true,
  annotations = [],
  onAnnotationClick,
}: DailyUsersChartProps) {
  // Format date for display
  const formattedData = data.map(day => ({
    ...day,
    displayDate: new Date(day.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
  }));

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          {showNewVsReturning ? 'New vs Returning Users' : 'Daily Active Users'}
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {showNewVsReturning ? (
          <AreaChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="displayDate"
              className="text-xs text-muted-foreground"
            />
            <YAxis className="text-xs text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            {annotations.map((annotation) => (
              <AnnotationMarker
                key={annotation.id}
                annotation={annotation}
                dateKey="displayDate"
                onClick={onAnnotationClick}
              />
            ))}
            <Area
              type="monotone"
              dataKey="newUsers"
              stackId="1"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              name="New Users"
            />
            <Area
              type="monotone"
              dataKey="returningUsers"
              stackId="1"
              stroke="hsl(var(--secondary))"
              fill="hsl(var(--secondary))"
              name="Returning Users"
            />
          </AreaChart>
        ) : (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="displayDate"
              className="text-xs text-muted-foreground"
            />
            <YAxis className="text-xs text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            {annotations.map((annotation) => (
              <AnnotationMarker
                key={annotation.id}
                annotation={annotation}
                dateKey="displayDate"
                onClick={onAnnotationClick}
              />
            ))}
            <Line
              type="monotone"
              dataKey="users"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
              name="Daily Active Users"
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-muted-foreground">Total Sessions</div>
          <div className="text-lg font-semibold">
            {formattedData.reduce((sum, day) => sum + day.sessions, 0)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Total Page Views</div>
          <div className="text-lg font-semibold">
            {formattedData.reduce((sum, day) => sum + day.pageViews, 0)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Avg Duration</div>
          <div className="text-lg font-semibold">
            {Math.round(
              formattedData.reduce((sum, day) => sum + day.avgSessionDuration, 0) /
              (formattedData.length || 1)
            )}s
          </div>
        </div>
      </div>
    </Card>
  );
}
