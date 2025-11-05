/**
 * Search Telemetry API Endpoint
 * Provides aggregated telemetry data for dashboard display
 *
 * Endpoints:
 * - GET /api/admin/search-telemetry?metric=provider-health&hours=24
 * - GET /api/admin/search-telemetry?metric=retry-patterns&hours=24
 * - GET /api/admin/search-telemetry?metric=domain-lookup&hours=24
 * - GET /api/admin/search-telemetry?metric=all&hours=24
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTelemetryStats } from '@/lib/telemetry/search-telemetry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'all';
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    // Validate hours parameter
    if (hours < 1 || hours > 720) { // Max 30 days
      return NextResponse.json(
        { error: 'Invalid hours parameter. Must be between 1 and 720.' },
        { status: 400 }
      );
    }

    // Fetch telemetry stats
    const stats = await getTelemetryStats(hours);

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch telemetry data' },
        { status: 500 }
      );
    }

    // Return specific metric or all metrics
    switch (metric) {
      case 'provider-health':
        return NextResponse.json({
          metric: 'provider-health',
          timePeriodHours: hours,
          data: stats.providerHealth,
        });

      case 'retry-patterns':
        return NextResponse.json({
          metric: 'retry-patterns',
          timePeriodHours: hours,
          data: stats.retryPatterns,
        });

      case 'domain-lookup':
        return NextResponse.json({
          metric: 'domain-lookup',
          timePeriodHours: hours,
          data: stats.domainLookup,
        });

      case 'circuit-breaker':
        return NextResponse.json({
          metric: 'circuit-breaker',
          timePeriodHours: hours,
          data: stats.circuitBreaker,
        });

      case 'all':
      default:
        return NextResponse.json({
          metric: 'all',
          timePeriodHours: hours,
          data: stats,
        });
    }
  } catch (error) {
    console.error('[Search Telemetry API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
