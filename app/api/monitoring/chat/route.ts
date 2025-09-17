import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { telemetryManager } from '@/lib/chat-telemetry';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Query parameters schema
const QuerySchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  domain: z.string().optional(),
  includeDetails: z.boolean().optional().default(false),
});

// Authentication check - require API key or admin auth
function authenticateRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  // Check for API key in header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && apiKey === process.env.MONITORING_API_KEY) {
    return true;
  }
  
  // Check for Bearer token (admin auth)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production, verify this token against Supabase auth
    return token === process.env.ADMIN_TOKEN;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    if (!authenticateRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = QuerySchema.parse({
      period: searchParams.period,
      domain: searchParams.domain,
      includeDetails: searchParams.includeDetails === 'true',
    });

    // Get Supabase client
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Calculate time range based on period
    const now = new Date();
    const periodHours = {
      hour: 1,
      day: 24,
      week: 168,
      month: 720,
    };
    const hoursAgo = periodHours[query.period];
    const startTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    // Build query
    let telemetryQuery = supabase
      .from('chat_telemetry')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (query.domain) {
      telemetryQuery = telemetryQuery.eq('domain', query.domain);
    }

    const { data: telemetryData, error } = await telemetryQuery;

    if (error) {
      console.error('Failed to fetch telemetry data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch telemetry data' },
        { status: 500 }
      );
    }

    // Calculate aggregated metrics
    const metrics = calculateMetrics(telemetryData || []);

    // Get current active sessions from memory
    const activeSessions = telemetryManager.getAllMetrics();

    // Prepare response
    const response: any = {
      period: query.period,
      timeRange: {
        start: startTime.toISOString(),
        end: now.toISOString(),
      },
      summary: metrics,
      activeSessions: {
        count: activeSessions.length,
        sessions: activeSessions.map(s => ({
          sessionId: s.sessionId,
          uptime: s.uptime,
          iterations: s.iterations,
          searches: s.searches,
        })),
      },
    };

    // Include detailed data if requested
    if (query.includeDetails && telemetryData) {
      response.details = {
        recentSessions: telemetryData.slice(0, 20).map(session => ({
          sessionId: session.session_id,
          timestamp: session.created_at,
          duration: session.duration_ms,
          iterations: session.iterations,
          searches: session.search_count,
          results: session.total_results,
          success: session.success,
          error: session.error,
        })),
        topQueries: extractTopQueries(telemetryData),
        errorSummary: extractErrorSummary(telemetryData),
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Monitoring API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateMetrics(data: any[]) {
  if (!data || data.length === 0) {
    return {
      totalSessions: 0,
      successRate: 0,
      avgDuration: 0,
      medianDuration: 0,
      p95Duration: 0,
      avgSearches: 0,
      avgResults: 0,
      avgIterations: 0,
      errorRate: 0,
    };
  }

  const durations = data
    .filter(d => d.duration_ms)
    .map(d => d.duration_ms)
    .sort((a, b) => a - b);

  const successCount = data.filter(d => d.success).length;
  const errorCount = data.filter(d => d.error).length;

  return {
    totalSessions: data.length,
    successRate: (successCount / data.length * 100).toFixed(2) + '%',
    avgDuration: Math.round(
      durations.reduce((sum, d) => sum + d, 0) / durations.length || 0
    ),
    medianDuration: durations[Math.floor(durations.length / 2)] || 0,
    p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
    avgSearches: (
      data.reduce((sum, d) => sum + (d.search_count || 0), 0) / data.length
    ).toFixed(1),
    avgResults: (
      data.reduce((sum, d) => sum + (d.total_results || 0), 0) / data.length
    ).toFixed(1),
    avgIterations: (
      data.reduce((sum, d) => sum + (d.iterations || 0), 0) / data.length
    ).toFixed(1),
    errorRate: (errorCount / data.length * 100).toFixed(2) + '%',
  };
}

function extractTopQueries(data: any[]): any[] {
  const queryMap = new Map<string, number>();
  
  data.forEach(session => {
    if (session.searches && Array.isArray(session.searches)) {
      session.searches.forEach((search: any) => {
        if (search.query) {
          const count = queryMap.get(search.query) || 0;
          queryMap.set(search.query, count + 1);
        }
      });
    }
  });

  return Array.from(queryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));
}

function extractErrorSummary(data: any[]): any {
  const errors = data.filter(d => d.error);
  const errorTypes = new Map<string, number>();
  
  errors.forEach(session => {
    const errorType = session.error?.split(':')[0] || 'Unknown';
    const count = errorTypes.get(errorType) || 0;
    errorTypes.set(errorType, count + 1);
  });

  return {
    total: errors.length,
    types: Array.from(errorTypes.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / errors.length) * 100).toFixed(1) + '%',
    })),
  };
}

// POST endpoint for clearing old telemetry data
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    if (!authenticateRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    if (action === 'cleanup') {
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        return NextResponse.json(
          { error: 'Database connection unavailable' },
          { status: 503 }
        );
      }

      // Call cleanup function
      const { data, error } = await supabase.rpc('cleanup_old_telemetry');
      
      if (error) {
        console.error('Failed to cleanup telemetry:', error);
        return NextResponse.json(
          { error: 'Failed to cleanup telemetry' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Telemetry cleanup completed',
        deletedCount: data,
      });
    }

    if (action === 'clear-memory') {
      // Clear old sessions from memory
      telemetryManager.clearOldSessions(3600000); // 1 hour
      
      return NextResponse.json({
        message: 'Memory sessions cleared',
        activeSessions: telemetryManager.getAllMetrics().length,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[Monitoring API] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}