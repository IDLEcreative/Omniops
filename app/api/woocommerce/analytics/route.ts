/**
 * WooCommerce Analytics API
 * Provides operation metrics and performance data
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface AnalyticsParams {
  domain?: string;
  operation?: string;
  days?: number;
  limit?: number;
}

/**
 * GET /api/woocommerce/analytics
 * Retrieve WooCommerce operation analytics
 *
 * Query Parameters:
 * - domain: Filter by specific domain (optional)
 * - operation: Filter by specific operation (optional)
 * - days: Number of days to look back (default: 7)
 * - limit: Max number of records to return (default: 100)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params: AnalyticsParams = {
      domain: searchParams.get('domain') || undefined,
      operation: searchParams.get('operation') || undefined,
      days: parseInt(searchParams.get('days') || '7'),
      limit: parseInt(searchParams.get('limit') || '100')
    };

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Build base query
    let query = supabase
      .from('woocommerce_usage_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(params.limit || 100);

    // Apply filters
    if (params.domain) {
      query = query.eq('domain', params.domain);
    }

    if (params.operation) {
      query = query.eq('operation', params.operation);
    }

    // Date range filter
    const lookbackDays = Number.isFinite(params.days) ? params.days! : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);
    query = query.gte('created_at', startDate.toISOString());

    const { data: metrics, error } = await query;

    if (error) {
      console.error('[Analytics API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Calculate aggregate statistics
    const stats = calculateStats(metrics || []);

    return NextResponse.json({
      success: true,
      data: {
        metrics: metrics || [],
        stats,
        filters: params
      }
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate aggregate statistics from metrics
 */
function calculateStats(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      total_operations: 0,
      success_rate: 0,
      avg_duration_ms: 0,
      operations_by_type: {},
      errors_by_type: {}
    };
  }

  const successfulOps = metrics.filter(m => m.success).length;
  const totalDuration = metrics.reduce((sum, m) => sum + m.duration_ms, 0);

  // Group by operation type
  const operationsByType: Record<string, number> = {};
  metrics.forEach(m => {
    operationsByType[m.operation] = (operationsByType[m.operation] || 0) + 1;
  });

  // Group errors by type
  const errorsByType: Record<string, number> = {};
  metrics.filter(m => !m.success && m.error_type).forEach(m => {
    errorsByType[m.error_type] = (errorsByType[m.error_type] || 0) + 1;
  });

  return {
    total_operations: metrics.length,
    success_rate: (successfulOps / metrics.length) * 100,
    avg_duration_ms: Math.round(totalDuration / metrics.length),
    operations_by_type: operationsByType,
    errors_by_type: errorsByType
  };
}
