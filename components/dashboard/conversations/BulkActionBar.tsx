"use client";

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { UserPlus, Check, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onActionComplete: () => void;
  selectedIds: Set<string>;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  onActionComplete,
  selectedIds
}: BulkActionBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkAction = async (action: 'assign_human' | 'close' | 'delete') => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/dashboard/conversations/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          conversationIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk action failed');
      }

      const result = await response.json();

      if (result.successCount > 0) {
        toast.success(`${result.successCount} conversation(s) updated successfully`);
      }
      if (result.failureCount > 0) {
        toast.warning(`${result.failureCount} conversation(s) failed to update`);
      }

      onActionComplete();
      onClear();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to perform bulk action');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="sm:fixed sm:bottom-6 sm:left-1/2 sm:transform sm:-translate-x-1/2 relative mx-auto mb-4 sm:mb-0 z-50 w-full sm:w-auto max-w-2xl px-4 sm:px-0">
      <div className="bg-background border rounded-lg shadow-lg p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <span className="text-sm font-medium text-center sm:text-left">
          {selectedCount} conversation{selectedCount !== 1 ? 's' : ''} selected
        </span>

        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('assign_human')}
            disabled={isProcessing}
            aria-label="Assign selected conversations to human agent"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign to Human
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('close')}
            disabled={isProcessing}
            aria-label="Close all selected conversations"
          >
            <Check className="h-4 w-4 mr-2" />
            Close All
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                aria-label="Delete selected conversations"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete {selectedCount} conversation{selectedCount !== 1 ? 's' : ''}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All messages and metadata will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleBulkAction('delete')}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            aria-label="Clear selection"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
