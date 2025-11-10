/**
 * Operation Details Modal
 *
 * Displays detailed information about a specific operation including logs,
 * execution steps, results, and manual control actions.
 */

'use client';

import { useState, useEffect } from 'react';
import { Operation } from '@/hooks/useOperations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCw, XCircle } from 'lucide-react';
import { OperationInfo } from './OperationInfo';
import { OperationTabs } from './OperationTabs';

interface OperationDetailsModalProps {
  operationId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function OperationDetailsModal({
  operationId,
  onClose,
  onRefresh,
}: OperationDetailsModalProps) {
  const [operation, setOperation] = useState<Operation | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOperation();

    // Auto-refresh for active operations
    const interval = setInterval(() => {
      if (operation?.status === 'active' || operation?.status === 'queued') {
        fetchOperation();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [operationId, operation?.status]);

  const fetchOperation = async () => {
    try {
      const response = await fetch(`/api/autonomous/operations/${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch operation');
      const data = await response.json();
      setOperation(data.operation);
    } catch (error) {
      console.error('Failed to fetch operation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!operation?.job_id) return;

    setRetrying(true);
    try {
      const response = await fetch('/api/autonomous/operations/queue/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: operation.job_id }),
      });

      if (!response.ok) throw new Error('Failed to retry operation');

      await fetchOperation();
      onRefresh();
    } catch (error) {
      console.error('Failed to retry operation:', error);
      alert('Failed to retry operation');
    } finally {
      setRetrying(false);
    }
  };

  const handleCancel = async () => {
    if (!operation?.job_id) return;

    setCancelling(true);
    try {
      const response = await fetch('/api/autonomous/operations/queue/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: operation.job_id }),
      });

      if (!response.ok) throw new Error('Failed to cancel operation');

      await fetchOperation();
      onRefresh();
    } catch (error) {
      console.error('Failed to cancel operation:', error);
      alert('Failed to cancel operation');
    } finally {
      setCancelling(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!operation) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Operation Not Found</DialogTitle>
          </DialogHeader>
          <p>The requested operation could not be found.</p>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Operation Details</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {operation.service}
              </Badge>
              <Badge
                variant={operation.status === 'completed' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {operation.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <OperationInfo operation={operation} onCopy={copyToClipboard} />
        <OperationTabs operation={operation} />

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {operation.status === 'failed' && (
                <Button onClick={handleRetry} disabled={retrying}>
                  <RotateCw
                    className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`}
                  />
                  Retry
                </Button>
              )}
              {(operation.status === 'pending' ||
                operation.status === 'queued' ||
                operation.status === 'active') && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
