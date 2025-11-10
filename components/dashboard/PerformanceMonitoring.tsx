/**
 * Performance Monitoring Dashboard Component
 *
 * Main orchestrator for performance monitoring UI.
 * Displays real-time metrics for chat widget performance and reliability.
 *
 * Architecture:
 * - Uses custom hook (usePerformanceData) for data fetching
 * - Delegates rendering to specialized sub-components
 * - Follows component composition pattern for maintainability
 */

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { PerformanceHeader } from './performance/PerformanceHeader';
import { OverallHealthCard } from './performance/OverallHealthCard';
import { ActiveAlertsCard } from './performance/ActiveAlertsCard';
import { PersistenceTab } from './performance/PersistenceTab';
import { PerformanceTab } from './performance/PerformanceTab';
import { MemoryApiTab } from './performance/MemoryApiTab';
import { AlertsTab } from './performance/AlertsTab';

/**
 * Main performance monitoring dashboard component
 */
export default function PerformanceMonitoring() {
  const { metrics, loading, error, autoRefresh, setAutoRefresh, refresh } = usePerformanceData();

  // Loading state
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading performance metrics...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Metrics</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No data state
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PerformanceHeader
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
        onRefresh={refresh}
      />

      {/* Overall Health */}
      <OverallHealthCard metrics={metrics} />

      {/* Active Alerts */}
      <ActiveAlertsCard metrics={metrics} />

      {/* Detailed Metrics */}
      <Tabs defaultValue="persistence" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="persistence">Persistence</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="memory">Memory & API</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="persistence">
          <PersistenceTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="memory">
          <MemoryApiTab metrics={metrics} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab metrics={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
