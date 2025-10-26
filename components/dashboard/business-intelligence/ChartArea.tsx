'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ChartAreaProps {
  selectedMetric: string;
  data: any;
}

export function ChartArea({ selectedMetric, data }: ChartAreaProps) {
  if (selectedMetric === 'journey' && data.customerJourney) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Common Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.customerJourney.commonPaths?.slice(0, 5).map((path: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">#{idx + 1}</span>
                    <span className="text-sm">{path.path.join(' → ')}</span>
                  </div>
                  <Badge variant="secondary">{path.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Drop-off Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.customerJourney.dropOffPoints?.slice(0, 5).map((point: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{point.stage}</span>
                    <span className="text-xs text-red-600">
                      {(point.dropRate * 100).toFixed(1)}% drop
                    </span>
                  </div>
                  <Progress value={point.dropRate * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedMetric === 'content' && data.contentGaps) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Content Gaps</CardTitle>
          <CardDescription>
            Frequently asked questions without good answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height="300">
            <BarChart data={data.contentGaps.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="query"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="frequency" fill="#8884d8">
                {data.contentGaps.slice(0, 10).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  if (selectedMetric === 'usage' && data.peakUsage) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hourly Usage Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height="250">
              <LineChart data={data.peakUsage.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(hour) => `${hour}:00`}
                  formatter={(value: any) => [`${value.toFixed(0)} requests`, 'Average']}
                />
                <Line
                  type="monotone"
                  dataKey="avgRequests"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Busiest Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.peakUsage.busiestDays?.slice(0, 5).map((day: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <Badge>{day.totalRequests}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Peak Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.peakUsage.peakHours?.map((hour: any) => (
                  <Badge key={hour} variant="outline">
                    {hour}:00 - {hour + 1}:00
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (selectedMetric === 'funnel' && data.conversionFunnel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Conversion Funnel</CardTitle>
          <CardDescription>
            User progression through conversion stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height="350">
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="count"
                data={data.conversionFunnel.stages}
                isAnimationActive
              >
                <LabelList position="center" fill="#fff" />
                {data.conversionFunnel.stages.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  return null;
}
