'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LightbulbIcon, Info } from 'lucide-react';

export function TrainingTips() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
        <LightbulbIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle>Pro Tips</AlertTitle>
        <AlertDescription className="mt-2 space-y-1">
          <p className="text-sm">Mix different data types for comprehensive coverage</p>
          <p className="text-sm">Update Q&As regularly based on customer feedback</p>
          <p className="text-sm">Include product specs and policies for accuracy</p>
        </AlertDescription>
      </Alert>

      <Alert className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle>Best Practices</AlertTitle>
        <AlertDescription className="mt-2 space-y-1">
          <p className="text-sm">Keep answers concise and customer-friendly</p>
          <p className="text-sm">Cover edge cases and common variations</p>
          <p className="text-sm">Test responses after training updates</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
