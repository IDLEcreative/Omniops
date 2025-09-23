import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { telemetryManager } from '@/lib/chat-telemetry';
import { z } from 'zod';

// Query parameter schema
const QuerySchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  domain: z.string().optional(),
  model: z.string().optional(),
  includeDetails: z.boolean().optional().default(false),
  includeLive: z.boolean().optional().default(true),
});

/**
 * GET /api/monitoring/chat
 * Get comprehensive chat telemetry and cost analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = QuerySchema.parse({
      period: searchParams.get('period') || 'day',
      domain: searchParams.get('domain') || undefined,
      model: searchParams.get('model') || undefined,
      includeDetails: searchParams.get('details') === 'true',
      includeLive: searchParams.get('live') !== 'false',
    });

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Calculate period boundaries
    const now = new Date();
    let startDate: Date;
    
    switch (params.period) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Build query
    let query = supabase
      .from('chat_telemetry')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (params.domain) {
      query = query.eq('domain', params.domain);
    }

    if (params.model) {
      query = query.eq('model', params.model);
    }

    const { data: telemetryData, error } = await query;

    if (error) {
      console.error('Error fetching telemetry:', error);
      return NextResponse.json(
        { error: 'Failed to fetch telemetry data' },
        { status: 500 }
      );
    }

    // Calculate aggregated metrics
    const metrics = {
      period: params.period,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      
      // Request statistics
      totalRequests: telemetryData?.length || 0,
      successfulRequests: telemetryData?.filter(t => t.success).length || 0,
      failedRequests: telemetryData?.filter(t => !t.success).length || 0,
      successRate: telemetryData?.length 
        ? ((telemetryData.filter(t => t.success).length / telemetryData.length) * 100).toFixed(2) 
        : 0,
      
      // Token usage
      tokenUsage: {
        totalInput: telemetryData?.reduce((sum, t) => sum + (t.input_tokens || 0), 0) || 0,
        totalOutput: telemetryData?.reduce((sum, t) => sum + (t.output_tokens || 0), 0) || 0,
        totalTokens: telemetryData?.reduce((sum, t) => sum + (t.total_tokens || 0), 0) || 0,
        avgInputPerRequest: telemetryData?.length 
          ? Math.round(telemetryData.reduce((sum, t) => sum + (t.input_tokens || 0), 0) / telemetryData.length)
          : 0,
        avgOutputPerRequest: telemetryData?.length
          ? Math.round(telemetryData.reduce((sum, t) => sum + (t.output_tokens || 0), 0) / telemetryData.length)
          : 0,
      },
      
      // Cost analytics
      cost: {
        totalCostUSD: telemetryData?.reduce((sum, t) => sum + (t.cost_usd || 0), 0).toFixed(4) || '0.0000',
        avgCostPerRequest: telemetryData?.length
          ? (telemetryData.reduce((sum, t) => sum + (t.cost_usd || 0), 0) / telemetryData.length).toFixed(6)
          : '0.000000',
        maxRequestCost: Math.max(...(telemetryData?.map(t => t.cost_usd || 0) || [0])).toFixed(6),
        minRequestCost: telemetryData?.length
          ? Math.min(...telemetryData.filter(t => t.cost_usd > 0).map(t => t.cost_usd)).toFixed(6)
          : '0.000000',
        costPerHour: telemetryData?.length
          ? ((telemetryData.reduce((sum, t) => sum + (t.cost_usd || 0), 0) / 
              ((now.getTime() - startDate.getTime()) / (60 * 60 * 1000)))).toFixed(4)
          : '0.0000',
        projectedDailyCost: telemetryData?.length
          ? ((telemetryData.reduce((sum, t) => sum + (t.cost_usd || 0), 0) / 
              ((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)))).toFixed(2)
          : '0.00',
        projectedMonthlyCost: telemetryData?.length
          ? ((telemetryData.reduce((sum, t) => sum + (t.cost_usd || 0), 0) / 
              ((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))).toFixed(2)
          : '0.00',
      },
      
      // Performance metrics
      performance: {
        avgDurationMs: telemetryData?.length
          ? Math.round(telemetryData.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / telemetryData.length)
          : 0,
        medianDurationMs: telemetryData?.length
          ? telemetryData.map(t => t.duration_ms || 0).sort((a, b) => a - b)[Math.floor(telemetryData.length / 2)]
          : 0,
        p95DurationMs: telemetryData?.length
          ? telemetryData.map(t => t.duration_ms || 0).sort((a, b) => a - b)[Math.floor(telemetryData.length * 0.95)]
          : 0,
        avgIterations: telemetryData?.length
          ? (telemetryData.reduce((sum, t) => sum + (t.iterations || 0), 0) / telemetryData.length).toFixed(2)
          : '0',
        avgSearches: telemetryData?.length
          ? (telemetryData.reduce((sum, t) => sum + (t.search_count || 0), 0) / telemetryData.length).toFixed(2)
          : '0',
      },
      
      // Model breakdown
      modelBreakdown: telemetryData?.reduce((acc, t) => {
        const model = t.model || 'unknown';
        if (!acc[model]) {
          acc[model] = {
            requests: 0,
            tokens: 0,
            cost: 0,
            avgDuration: 0,
            durations: [],
          };
        }
        acc[model].requests++;
        acc[model].tokens += t.total_tokens || 0;
        acc[model].cost += t.cost_usd || 0;
        acc[model].durations.push(t.duration_ms || 0);
        return acc;
      }, {} as Record<string, any>),
      
      // Domain breakdown (if not filtering by domain)
      domainBreakdown: !params.domain ? telemetryData?.reduce((acc, t) => {
        const domain = t.domain || 'unknown';
        if (!acc[domain]) {
          acc[domain] = {
            requests: 0,
            cost: 0,
            tokens: 0,
          };
        }
        acc[domain].requests++;
        acc[domain].cost += t.cost_usd || 0;
        acc[domain].tokens += t.total_tokens || 0;
        return acc;
      }, {} as Record<string, any>) : undefined,
    };

    // Calculate average durations for model breakdown
    Object.keys(metrics.modelBreakdown || {}).forEach(model => {
      const data = metrics.modelBreakdown[model];
      data.avgDuration = data.durations.length 
        ? Math.round(data.durations.reduce((a: number, b: number) => a + b, 0) / data.durations.length)
        : 0;
      data.cost = data.cost.toFixed(6);
      delete data.durations; // Remove raw data from response
    });

    // Format domain breakdown costs
    Object.keys(metrics.domainBreakdown || {}).forEach(domain => {
      metrics.domainBreakdown[domain].cost = metrics.domainBreakdown[domain].cost.toFixed(6);
    });

    // Include live session data if requested
    let liveMetrics = {};
    if (params.includeLive) {
      const liveAnalytics = telemetryManager.getCostAnalytics(
        params.period === 'hour' ? 1 : 
        params.period === 'day' ? 24 :
        params.period === 'week' ? 168 : 720
      );
      liveMetrics = {
        activeSessions: telemetryManager.getAllMetrics().sessions.length,
        liveAnalytics,
      };
    }

    // Get hourly trend data
    const hourlyTrend = await getHourlyTrend(supabase, startDate, params.domain);

    // Check for cost alerts
    const costAlerts = await checkCostAlerts(supabase, params.domain);

    const response = {
      success: true,
      metrics,
      hourlyTrend,
      costAlerts: costAlerts.filter((a: any) => a.exceeded),
      liveMetrics,
      details: params.includeDetails ? telemetryData?.slice(0, 100) : undefined,
      timestamp: now.toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in chat monitoring API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve monitoring data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/chat
 * Perform monitoring actions or set alerts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    switch (action) {
      case 'set-alert':
        return await setCoastAlert(supabase, params);
      
      case 'check-alerts':
        const alerts = await checkCostAlerts(supabase, params.domain);
        return NextResponse.json({ success: true, alerts });
      
      case 'get-summary':
        const summary = await getCostSummary(supabase, params.domain, params.days || 7);
        return NextResponse.json({ success: true, summary });
      
      case 'cleanup-old-data':
        const cleanupResult = await cleanupOldTelemetry(supabase);
        return NextResponse.json({ success: true, ...cleanupResult });
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in chat monitoring POST:', error);
    return NextResponse.json(
      { error: 'Failed to perform monitoring action' },
      { status: 500 }
    );
  }
}

// Helper functions

async function getHourlyTrend(supabase: any, startDate: Date, domain?: string) {
  const query = supabase
    .from('chat_telemetry_hourly_costs')
    .select('*')
    .gte('hour', startDate.toISOString())
    .order('hour', { ascending: false });

  if (domain) {
    // Need to query the base table for domain-specific hourly data
    const { data } = await supabase
      .from('chat_telemetry')
      .select('created_at, cost_usd, input_tokens, output_tokens')
      .eq('domain', domain)
      .gte('created_at', startDate.toISOString());

    // Group by hour manually
    const hourlyData: Record<string, any> = {};
    data?.forEach((row: any) => {
      const hour = new Date(row.created_at);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          hour: hourKey,
          requests: 0,
          cost: 0,
          input_tokens: 0,
          output_tokens: 0,
        };
      }
      
      hourlyData[hourKey].requests++;
      hourlyData[hourKey].cost += row.cost_usd || 0;
      hourlyData[hourKey].input_tokens += row.input_tokens || 0;
      hourlyData[hourKey].output_tokens += row.output_tokens || 0;
    });

    return Object.values(hourlyData).map(h => ({
      ...h,
      cost: h.cost.toFixed(6),
    }));
  }

  const { data } = await query;
  return data || [];
}

async function checkCostAlerts(supabase: any, domain?: string) {
  const { data } = await supabase
    .rpc('check_cost_thresholds');
  
  if (domain) {
    return data?.filter((a: any) => !a.domain || a.domain === domain) || [];
  }
  
  return data || [];
}

async function setCoastAlert(supabase: any, params: any) {
  const { domain, alert_type, threshold_usd } = params;
  
  const { data, error } = await supabase
    .from('chat_cost_alerts')
    .upsert({
      domain,
      alert_type,
      threshold_usd,
      enabled: true,
    }, {
      onConflict: 'domain,alert_type'
    });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to set cost alert', details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, alert: data });
}

async function getCostSummary(supabase: any, domain: string | undefined, days: number) {
  const { data, error } = await supabase
    .rpc('get_chat_cost_summary', { 
      p_domain: domain || null, 
      p_days: days 
    });

  if (error) {
    throw error;
  }

  return data;
}

async function cleanupOldTelemetry(supabase: any) {
  const { data, error } = await supabase
    .rpc('cleanup_old_telemetry');

  if (error) {
    throw error;
  }

  return {
    deletedCount: data,
    message: `Cleaned up ${data} old telemetry records`,
  };
}