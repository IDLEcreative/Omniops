'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react';

interface HealthScoreSummaryProps {
  healthScore: number;
  avgP95: number;
  totalThroughput: number;
  avgErrorRate: number;
}

const getHealthStatus = (score: number) => {
  if (score >= 90) return { label: 'Excellent', color: 'text-green-600', icon: CheckCircle };
  if (score >= 70) return { label: 'Good', color: 'text-blue-600', icon: Activity };
  if (score >= 50) return { label: 'Fair', color: 'text-yellow-600', icon: AlertTriangle };
  return { label: 'Poor', color: 'text-red-600', icon: AlertTriangle };
};

export function HealthScoreSummary({
  healthScore,
  avgP95,
  totalThroughput,
  avgErrorRate,
}: HealthScoreSummaryProps) {
  const healthStatus = getHealthStatus(healthScore);
  const HealthIcon = healthStatus.icon;

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <HealthIcon className={`h-5 w-5 ${healthStatus.color}`} />
            <Badge variant="outline">{healthStatus.label}</Badge>
          </div>
          <p className="text-2xl font-bold">{healthScore.toFixed(0)}</p>
          <p className="text-xs text-gray-500">Health Score</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{avgP95.toFixed(0)}ms</p>
          <p className="text-xs text-gray-500">Avg P95 Latency</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold">{totalThroughput.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Req/sec</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold">{avgErrorRate.toFixed(2)}%</p>
          <p className="text-xs text-gray-500">Error Rate</p>
        </CardContent>
      </Card>
    </div>
  );
}
