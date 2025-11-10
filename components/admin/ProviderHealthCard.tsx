'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProviderHealthMetric {
  platform: string;
  successRate: number;
  avgDuration: number;
  totalAttempts: number;
}

interface ProviderHealthCardProps {
  providerHealth: ProviderHealthMetric[];
}

const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatDuration = (ms: number) => `${ms.toFixed(0)}ms`;

const getSuccessRateBadge = (rate: number) => {
  if (rate >= 0.95) return <Badge className="bg-green-500">Excellent</Badge>;
  if (rate >= 0.85) return <Badge className="bg-yellow-500">Good</Badge>;
  if (rate >= 0.70) return <Badge className="bg-orange-500">Fair</Badge>;
  return <Badge className="bg-red-500">Poor</Badge>;
};

export function ProviderHealthCard({ providerHealth }: ProviderHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Health</CardTitle>
        <CardDescription>Success rates and performance by platform</CardDescription>
      </CardHeader>
      <CardContent>
        {providerHealth.length === 0 ? (
          <p className="text-muted-foreground">No provider resolution attempts recorded</p>
        ) : (
          <div className="space-y-4">
            {providerHealth.map((metric) => (
              <div key={metric.platform} className="flex items-center justify-between border-b pb-4">
                <div>
                  <div className="font-medium capitalize">{metric.platform || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">
                    {metric.totalAttempts} attempts
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                    <div className="font-medium">{formatPercentage(metric.successRate)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Avg Duration</div>
                    <div className="font-medium">{formatDuration(metric.avgDuration)}</div>
                  </div>
                  {getSuccessRateBadge(metric.successRate)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
