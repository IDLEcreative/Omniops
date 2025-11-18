import type { MetricGoal, MetricProgress } from '@/types/dashboard';

export function calculateMetricProgress(
  metricName: string,
  currentValue: number,
  goals: MetricGoal[]
): MetricProgress | null {
  const goal = goals.find(g => g.metric === metricName);

  if (!goal) {
    return null;
  }

  const targetValue = goal.targetValue;
  const progressPercentage = (currentValue / targetValue) * 100;

  let status: MetricProgress['status'];
  if (progressPercentage < 50) {
    status = 'behind';
  } else if (progressPercentage < 90) {
    status = 'on-track';
  } else if (progressPercentage < 110) {
    status = 'achieved';
  } else {
    status = 'achieved'; // Map 'exceeded' to 'achieved' for type compatibility
  }

  return {
    current: currentValue,
    target: targetValue,
    percentage: progressPercentage,
    status,
  };
}

export function calculateAllMetricProgress(
  metrics: Record<string, number>,
  goals: MetricGoal[]
): Record<string, MetricProgress> {
  const progress: Record<string, MetricProgress> = {};

  for (const [metricName, currentValue] of Object.entries(metrics)) {
    const metricProgress = calculateMetricProgress(metricName, currentValue, goals);
    if (metricProgress) {
      progress[metricName] = metricProgress;
    }
  }

  return progress;
}
