import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { telemetryManager } from '@/lib/chat-telemetry';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const domain = searchParams.get('domain') || undefined;
    
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }
    
    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Build query for historical data
    let query = supabase
      .from('chat_telemetry')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (domain) {
      query = query.eq('domain', domain);
    }
    
    const { data: telemetryData, error } = await query;
    
    if (error) {
      console.error('[Dashboard] Error fetching telemetry:', error);
      throw error;
    }
    
    // Calculate key metrics
    const totalRequests = telemetryData?.length || 0;
    const successfulRequests = telemetryData?.filter(t => t.success).length || 0;
    const failedRequests = telemetryData?.filter(t => !t.success).length || 0;
    
    // Token usage stats
    const totalInputTokens = telemetryData?.reduce((sum, t) => sum + (t.input_tokens || 0), 0) || 0;
    const totalOutputTokens = telemetryData?.reduce((sum, t) => sum + (t.output_tokens || 0), 0) || 0;
    const totalTokens = telemetryData?.reduce((sum, t) => sum + (t.total_tokens || 0), 0) || 0;
    
    // Cost calculations
    const totalCost = telemetryData?.reduce((sum, t) => sum + (t.cost_usd || 0), 0) || 0;
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    
    // Performance metrics
    const avgDuration = totalRequests > 0
      ? telemetryData.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / totalRequests
      : 0;
    
    // Model usage breakdown
    interface ModelUsageItem {
      count: number;
      cost: number | string;
      tokens: number;
      percentage: number;
    }
    const modelUsage = telemetryData?.reduce<Record<string, ModelUsageItem>>((acc, t) => {
      const model = t.model || 'unknown';
      if (!acc[model]) {
        acc[model] = {
          count: 0,
          cost: 0,
          tokens: 0,
          percentage: 0
        };
      }
      acc[model].count++;
      acc[model].cost += t.cost_usd || 0;
      acc[model].tokens += t.total_tokens || 0;
      return acc;
    }, {}) || {};
    
    // Calculate percentages for model usage
    Object.keys(modelUsage).forEach(model => {
      if (modelUsage[model]) {
        modelUsage[model].percentage = totalRequests > 0
          ? Math.round((modelUsage[model].count / totalRequests) * 100)
          : 0;
        modelUsage[model].cost = typeof modelUsage[model].cost === 'number' 
          ? modelUsage[model].cost.toFixed(4)
          : modelUsage[model].cost;
      }
    });
    
    // Domain breakdown (if not filtered by domain)
    interface DomainBreakdownItem {
      requests: number;
      cost: number | string;
    }
    let domainBreakdown: Record<string, DomainBreakdownItem> = {};
    if (!domain) {
      domainBreakdown = telemetryData?.reduce<Record<string, DomainBreakdownItem>>((acc, t) => {
        const d = t.domain || 'unknown';
        if (!acc[d]) {
          acc[d] = { requests: 0, cost: 0 };
        }
        acc[d].requests++;
        acc[d].cost += t.cost_usd || 0;
        return acc;
      }, {}) || {};
      
      Object.keys(domainBreakdown).forEach(d => {
        if (domainBreakdown[d]) {
          domainBreakdown[d].cost = typeof domainBreakdown[d].cost === 'number'
            ? domainBreakdown[d].cost.toFixed(4)
            : domainBreakdown[d].cost;
        }
      });
    }
    
    // Get live session metrics
    const liveMetrics = telemetryManager.getAllMetrics();
    const activeSessions = liveMetrics.sessions.length;
    const liveTotalCost = liveMetrics.summary.totalCostUSD;
    
    // Calculate cost projections
    const hoursElapsed = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const costPerHour = hoursElapsed > 0 ? totalCost / hoursElapsed : 0;
    const projectedDailyCost = costPerHour * 24;
    const projectedMonthlyCost = projectedDailyCost * 30;
    
    // Get hourly trend for sparkline
    const hourlyTrend = await getHourlyTrend(supabase, startDate, domain);
    
    // Error rate calculation
    const errorRate = totalRequests > 0
      ? Math.round((failedRequests / totalRequests) * 100)
      : 0;
    
    // Search operation statistics
    const totalSearches = telemetryData?.reduce((sum, t) => sum + (t.search_count || 0), 0) || 0;
    const avgSearchesPerRequest = totalRequests > 0
      ? (totalSearches / totalRequests).toFixed(1)
      : '0';
    
    return NextResponse.json({
      // Overview metrics
      overview: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: totalRequests > 0 
          ? Math.round((successfulRequests / totalRequests) * 100)
          : 100,
        errorRate,
        activeSessions,
        timeRange: `Last ${days} days`
      },
      
      // Cost metrics
      cost: {
        total: totalCost.toFixed(4),
        average: avgCostPerRequest.toFixed(6),
        projectedDaily: projectedDailyCost.toFixed(2),
        projectedMonthly: projectedMonthlyCost.toFixed(2),
        perHour: costPerHour.toFixed(4),
        trend: calculateTrend(hourlyTrend)
      },
      
      // Token usage
      tokens: {
        totalInput: totalInputTokens,
        totalOutput: totalOutputTokens,
        total: totalTokens,
        avgPerRequest: totalRequests > 0 
          ? Math.round(totalTokens / totalRequests)
          : 0
      },
      
      // Performance
      performance: {
        avgResponseTime: Math.round(avgDuration),
        totalSearches,
        avgSearchesPerRequest,
        avgIterations: telemetryData?.length
          ? (telemetryData.reduce((sum, t) => sum + (t.iterations || 0), 0) / telemetryData.length).toFixed(1)
          : '0'
      },
      
      // Breakdowns
      modelUsage: Object.entries(modelUsage).map(([model, data]) => ({
        model,
        ...(data as ModelUsageItem)
      })),
      
      domainBreakdown: Object.entries(domainBreakdown).map(([domain, data]) => ({
        domain,
        ...(data as DomainBreakdownItem)
      })),
      
      // Hourly trend for charts
      hourlyTrend: hourlyTrend.map((h: any) => ({
        hour: h.hour,
        cost: parseFloat(h.cost || 0),
        requests: h.requests || 0
      })),
      
      // Live session info
      live: {
        activeSessions,
        currentCost: liveTotalCost.toFixed(6),
        sessionsData: liveMetrics.sessions.slice(0, 5).map((s: any) => ({
          id: s.sessionId,
          uptime: Math.round(s.uptime / 1000), // Convert to seconds
          cost: s.estimatedCost?.toFixed(6) || '0',
          model: s.model
        }))
      }
    });
    
  } catch (error) {
    console.error('[Dashboard] Error fetching telemetry data:', error);
    
    // Return default values on error
    return NextResponse.json(
      {
        overview: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          successRate: 100,
          errorRate: 0,
          activeSessions: 0,
          timeRange: 'Last 7 days'
        },
        cost: {
          total: '0.0000',
          average: '0.000000',
          projectedDaily: '0.00',
          projectedMonthly: '0.00',
          perHour: '0.0000',
          trend: 'stable'
        },
        tokens: {
          totalInput: 0,
          totalOutput: 0,
          total: 0,
          avgPerRequest: 0
        },
        performance: {
          avgResponseTime: 0,
          totalSearches: 0,
          avgSearchesPerRequest: '0',
          avgIterations: '0'
        },
        modelUsage: [],
        domainBreakdown: [],
        hourlyTrend: [],
        live: {
          activeSessions: 0,
          currentCost: '0.000000',
          sessionsData: []
        }
      },
      { status: 200 }
    );
  }
}

// Helper function to get hourly trend data
async function getHourlyTrend(supabase: ReturnType<typeof createServiceRoleClient> extends Promise<infer T> ? T : never, startDate: Date, domain?: string) {
  if (!supabase) {
    return [];
  }
  try {
    let query = supabase
      .from('chat_telemetry')
      .select('created_at, cost_usd')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (domain) {
      query = query.eq('domain', domain);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.warn('Could not fetch hourly trend:', error);
      return [];
    }
    
    // Group by hour
    const hourlyData: Record<string, any> = {};
    
    data?.forEach((row: any) => {
      const hour = new Date(row.created_at);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          hour: hourKey,
          cost: 0,
          requests: 0
        };
      }
      
      hourlyData[hourKey].cost += row.cost_usd || 0;
      hourlyData[hourKey].requests++;
    });
    
    return Object.values(hourlyData)
      .sort((a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime())
      .map(h => ({
        ...h,
        cost: h.cost.toFixed(6)
      }));
    
  } catch (error) {
    console.error('Error calculating hourly trend:', error);
    return [];
  }
}

// Helper function to calculate trend direction
function calculateTrend(hourlyData: any[]): string {
  if (!hourlyData || hourlyData.length < 2) return 'stable';
  
  const recentHours = hourlyData.slice(-6); // Last 6 hours
  if (recentHours.length < 2) return 'stable';
  
  const firstHalfAvg = recentHours
    .slice(0, Math.floor(recentHours.length / 2))
    .reduce((sum, h) => sum + parseFloat(h.cost), 0) / Math.floor(recentHours.length / 2);
  
  const secondHalfAvg = recentHours
    .slice(Math.floor(recentHours.length / 2))
    .reduce((sum, h) => sum + parseFloat(h.cost), 0) / (recentHours.length - Math.floor(recentHours.length / 2));
  
  const changePercent = firstHalfAvg > 0 
    ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    : 0;
  
  if (changePercent > 20) return 'increasing';
  if (changePercent < -20) return 'decreasing';
  return 'stable';
}