/**
 * Alert History View Component
 * Displays historical alerts with acknowledgment functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AlertHistoryItem {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  condition: 'above' | 'below';
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  notification_sent: boolean;
}

const METRIC_LABELS: Record<string, string> = {
  response_time: 'Response Time',
  error_rate: 'Error Rate',
  sentiment_score: 'Sentiment Score',
  conversion_rate: 'Conversion Rate',
  resolution_rate: 'Resolution Rate',
  message_volume: 'Message Volume',
};

export function AlertHistoryView() {
  const [alerts, setAlerts] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('all');
  const [metricFilter, setMetricFilter] = useState<string>('all');

  useEffect(() => {
    fetchAlertHistory();
  }, [filter, metricFilter]);

  const fetchAlertHistory = async () => {
    try {
      setLoading(true);
      let url = '/api/analytics/alerts?type=history&limit=100';

      if (filter === 'unacknowledged') {
        url += '&unacknowledged=true';
      }

      if (metricFilter !== 'all') {
        url += `&metric=${metricFilter}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch alert history');

      const data = await response.json();
      setAlerts(data.history || []);
    } catch (error) {
      console.error('Error fetching alert history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch('/api/analytics/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });

      if (!response.ok) throw new Error('Failed to acknowledge alert');

      // Refresh list
      await fetchAlertHistory();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getSeverityColor = (alert: AlertHistoryItem): string => {
    const difference =
      alert.condition === 'above'
        ? ((alert.value - alert.threshold) / alert.threshold) * 100
        : ((alert.threshold - alert.value) / alert.threshold) * 100;

    if (difference > 50) return 'destructive';
    if (difference > 20) return 'default';
    return 'secondary';
  };

  const getMetricIcon = (condition: string) => {
    return condition === 'above' ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
  };

  const uniqueMetrics = [...new Set(alerts.map((a) => a.metric))];

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading alert history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alert History</CardTitle>
            <CardDescription>
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} in the last 30 days
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
              </SelectContent>
            </Select>

            <Select value={metricFilter} onValueChange={setMetricFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Metrics</SelectItem>
                {uniqueMetrics.map((metric) => (
                  <SelectItem key={metric} value={metric}>
                    {METRIC_LABELS[metric] || metric}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {filter === 'unacknowledged' ? (
              <div>
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>All alerts have been acknowledged!</p>
              </div>
            ) : (
              <div>
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-muted" />
                <p>No alerts triggered yet</p>
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {METRIC_LABELS[alert.metric] || alert.metric}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {getMetricIcon(alert.condition)}
                      {alert.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.threshold}</TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(alert)}>{alert.value}</Badge>
                  </TableCell>
                  <TableCell>
                    {alert.acknowledged_at ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Acknowledged
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!alert.acknowledged_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
