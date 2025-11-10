/**
 * Metric Card Component
 *
 * Reusable card for displaying a single metric with icon and status color
 */

'use client';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'bad' | 'neutral';
  subtitle?: string;
}

export function MetricCard({ title, value, icon, status = 'neutral', subtitle }: MetricCardProps) {
  const statusColor =
    status === 'good'
      ? 'text-green-600'
      : status === 'warning'
        ? 'text-yellow-600'
        : status === 'bad'
          ? 'text-red-600'
          : 'text-gray-600';

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={statusColor}>{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
