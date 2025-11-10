/**
 * Operations List Component
 *
 * Displays list of autonomous operations with status, progress, and actions.
 */

'use client';

import { Operation } from '@/hooks/useOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  MoreVertical,
  Eye,
  RotateCw,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  PlayCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OperationsListProps {
  operations: Operation[];
  loading: boolean;
  onOperationClick: (operationId: string) => void;
  onRefresh: () => void;
}

export function OperationsList({
  operations,
  loading,
  onOperationClick,
  onRefresh,
}: OperationsListProps) {
  const getStatusIcon = (status: Operation['status']) => {
    switch (status) {
      case 'pending':
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <PlayCircle className="h-4 w-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Pause className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Operation['status']) => {
    switch (status) {
      case 'pending':
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getServiceBadge = (service: Operation['service']) => {
    const colors = {
      woocommerce: 'bg-purple-100 text-purple-800 border-purple-200',
      shopify: 'bg-green-100 text-green-800 border-green-200',
      bigcommerce: 'bg-blue-100 text-blue-800 border-blue-200',
      stripe: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[service] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading && operations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (operations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-1">No operations yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Start your first autonomous operation to see it here
            </p>
            <Button>Create Operation</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Operations ({operations.length})</CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {operations.map((operation) => (
            <div
              key={operation.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onOperationClick(operation.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getServiceBadge(operation.service)}>
                      {operation.service}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(operation.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(operation.status)}
                        {operation.status}
                      </span>
                    </Badge>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">{operation.operation}</p>
                  <p className="text-sm text-gray-500">
                    Created {formatDistanceToNow(new Date(operation.created_at), { addSuffix: true })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onOperationClick(operation.id);
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {operation.status === 'failed' && (
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <RotateCw className="h-4 w-4 mr-2" />
                        Retry
                      </DropdownMenuItem>
                    )}
                    {(operation.status === 'pending' || operation.status === 'queued' || operation.status === 'active') && (
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-red-600">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Progress Bar for Active Operations */}
              {operation.status === 'active' && operation.progress !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{operation.progress}%</span>
                  </div>
                  <Progress value={operation.progress} className="h-2" />
                </div>
              )}

              {/* Error Message for Failed Operations */}
              {operation.status === 'failed' && operation.error_message && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium mb-1">Error:</p>
                  <p className="text-sm text-red-700">{operation.error_message}</p>
                </div>
              )}

              {/* Completion Info */}
              {operation.status === 'completed' && operation.completed_at && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>
                    Completed {formatDistanceToNow(new Date(operation.completed_at), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
