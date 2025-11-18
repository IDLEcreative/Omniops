'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, AlertCircle, Trash2 } from 'lucide-react';
import { useMetricGoals } from '@/hooks/use-metric-goals';
import type { MetricGoalInput, MetricGoalPeriod, MetricGoal } from '@/types/dashboard';

interface GoalSettingsProps {
  onGoalUpdate?: () => void;
}

const METRIC_OPTIONS = [
  { value: 'conversion_rate', label: 'Conversion Rate', unit: '%', max: 100 },
  { value: 'daily_active_users', label: 'Daily Active Users', unit: 'users', max: 10000 },
  { value: 'response_time', label: 'Response Time', unit: 'ms', max: 5000 },
  { value: 'satisfaction_score', label: 'Satisfaction Score', unit: '%', max: 100 },
  { value: 'resolution_rate', label: 'Resolution Rate', unit: '%', max: 100 },
];

export function GoalSettings({ onGoalUpdate }: GoalSettingsProps) {
  const [open, setOpen] = useState(false);
  const [metricName, setMetricName] = useState<string>('');
  const [targetValue, setTargetValue] = useState<string>('');
  const [period, setPeriod] = useState<MetricGoalPeriod>('monthly');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { goals, loading, createGoal, deleteGoal } = useMetricGoals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!metricName) {
      setError('Please select a metric');
      return;
    }

    const value = parseFloat(targetValue);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    const selectedMetric = METRIC_OPTIONS.find(m => m.value === metricName);
    if (selectedMetric && value > selectedMetric.max) {
      setError(`Target value cannot exceed ${selectedMetric.max}${selectedMetric.unit}`);
      return;
    }

    setIsSubmitting(true);

    const input: MetricGoalInput = {
      metric_name: metricName,
      target_value: value,
      period,
    };

    const result = await createGoal(input);

    setIsSubmitting(false);

    if (result) {
      setMetricName('');
      setTargetValue('');
      setPeriod('monthly');
      setOpen(false);
      onGoalUpdate?.();
    } else {
      setError('Failed to create goal. It may already exist.');
    }
  };

  const handleDelete = async (goalId: string) => {
    const success = await deleteGoal(goalId);
    if (success) {
      onGoalUpdate?.();
    }
  };

  const selectedMetric = METRIC_OPTIONS.find(m => m.value === metricName);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Target className="h-4 w-4" />
          Set Goals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Metric Goals</DialogTitle>
          <DialogDescription>
            Set targets for key metrics to track your progress
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metric">Metric</Label>
              <Select value={metricName} onValueChange={setMetricName}>
                <SelectTrigger id="metric">
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">
                Target Value
                {selectedMetric && ` (${selectedMetric.unit})`}
              </Label>
              <Input
                id="target"
                type="number"
                step="0.01"
                min="0"
                max={selectedMetric?.max}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Enter target value"
                required
              />
              {selectedMetric && (
                <p className="text-xs text-muted-foreground">
                  Maximum: {selectedMetric.max}{selectedMetric.unit}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Time Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as MetricGoalPeriod)}>
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>

        {!loading && goals.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold">Current Goals</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {goals.map((goal) => {
                const metric = METRIC_OPTIONS.find(m => m.value === goal.metric);
                return (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {metric?.label || goal.metric}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target: {goal.targetValue}{metric?.unit} ({goal.period})
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
