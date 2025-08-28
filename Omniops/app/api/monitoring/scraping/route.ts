import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData, DashboardData } from '@/lib/monitoring/dashboard-data';
import { getMonitor } from '@/lib/monitoring/scrape-monitor';
import { logger } from '@/lib/logger';

/**
 * GET /api/monitoring/scraping
 * Get comprehensive scraping system monitoring data for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    logger.debug('Scraping monitoring API called');

    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('details') === 'true';
    const includeHistory = searchParams.get('history') === 'true';

    // Get comprehensive dashboard data
    const dashboardData = await getDashboardData();

    // Optionally include additional details
    let additionalData: any = {};

    if (includeDetails) {
      const monitor = getMonitor();
      additionalData = {
        systemHealth: await monitor.getSystemHealth(),
        allAlerts: monitor.getAllAlerts(),
      };
    }

    if (includeHistory) {
      const monitor = getMonitor();
      additionalData.metricsHistory = monitor.getMetricsHistory(24); // Last 24 hours
    }

    const response = {
      success: true,
      data: {
        ...dashboardData,
        ...additionalData,
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };

    logger.debug('Scraping monitoring data retrieved successfully', {
      systemStatus: dashboardData.overview.systemStatus,
      activeJobs: dashboardData.queue.activeJobs,
      activeWorkers: dashboardData.workers.activeWorkers,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error getting scraping monitoring data:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get monitoring data',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/monitoring/scraping
 * Trigger manual health check or perform monitoring actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const monitor = getMonitor();
    let result: any;

    switch (action) {
      case 'health-check':
        result = await monitor.performHealthCheck();
        logger.info('Manual health check performed');
        break;

      case 'clear-resolved-alerts':
        monitor.clearResolvedAlerts();
        result = { message: 'Resolved alerts cleared' };
        logger.info('Resolved alerts cleared');
        break;

      case 'get-worker-details':
        result = await monitor.getWorkerStatus();
        break;

      case 'get-metrics-history':
        const hours = params.hours || 1;
        result = monitor.getMetricsHistory(hours);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString(),
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Error performing monitoring action:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform monitoring action',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * Helper function to get simplified monitoring data for lightweight requests
 */
export async function getSimpleMonitoringData() {
  try {
    const monitor = getMonitor();
    const metrics = await monitor.getMetrics();
    const health = await monitor.getSystemHealth();
    const alerts = monitor.getActiveAlerts();

    return {
      status: health.status,
      uptime: health.uptime,
      queue: {
        active: metrics.queue.active,
        waiting: metrics.queue.waiting,
        failed: metrics.queue.failed,
        completed: metrics.queue.completed,
      },
      workers: {
        total: metrics.workers.total,
        active: metrics.workers.active,
        failed: metrics.workers.failed,
      },
      alerts: alerts.length,
      memory: {
        usage: Math.round(metrics.memory.percentUsed * 100),
      },
      redis: {
        connected: metrics.redis.connected,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error getting simple monitoring data:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}