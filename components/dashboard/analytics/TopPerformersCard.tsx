/**
 * Top Performers Card Component
 *
 * Displays a ranked list of top performing conversations
 * based on a specific metric (response time, engagement, completion).
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TopPerformersCardProps {
  title: string;
  icon: React.ReactNode;
  items: Array<{ conversation_id: string; metric_value: number }>;
  metricLabel: string;
}

export function TopPerformersCard({
  title,
  icon,
  items,
  metricLabel,
}: TopPerformersCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                  {index + 1}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                  {item.conversation_id.slice(-8)}
                </span>
              </div>
              <span className="text-sm font-medium">
                {item.metric_value.toFixed(metricLabel === 'ms' ? 0 : 1)} {metricLabel}
              </span>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
