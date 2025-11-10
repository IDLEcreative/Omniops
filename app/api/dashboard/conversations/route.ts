import { NextRequest, NextResponse } from 'next/server';
import { ConversationCache } from '@/lib/cache/conversation-cache';
import { checkDashboardRateLimit } from '@/lib/middleware/dashboard-rate-limit';
import { ConversationsQuerySchema } from '@/lib/services/dashboard/validation-schemas';
import { ConversationsService } from '@/lib/services/dashboard/conversations-service';

export async function GET(request: NextRequest) {
  const performanceStart = Date.now();

  try {
    // Apply rate limiting
    const userId = 'anonymous'; // TODO: Extract from authenticated user
    const rateLimitResponse = await checkDashboardRateLimit(userId, 'dashboard');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryValidation = ConversationsQuerySchema.safeParse({
      days: searchParams.get('days'),
      limit: searchParams.get('limit'),
      cursor: searchParams.get('cursor'),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryValidation.error.errors,
        },
        { status: 400 }
      );
    }

    const { days, limit, cursor } = queryValidation.data;

    // Try cache first
    const domainId = 'default'; // TODO: Extract from authenticated user's domain
    const cacheFilters = { days, cursor, limit };

    const cached = await ConversationCache.getConversationsList(
      domainId,
      cacheFilters
    );
    if (cached) {
      const duration = Date.now() - performanceStart;
      console.log(`[Dashboard] Cache hit - served in ${duration}ms`);

      return NextResponse.json({
        ...cached,
        _cached: true,
        _responseTime: duration,
      });
    }

    console.log('[Dashboard] Cache miss - fetching from database');

    // Fetch data using service
    const responseData = await ConversationsService.getConversationStats({
      days,
      limit,
      cursor,
    });

    // Cache the response (fire and forget)
    ConversationCache.setConversationsList(domainId, cacheFilters, responseData).catch(
      (err) => console.error('[Dashboard] Failed to cache response:', err)
    );

    const duration = Date.now() - performanceStart;
    console.log(`[Dashboard] Database query completed in ${duration}ms`);

    return NextResponse.json({
      ...responseData,
      _cached: false,
      _responseTime: duration,
    });
  } catch (error) {
    console.error('[Dashboard] Unexpected error in conversations endpoint:', error);
    return NextResponse.json({
      total: 0,
      change: 0,
      statusCounts: {
        active: 0,
        waiting: 0,
        resolved: 0,
      },
      languages: [],
      peakHours: [],
      recent: [],
    });
  }
}
