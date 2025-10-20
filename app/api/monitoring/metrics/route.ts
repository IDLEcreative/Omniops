import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceSnapshot, performanceTracker } from '@/lib/monitoring/performance-tracker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/monitoring/metrics
 * Returns performance metrics in various formats
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const operation = searchParams.get('operation') || undefined;

    if (format === 'prometheus') {
      // Return Prometheus-compatible metrics
      const metricsText = performanceTracker.exportMetrics();

      return new Response(metricsText, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Default JSON format
    const snapshot = getPerformanceSnapshot();

    // Add system metrics
    const systemMetrics = {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
      },
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      performance: snapshot,
      system: systemMetrics,
      status: 'healthy',
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}