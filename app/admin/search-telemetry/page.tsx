/**
 * Search Telemetry Dashboard Page
 * Admin interface for monitoring search system health and performance
 */

import { SearchTelemetryDashboard } from '@/components/admin/SearchTelemetryDashboard';

export const metadata = {
  title: 'Search Telemetry | Admin Dashboard',
  description: 'Monitor provider health, retry patterns, and domain lookup effectiveness',
};

export default function SearchTelemetryPage() {
  return (
    <div className="container mx-auto py-8">
      <SearchTelemetryDashboard timePeriodHours={24} autoRefreshSeconds={30} />
    </div>
  );
}
