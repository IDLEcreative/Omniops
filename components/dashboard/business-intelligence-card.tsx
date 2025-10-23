'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Users,
  FileSearch,
  Activity,
  Target
} from 'lucide-react';
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

interface BusinessIntelligenceCardProps {
  domain?: string;
  timeRange?: { start: Date; end: Date };
}

export function BusinessIntelligenceCard({ domain, timeRange }: BusinessIntelligenceCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [domain, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        metric: 'all',
        ...(domain && { domain }),
        ...(timeRange && {
          startDate: timeRange.start.toISOString(),
          endDate: timeRange.end.toISOString(),
        }),
      });

      const response = await fetch(`/api/analytics/intelligence?${params}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="col-span-2">
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderInsightBadge = (insight: any) => {
    const icons: Record<string, React.ReactNode> = {
      critical: <AlertCircle className="h-4 w-4" />,
      high: <TrendingDown className="h-4 w-4" />,
      medium: <Activity className="h-4 w-4" />,
      low: <CheckCircle className="h-4 w-4" />
    };

    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${colors[insight.priority] || colors.low}`}>
        {icons[insight.priority] || icons.low}
        <div className="flex-1">
          <p className="text-sm font-medium">{insight.message}</p>
          {insight.details && (
            <p className="text-xs mt-1 opacity-75">
              Top issues: {insight.details.map((d: any) => d.query).join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Business Intelligence Analytics</CardTitle>
            <CardDescription>
              Deep insights into customer behavior and system performance
            </CardDescription>
          </div>
          {data.summary && (
            <div className="flex gap-2">
              <Badge variant="destructive">
                {data.summary.criticalCount} Critical
              </Badge>
              <Badge variant="outline" className="border-orange-500 text-orange-500">
                {data.summary.highCount} High Priority
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="journey">Journey</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                title="Conversion Rate"
                value={`${((data.customerJourney?.conversionRate || 0) * 100).toFixed(1)}%`}
                trend={data.customerJourney?.conversionRate > 0.2 ? 'up' : 'down'}
                icon={<Target className="h-4 w-4" />}
              />
              <MetricCard
                title="Avg Sessions"
                value={data.customerJourney?.avgSessionsBeforeConversion?.toFixed(1) || '0'}
                trend={data.customerJourney?.avgSessionsBeforeConversion < 4 ? 'up' : 'down'}
                icon={<Users className="h-4 w-4" />}
              />
              <MetricCard
                title="Content Gaps"
                value={data.contentGaps?.length || 0}
                trend={data.contentGaps?.length < 5 ? 'up' : 'down'}
                icon={<FileSearch className="h-4 w-4" />}
              />
              <MetricCard
                title="Peak Hour Load"
                value={`${Math.max(...(data.peakUsage?.hourlyDistribution?.map((h: any) => h.avgRequests) || [0])).toFixed(0)}`}
                subtitle="req/hour"
                icon={<Activity className="h-4 w-4" />}
              />
            </div>

            {data.summary?.insights && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Key Insights</h3>
                {data.summary.insights.slice(0, 3).map((insight: any, idx: number) => (
                  <div key={idx}>{renderInsightBadge(insight)}</div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="journey" className="space-y-4">
            {data.customerJourney && (
              <>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {data.contentGaps && (
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
            )}
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            {data.peakUsage && (
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
            )}
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            {data.conversionFunnel && (
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
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-gray-500">{icon}</div>
          {trend && (
            trend === 'up'
              ? <TrendingUp className="h-4 w-4 text-green-500" />
              : <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-500">
            {title}
            {subtitle && <span className="ml-1">({subtitle})</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}