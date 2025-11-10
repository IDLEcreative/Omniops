/**
 * Autonomous Operations Dashboard
 *
 * Real-time monitoring interface for autonomous agent operations.
 * Shows active operations, queue statistics, execution logs, and manual controls.
 */

'use client';

import { useState, useEffect } from 'react';
import { useOperations } from '@/hooks/useOperations';
import { useQueueStats } from '@/hooks/useQueueStats';
import { OperationsList } from '@/components/dashboard/operations/OperationsList';
import { QueueStatistics } from '@/components/dashboard/operations/QueueStatistics';
import { OperationDetailsModal } from '@/components/dashboard/operations/OperationDetailsModal';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';

export default function OperationsDashboard() {
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { operations, loading: operationsLoading, refresh: refreshOperations } = useOperations({
    autoRefresh,
    refreshInterval: 3000, // Poll every 3 seconds
  });

  const { stats, health, loading: statsLoading, refresh: refreshStats } = useQueueStats({
    autoRefresh,
    refreshInterval: 5000, // Poll every 5 seconds
  });

  const handleRefresh = () => {
    refreshOperations();
    refreshStats();
  };

  const handleOperationClick = (operationId: string) => {
    setSelectedOperationId(operationId);
  };

  const handleCloseModal = () => {
    setSelectedOperationId(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Autonomous Operations</h1>
          <p className="text-muted-foreground mt-1">
            Monitor AI agents executing integration tasks
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={operationsLoading || statsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(operationsLoading || statsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Operation
          </Button>
        </div>
      </div>

      {/* Auto-refresh toggle */}
      <div className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          id="auto-refresh"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="auto-refresh" className="text-muted-foreground cursor-pointer">
          Auto-refresh every 3 seconds
        </label>
      </div>

      {/* Queue Statistics */}
      <QueueStatistics
        stats={stats}
        health={health}
        loading={statsLoading}
      />

      {/* Operations List */}
      <OperationsList
        operations={operations}
        loading={operationsLoading}
        onOperationClick={handleOperationClick}
        onRefresh={refreshOperations}
      />

      {/* Operation Details Modal */}
      {selectedOperationId && (
        <OperationDetailsModal
          operationId={selectedOperationId}
          onClose={handleCloseModal}
          onRefresh={refreshOperations}
        />
      )}
    </div>
  );
}
