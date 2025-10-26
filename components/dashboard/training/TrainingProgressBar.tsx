'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Brain,
  Sparkles,
  Clock,
  TrendingUp,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface TrainingProgressBarProps {
  totalItems: number;
  trainingProgress: number;
  isTraining: boolean;
}

export function TrainingProgressBar({
  totalItems,
  trainingProgress,
  isTraining
}: TrainingProgressBarProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow duration-200 border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            Active training items
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow duration-200 border-blue-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Training Status</CardTitle>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Brain className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isTraining ? 'Processing' : 'Ready'}
          </div>
          <Progress value={trainingProgress} className="mt-2 h-2" />
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow duration-200 border-green-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Quality</CardTitle>
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Sparkles className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">94%</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            Excellent performance
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow duration-200 border-orange-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2h ago</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <RefreshCw className="h-3 w-3 text-orange-600" />
            Auto-sync active
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
