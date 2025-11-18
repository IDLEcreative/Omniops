import { NextRequest, NextResponse } from 'next/server';
import { ConversationCache } from '@/lib/cache/conversation-cache';
import { checkDashboardRateLimit } from '@/lib/middleware/dashboard-rate-limit';
import { ConversationsQuerySchema } from '@/lib/services/dashboard/validation-schemas';
import { ConversationsService } from '@/lib/services/dashboard/conversations-service';
import { requireOrgWithDomains } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  const performanceStart = Date.now();

  try {
    // Authenticate user and get organization
    const authResult = await requireOrgWithDomains();
    if (authResult instanceof NextResponse) {
      return authResult; // Return auth error
    }

    const { user, organizationId, allowedDomains } = authResult;

    // Apply rate limiting
    const rateLimitResponse = await checkDashboardRateLimit(user.id, 'dashboard');
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

    // Try cache first (use organizationId for cache key)
    const cacheFilters = { days, cursor, limit };

    const cached = await ConversationCache.getConversationsList(
      organizationId,
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

    // Fetch data using service with organization filter
    const responseData = await ConversationsService.getConversationStats({
      days,
      limit,
      cursor,
      organizationId,
    });

    // Cache the response (fire and forget)
    ConversationCache.setConversationsList(organizationId, cacheFilters, responseData).catch(
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
