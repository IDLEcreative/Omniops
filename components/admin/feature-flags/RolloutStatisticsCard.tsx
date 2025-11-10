/**
 * Rollout Statistics Card Component
 *
 * Displays aggregated statistics for all features with active rollouts:
 * - Success rates
 * - Enabled customers
 * - Error counts
 * - Rollout percentages
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FeatureStatus } from './FeatureRow';

interface RolloutStatisticsCardProps {
  features: FeatureStatus[];
}

export function RolloutStatisticsCard({ features }: RolloutStatisticsCardProps) {
  const featuresWithStats = features.filter(f => f.stats);

  if (featuresWithStats.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rollout Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {featuresWithStats.map(feature => (
            <div key={feature.name} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{feature.displayName}</h4>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
                <Badge
                  variant={feature.stats!.errorRate > 0.05 ? 'destructive' : 'default'}
                >
                  {(feature.stats!.successRate * 100).toFixed(1)}% Success
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Enabled:</span>
                  <br />
                  <span className="font-semibold">
                    {feature.stats!.enabledCustomers} / {feature.stats!.totalCustomers}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Errors:</span>
                  <br />
                  <span className="font-semibold">{feature.stats!.errorCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Error Rate:</span>
                  <br />
                  <span className="font-semibold">
                    {(feature.stats!.errorRate * 100).toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Rollout:</span>
                  <br />
                  <span className="font-semibold">
                    {feature.rollout?.percentage || 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
