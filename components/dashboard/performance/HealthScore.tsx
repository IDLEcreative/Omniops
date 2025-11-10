/**
 * Health Score Component
 *
 * Displays a single health metric with icon, score, and progress bar
 */

'use client';

import { Progress } from '@/components/ui/progress';

interface HealthScoreProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  target: number;
}

export function HealthScore({ label, score, icon, target }: HealthScoreProps) {
  const status = score >= target ? 'good' : score >= target - 10 ? 'warning' : 'bad';
  const color =
    status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="text-center">
      <div className={`flex items-center justify-center mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold">{score}%</p>
      <p className="text-sm text-gray-500">{label}</p>
      <Progress value={score} className="mt-2 h-2" />
      <p className="text-xs text-gray-400 mt-1">Target: {target}%</p>
    </div>
  );
}
