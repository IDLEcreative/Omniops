/**
 * Alert Settings Component
 * Manages alert threshold configuration for analytics metrics
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Bell, BellOff } from 'lucide-react';

interface AlertThreshold {
  id: string;
  metric: string;
  condition: 'above' | 'below';
  threshold: number;
  enabled: boolean;
  notification_channels: string[];
}

const METRIC_OPTIONS = [
  { value: 'response_time', label: 'Response Time (seconds)' },
  { value: 'error_rate', label: 'Error Rate (%)' },
  { value: 'sentiment_score', label: 'Sentiment Score (0-5)' },
  { value: 'conversion_rate', label: 'Conversion Rate (%)' },
  { value: 'resolution_rate', label: 'Resolution Rate (%)' },
  { value: 'message_volume', label: 'Message Volume' },
];

const NOTIFICATION_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'slack', label: 'Slack' },
  { value: 'webhook', label: 'Webhook' },
];

export function AlertSettings() {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newAlert, setNewAlert] = useState({
    metric: 'response_time',
    condition: 'above' as 'above' | 'below',
    threshold: 1000,
    enabled: true,
    notification_channels: ['email'],
  });

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/alerts?type=thresholds');
      if (!response.ok) throw new Error('Failed to fetch thresholds');

      const data = await response.json();
      setThresholds(data.thresholds || []);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlert = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/analytics/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert),
      });

      if (!response.ok) throw new Error('Failed to create alert');

      // Reset form
      setNewAlert({
        metric: 'response_time',
        condition: 'above',
        threshold: 1000,
        enabled: true,
        notification_channels: ['email'],
      });

      // Refresh list
      await fetchThresholds();
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/analytics/alerts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete alert');

      await fetchThresholds();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleToggleAlert = async (threshold: AlertThreshold) => {
    try {
      const response = await fetch('/api/analytics/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...threshold,
          enabled: !threshold.enabled,
        }),
      });

      if (!response.ok) throw new Error('Failed to update alert');

      await fetchThresholds();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getMetricLabel = (metric: string) => {
    return METRIC_OPTIONS.find((m) => m.value === metric)?.label || metric;
  };

  if (loading) {
    return <div className="text-center py-8">Loading alert settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Alert</CardTitle>
          <CardDescription>
            Create a new threshold-based alert to monitor your analytics metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metric">Metric</Label>
              <Select
                value={newAlert.metric}
                onValueChange={(value) => setNewAlert({ ...newAlert, metric: value })}
              >
                <SelectTrigger id="metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={newAlert.condition}
                onValueChange={(value: 'above' | 'below') =>
                  setNewAlert({ ...newAlert, condition: value })
                }
              >
                <SelectTrigger id="condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold</Label>
              <Input
                id="threshold"
                type="number"
                value={newAlert.threshold}
                onChange={(e) =>
                  setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })
                }
                step="0.1"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAddAlert} disabled={saving} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Alert
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>
            {thresholds.length} alert{thresholds.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {thresholds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No alerts configured. Add your first alert above.
            </div>
          ) : (
            <div className="space-y-3">
              {thresholds.map((threshold) => (
                <div
                  key={threshold.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant={threshold.enabled ? 'default' : 'secondary'}>
                        {threshold.enabled ? (
                          <>
                            <Bell className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <BellOff className="mr-1 h-3 w-3" />
                            Disabled
                          </>
                        )}
                      </Badge>
                      <span className="font-medium">{getMetricLabel(threshold.metric)}</span>
                      <span className="text-muted-foreground">
                        {threshold.condition} {threshold.threshold}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Notifications: {threshold.notification_channels.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAlert(threshold)}
                    >
                      {threshold.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAlert(threshold.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
