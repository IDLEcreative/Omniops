import { NextRequest, NextResponse } from 'next/server';
import { getPersistenceStats, persistenceMonitor } from '@/lib/monitoring/persistence-monitor';
import { getPerformanceSnapshot, performanceCollector } from '@/lib/monitoring/performance-collector';
import { getAlerts, getAlertStats, alertingSystem } from '@/lib/monitoring/alerting';

export const dynamic = 'force-dynamic';

/**
 * GET /api/monitoring/widget
 * Returns comprehensive widget performance and persistence metrics
 *
 * Query parameters:
 * - window: time window in milliseconds (default: 300000 = 5 minutes)
 * - format: 'json' | 'export' (default: 'json')
 * - alerts: 'true' | 'false' (default: 'true')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('window') || '300000');
    const format = searchParams.get('format') || 'json';
    const includeAlerts = searchParams.get('alerts') !== 'false';

    // Collect all metrics
    const persistence = getPersistenceStats(timeWindow);
    const restorationStats = persistenceMonitor.getRestorationStats(timeWindow);
    const navigationStats = persistenceMonitor.getNavigationStats(timeWindow);
    const performance = getPerformanceSnapshot(timeWindow);
    const alerts = includeAlerts ? getAlerts({ resolved: false, limit: 50 }) : [];
    const alertStats = getAlertStats();

    // Calculate health scores
    const healthScores = calculateHealthScores(persistence, performance);

    if (format === 'export') {
      // Export raw metrics for external analysis
      const exportData = {
        timestamp: new Date().toISOString(),
        timeWindow,
        metrics: {
          persistence: persistenceMonitor.exportMetrics(),
          performance: performanceCollector.exportMetrics(),
        },
        alerts: getAlerts({ limit: 1000 }),
      };

      return NextResponse.json(exportData);
    }

    // Default JSON format with aggregated stats
    const response = {
      timestamp: new Date().toISOString(),
      timeWindow,
      health: {
        overall: healthScores.overall,
        scores: healthScores.scores,
        status: healthScores.overall >= 90 ? 'healthy' : healthScores.overall >= 70 ? 'degraded' : 'unhealthy',
      },
      persistence: {
        operations: {
          total: persistence.totalOperations,
          successful: persistence.successCount,
          failed: persistence.failureCount,
          successRate: persistence.successRate,
        },
        performance: {
          avgDuration: persistence.avgDuration,
          p50Duration: persistence.p50Duration,
          p95Duration: persistence.p95Duration,
          p99Duration: persistence.p99Duration,
        },
        reliability: {
          dataLossIncidents: persistence.dataLossIncidents,
          errorsByType: persistence.errorsByType,
        },
        restoration: {
          total: restorationStats.totalRestorations,
          successRate: restorationStats.successRate,
          avgDuration: restorationStats.avgDuration,
          avgMessagesRestored: restorationStats.avgMessagesRestored,
          errorsByType: restorationStats.errorsByType,
        },
        navigation: {
          total: navigationStats.totalNavigations,
          successCount: navigationStats.successCount,
          dataPreservedCount: navigationStats.dataPreservedCount,
          dataLossCount: navigationStats.dataLossCount,
          avgDuration: navigationStats.avgDuration,
        },
      },
      performance: {
        renders: {
          count: performance.renders.count,
          avgTime: performance.renders.avgTime,
          p95Time: performance.renders.p95Time,
          slowRenders: performance.renders.slowRenders,
          slowRenderRate: performance.renders.count > 0
            ? (performance.renders.slowRenders / performance.renders.count) * 100
            : 0,
        },
        scroll: {
          avgFps: performance.scroll.avgFps,
          minFps: performance.scroll.minFps,
          jankPercentage: performance.scroll.jankPercentage,
        },
        memory: {
          current: {
            bytes: performance.memory.current,
            mb: performance.memory.current / 1024 / 1024,
          },
          peak: {
            bytes: performance.memory.peak,
            mb: performance.memory.peak / 1024 / 1024,
          },
          average: {
            bytes: performance.memory.avgUsage,
            mb: performance.memory.avgUsage / 1024 / 1024,
          },
        },
        tabSync: {
          operations: performance.tabSync.count,
          avgLatency: performance.tabSync.avgLatency,
          p95Latency: performance.tabSync.p95Latency,
          failures: performance.tabSync.failures,
          failureRate: performance.tabSync.count > 0
            ? (performance.tabSync.failures / performance.tabSync.count) * 100
            : 0,
        },
        api: {
          totalCalls: performance.api.totalCalls,
          avgDuration: performance.api.avgDuration,
          p95Duration: performance.api.p95Duration,
          errorRate: performance.api.errorRate,
          cacheHitRate: performance.api.cacheHitRate,
        },
        bundles: {
          totalLoaded: performance.bundles.totalLoaded,
          totalSize: {
            bytes: performance.bundles.totalSize,
            kb: performance.bundles.totalSize / 1024,
            mb: performance.bundles.totalSize / 1024 / 1024,
          },
          avgLoadTime: performance.bundles.avgLoadTime,
          cacheHitRate: performance.bundles.cacheHitRate,
        },
      },
      alerts: {
        active: alerts,
        stats: alertStats,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Widget-Health': healthScores.overall.toFixed(0),
      },
    });
  } catch (error) {
    console.error('Error fetching widget metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch widget metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/widget
 * Record widget metrics from client-side
 *
 * Body should contain metrics to track
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, metric } = body;

    // Validate metric type
    if (!type || !metric) {
      return NextResponse.json(
        { error: 'Missing required fields: type, metric' },
        { status: 400 }
      );
    }

    // Route to appropriate tracker
    switch (type) {
      case 'persistence':
        persistenceMonitor.trackOperation(metric);
        break;
      case 'restoration':
        persistenceMonitor.trackRestoration(metric);
        break;
      case 'navigation':
        persistenceMonitor.trackNavigation(metric);
        break;
      case 'render':
        performanceCollector.trackRender(metric);
        break;
      case 'tabSync':
        performanceCollector.trackTabSync(metric);
        break;
      case 'api':
        performanceCollector.trackAPI(metric);
        break;
      case 'bundle':
        performanceCollector.trackBundleLoad(metric);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown metric type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording widget metric:', error);
    return NextResponse.json(
      {
        error: 'Failed to record metric',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate health scores for different categories
 */
function calculateHealthScores(
  persistence: ReturnType<typeof getPersistenceStats>,
  performance: ReturnType<typeof getPerformanceSnapshot>
) {
  const scores = {
    persistence: 0,
    performance: 0,
    memory: 0,
    api: 0,
  };

  // Persistence score (0-100)
  scores.persistence = Math.min(100, persistence.successRate);

  // Performance score (based on render times)
  if (performance.renders.count > 0) {
    const targetRenderTime = 16; // 60fps target
    const renderScore = Math.max(0, 100 - (performance.renders.p95Time / targetRenderTime - 1) * 100);
    scores.performance = Math.min(100, renderScore);
  } else {
    scores.performance = 100;
  }

  // Memory score (penalize usage over 30MB)
  const memoryMB = performance.memory.current / 1024 / 1024;
  const targetMemoryMB = 30;
  const memoryScore = Math.max(0, 100 - Math.max(0, (memoryMB - targetMemoryMB) / targetMemoryMB) * 100);
  scores.memory = Math.min(100, memoryScore);

  // API score (based on latency and error rate)
  if (performance.api.totalCalls > 0) {
    const latencyScore = Math.max(0, 100 - (performance.api.p95Duration / 500 - 1) * 50);
    const errorScore = Math.max(0, 100 - performance.api.errorRate * 10);
    scores.api = Math.min(100, (latencyScore + errorScore) / 2);
  } else {
    scores.api = 100;
  }

  // Overall score (weighted average)
  const overall =
    scores.persistence * 0.4 +
    scores.performance * 0.3 +
    scores.memory * 0.15 +
    scores.api * 0.15;

  return {
    overall: Math.round(overall),
    scores: {
      persistence: Math.round(scores.persistence),
      performance: Math.round(scores.performance),
      memory: Math.round(scores.memory),
      api: Math.round(scores.api),
    },
  };
}
