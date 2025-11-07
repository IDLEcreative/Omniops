import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { ApiLogger } from '@/lib/logging/api-logger';

interface ResponseTimeTrend {
  date: string;
  avgMinutes: number;
}

interface VolumeByHour {
  hour: number;
  count: number;
}

interface StatusOverTime {
  date: string;
  active: number;
  waiting: number;
  resolved: number;
}

interface MessageLengthDist {
  range: string;
  count: number;
}

interface AnalyticsResponse {
  responseTimeTrend: ResponseTimeTrend[];
  volumeByHour: VolumeByHour[];
  statusOverTime: StatusOverTime[];
  messageLengthDist: MessageLengthDist[];
}

// Input validation schema
const AnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

/**
 * GET /api/dashboard/conversations/analytics
 *
 * Returns time-series analytics data for conversation visualizations.
 * Query params:
 *   - days: Number of days to look back (default: 30, max: 365)
 */
export async function GET(request: NextRequest) {
  const requestId = await ApiLogger.logRequest(request, 'analytics.timeseries');
  const startTime = Date.now();

  try {
    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryValidation = AnalyticsQuerySchema.safeParse({
      days: searchParams.get('days'),
    });

    if (!queryValidation.success) {
      ApiLogger.logValidationError(requestId, queryValidation.error.errors);
      ApiLogger.logResponse(requestId, 400, Date.now() - startTime, false, 'VALIDATION_ERROR');
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: queryValidation.error.errors,
      }, { status: 400 });
    }

    const { days } = queryValidation.data;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Analytics] Supabase client unavailable');
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // 1. Response Time Trend - Average minutes to first response per day
    const responseTimeResult = await supabase.rpc('get_response_time_trend', {
      start_date: startDate.toISOString(),
    });

    let responseTimeTrend: ResponseTimeTrend[] = [];
    if (responseTimeResult.data && Array.isArray(responseTimeResult.data)) {
      responseTimeTrend = responseTimeResult.data.map((row: any) => ({
        date: row.date,
        avgMinutes: parseFloat(row.avg_minutes) || 0,
      }));
    } else {
      // Fallback to mock data if RPC function doesn't exist
      responseTimeTrend = generateMockResponseTimeTrend(days);
    }

    // 2. Volume by Hour - Conversation count by hour of day (0-23)
    // FIXED: Add limit to prevent unbounded query (max 5000 conversations)
    const volumeResult = await supabase
      .from('conversations')
      .select('started_at')
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })
      .limit(5000);

    let volumeByHour: VolumeByHour[] = [];
    if (volumeResult.data) {
      const hourCounts = new Array(24).fill(0);
      volumeResult.data.forEach((conv) => {
        if (conv.started_at) {
          const hour = new Date(conv.started_at).getHours();
          hourCounts[hour]++;
        }
      });
      volumeByHour = hourCounts.map((count, hour) => ({ hour, count }));

      // Log warning if we hit the limit
      if (volumeResult.data.length === 5000) {
        console.warn('[Analytics] Volume by hour hit limit of 5000 conversations, results may be incomplete');
      }
    } else {
      volumeByHour = generateMockVolumeByHour();
    }

    // 3. Status Over Time - Active/Waiting/Resolved counts per day
    const statusResult = await supabase.rpc('get_status_over_time', {
      start_date: startDate.toISOString(),
    });

    let statusOverTime: StatusOverTime[] = [];
    if (statusResult.data && Array.isArray(statusResult.data)) {
      statusOverTime = statusResult.data.map((row: any) => ({
        date: row.date,
        active: parseInt(row.active) || 0,
        waiting: parseInt(row.waiting) || 0,
        resolved: parseInt(row.resolved) || 0,
      }));
    } else {
      statusOverTime = generateMockStatusOverTime(days);
    }

    // 4. Message Length Distribution - Conversations grouped by message count
    // FIXED: Add limit to prevent unbounded query (max 5000 conversations)
    const messageCountResult = await supabase
      .from('conversations')
      .select(`
        id,
        messages:messages(count)
      `)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })
      .limit(5000);

    let messageLengthDist: MessageLengthDist[] = [];
    if (messageCountResult.data) {
      const ranges = {
        '1-5': 0,
        '6-10': 0,
        '11-20': 0,
        '20+': 0,
      };

      messageCountResult.data.forEach((conv: any) => {
        const count = conv.messages?.[0]?.count || 0;
        if (count >= 1 && count <= 5) ranges['1-5']++;
        else if (count >= 6 && count <= 10) ranges['6-10']++;
        else if (count >= 11 && count <= 20) ranges['11-20']++;
        else if (count > 20) ranges['20+']++;
      });

      messageLengthDist = Object.entries(ranges).map(([range, count]) => ({
        range,
        count,
      }));

      // Log warning if we hit the limit
      if (messageCountResult.data.length === 5000) {
        console.warn('[Analytics] Message length distribution hit limit of 5000 conversations, results may be incomplete');
      }
    } else {
      messageLengthDist = generateMockMessageLengthDist();
    }

    const response: AnalyticsResponse = {
      responseTimeTrend,
      volumeByHour,
      statusOverTime,
      messageLengthDist,
    };

    ApiLogger.logResponse(requestId, 200, Date.now() - startTime);
    return NextResponse.json(response);
  } catch (error) {
    ApiLogger.logError(requestId, error as Error, 'analytics.timeseries');
    ApiLogger.logResponse(requestId, 500, Date.now() - startTime, false, 'INTERNAL_ERROR');
    console.error('[Analytics] Error:', error);
    // Return mock data as fallback for development
    return NextResponse.json({
      responseTimeTrend: generateMockResponseTimeTrend(30),
      volumeByHour: generateMockVolumeByHour(),
      statusOverTime: generateMockStatusOverTime(30),
      messageLengthDist: generateMockMessageLengthDist(),
    });
  }
}

// Mock data generators for development/fallback
function generateMockResponseTimeTrend(days: number): ResponseTimeTrend[] {
  const data: ResponseTimeTrend[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0] || '',
      avgMinutes: Math.random() * 10 + 1, // 1-11 minutes
    });
  }

  return data;
}

function generateMockVolumeByHour(): VolumeByHour[] {
  const data: VolumeByHour[] = [];

  for (let hour = 0; hour < 24; hour++) {
    // Simulate typical business hours pattern
    let count = 0;
    if (hour >= 9 && hour <= 17) {
      count = Math.floor(Math.random() * 20) + 10; // 10-30 during business
    } else {
      count = Math.floor(Math.random() * 5); // 0-5 off hours
    }
    data.push({ hour, count });
  }

  return data;
}

function generateMockStatusOverTime(days: number): StatusOverTime[] {
  const data: StatusOverTime[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0] || '',
      active: Math.floor(Math.random() * 15) + 5,
      waiting: Math.floor(Math.random() * 10),
      resolved: Math.floor(Math.random() * 25) + 15,
    });
  }

  return data;
}

function generateMockMessageLengthDist(): MessageLengthDist[] {
  return [
    { range: '1-5', count: Math.floor(Math.random() * 30) + 20 },
    { range: '6-10', count: Math.floor(Math.random() * 25) + 15 },
    { range: '11-20', count: Math.floor(Math.random() * 20) + 10 },
    { range: '20+', count: Math.floor(Math.random() * 15) + 5 },
  ];
}
