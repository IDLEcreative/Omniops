'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ResponseTimeTrend {
  date: string;
  avgMinutes: number;
}

interface VolumeByHour {
  hour: number;
  count: number;
}

interface StatusOverTime {
  date: string;
  active: number;
  waiting: number;
  resolved: number;
}

interface MessageLengthDist {
  range: string;
  count: number;
}

interface AnalyticsData {
  responseTimeTrend: ResponseTimeTrend[];
  volumeByHour: VolumeByHour[];
  statusOverTime: StatusOverTime[];
  messageLengthDist: MessageLengthDist[];
}

interface ConversationAnalyticsProps {
  days: number;
}

export function ConversationAnalytics({ days }: ConversationAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/dashboard/conversations/analytics?days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error('[Analytics] Fetch error:', err);
        setError('Unable to load analytics data');
      })
      .finally(() => setLoading(false));
  }, [days]);

  const handleExportChart = () => {
    if (!data) return;

    const csvContent = generateCSVContent(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `conversation-analytics-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Conversation Analytics</h2>
            <p className="text-muted-foreground">Visual insights into conversation patterns</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'No analytics data available'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conversation Analytics</h2>
          <p className="text-muted-foreground">Visual insights into conversation patterns</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportChart}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Tabs defaultValue="response-time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="response-time">Response Time</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="status">Status Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="response-time">
          <Card>
            <CardHeader>
              <CardTitle>Average Response Time Trend</CardTitle>
              <CardDescription>Time to first assistant response (minutes)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data.responseTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Volume by Hour</CardTitle>
              <CardDescription>Distribution across 24-hour period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.volumeByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(value) => `${value}:00`}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => `${value}:00 - ${value}:59`}
                    formatter={(value: number) => [value, 'Conversations']}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" name="Conversations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution Over Time</CardTitle>
              <CardDescription>Active, Waiting, and Resolved conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.statusOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Message Length Distribution</CardTitle>
              <CardDescription>Conversations grouped by message count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.messageLengthDist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [value, 'Conversations']} />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Conversations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span>Analytics based on last {days} days of conversation data</span>
      </div>
    </div>
  );
}

function generateCSVContent(data: AnalyticsData): string {
  const lines: string[] = [];

  // Response Time Trend
  lines.push('Response Time Trend');
  lines.push('Date,Average Minutes');
  data.responseTimeTrend.forEach((item) => {
    lines.push(`${item.date},${item.avgMinutes}`);
  });
  lines.push('');

  // Volume by Hour
  lines.push('Volume by Hour');
  lines.push('Hour,Count');
  data.volumeByHour.forEach((item) => {
    lines.push(`${item.hour}:00,${item.count}`);
  });
  lines.push('');

  // Status Over Time
  lines.push('Status Over Time');
  lines.push('Date,Active,Waiting,Resolved');
  data.statusOverTime.forEach((item) => {
    lines.push(`${item.date},${item.active},${item.waiting},${item.resolved}`);
  });
  lines.push('');

  // Message Length Distribution
  lines.push('Message Length Distribution');
  lines.push('Range,Count');
  data.messageLengthDist.forEach((item) => {
    lines.push(`${item.range},${item.count}`);
  });

  return lines.join('\n');
}
