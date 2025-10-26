'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, TestTube } from 'lucide-react';

interface TrainingHeaderProps {
  showTestWidget: boolean;
  onToggleWidget: () => void;
}

export function TrainingHeader({ showTestWidget, onToggleWidget }: TrainingHeaderProps) {
  return (
    <>
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Bot Training Center</h1>
              <p className="text-muted-foreground mt-1">
                Teach your AI assistant with custom knowledge to deliver accurate, personalized responses
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TestTube className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Test Your Bot</h3>
                <p className="text-xs text-muted-foreground">
                  {showTestWidget ? 'Widget active in bottom-right corner' : 'Try your AI with latest training'}
                </p>
              </div>
            </div>
            <Button
              variant={showTestWidget ? "default" : "secondary"}
              size="sm"
              onClick={onToggleWidget}
              className="ml-4"
            >
              {showTestWidget ? 'Hide Widget' : 'Show Widget'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
