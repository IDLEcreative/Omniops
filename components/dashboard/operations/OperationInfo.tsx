/**
 * Operation Info Component
 *
 * Displays operation metadata in a grid layout with copy-to-clipboard functionality.
 */

'use client';

import { Operation } from '@/hooks/useOperations';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OperationInfoProps {
  operation: Operation;
  onCopy: (text: string) => void;
}

export function OperationInfo({ operation, onCopy }: OperationInfoProps) {
  const duration =
    operation.completed_at && operation.started_at
      ? Math.round(
          (new Date(operation.completed_at).getTime() -
            new Date(operation.started_at).getTime()) /
            1000
        )
      : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Operation</p>
          <p className="font-medium">{operation.operation}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Created</p>
          <p className="font-medium">
            {formatDistanceToNow(new Date(operation.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Operation ID</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm">{operation.id.slice(0, 8)}...</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(operation.id)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {operation.job_id && (
          <div>
            <p className="text-sm text-gray-500">Job ID</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm">
                {operation.job_id.slice(0, 8)}...
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(operation.job_id!)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        {duration && (
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">{duration}s</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {operation.status === 'active' && operation.progress !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-gray-600">{operation.progress}%</span>
          </div>
          <Progress value={operation.progress} className="h-3" />
        </div>
      )}
    </div>
  );
}
