/**
 * Telemetry API route - Main entry point
 *
 * This route provides telemetry data for the dashboard, including:
 * - Overview metrics (requests, success rate, error rate)
 * - Cost metrics (total, average, projections)
 * - Token usage statistics
 * - Performance metrics (response time, searches, iterations)
 * - Model usage breakdown
 * - Domain breakdown
 * - Hourly trend data
 * - Live session metrics
 * - Rollup data freshness health
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleGetTelemetry, getDefaultTelemetryResponse } from './handlers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const response = await handleGetTelemetry(searchParams);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Dashboard] Error fetching telemetry data:', error);

    // Return default values on error
    return NextResponse.json(
      { ...getDefaultTelemetryResponse(), error: 'Failed to fetch telemetry data' },
      { status: 500 }
    );
  }
}
