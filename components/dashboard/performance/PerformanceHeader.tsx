/**
 * Performance Monitoring Header Component
 *
 * Displays title, description, and control buttons for performance monitoring dashboard
 */

'use client';

import { RefreshCw } from 'lucide-react';

interface PerformanceHeaderProps {
  autoRefresh: boolean;
  onAutoRefreshToggle: () => void;
  onRefresh: () => void;
}

export function PerformanceHeader({
  autoRefresh,
  onAutoRefreshToggle,
  onRefresh,
}: PerformanceHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Widget Performance</h2>
        <p className="text-sm text-gray-500 mt-1">
          Real-time monitoring of chat widget performance and reliability
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAutoRefreshToggle}
          className={`px-3 py-1 text-sm rounded-md ${
            autoRefresh
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
        </button>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>
    </div>
  );
}
