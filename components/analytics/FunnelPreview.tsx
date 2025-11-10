'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FunnelStage {
  id: string;
  name: string;
  order: number;
}

interface FunnelPreviewProps {
  stages: FunnelStage[];
}

export function FunnelPreview({ stages }: FunnelPreviewProps) {
  if (stages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>How your funnel will appear in analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="flex items-center gap-2">
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="w-full h-16 bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center px-3 text-center">
                  <span className="text-sm font-medium">{stage.name || 'Unnamed'}</span>
                </div>
                <Badge variant="secondary" className="mt-2">
                  Stage {idx + 1}
                </Badge>
              </div>
              {idx < stages.length - 1 && (
                <div className="text-2xl text-muted-foreground">→</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
