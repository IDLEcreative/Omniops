/**
 * Overall Health Card Component
 *
 * Displays overall health status and individual health scores
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Zap, MemoryStick, Network } from 'lucide-react';
import { HealthScore } from './HealthScore';
import type { WidgetMetrics } from '@/hooks/usePerformanceData';

interface OverallHealthCardProps {
  metrics: WidgetMetrics;
}

export function OverallHealthCard({ metrics }: OverallHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Overall Health</CardTitle>
            <CardDescription>
              Last updated: {new Date(metrics.timestamp).toLocaleString()}
            </CardDescription>
          </div>
          <Badge
            variant={
              metrics.health.status === 'healthy'
                ? 'default'
                : metrics.health.status === 'degraded'
                  ? 'secondary'
                  : 'destructive'
            }
            className="text-lg px-4 py-2"
          >
            {metrics.health.overall}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <HealthScore
            label="Persistence"
            score={metrics.health.scores.persistence}
            icon={<Database className="h-5 w-5" />}
            target={99}
          />
          <HealthScore
            label="Performance"
            score={metrics.health.scores.performance}
            icon={<Zap className="h-5 w-5" />}
            target={90}
          />
          <HealthScore
            label="Memory"
            score={metrics.health.scores.memory}
            icon={<MemoryStick className="h-5 w-5" />}
            target={85}
          />
          <HealthScore
            label="API"
            score={metrics.health.scores.api}
            icon={<Network className="h-5 w-5" />}
            target={95}
          />
        </div>
      </CardContent>
    </Card>
  );
}
