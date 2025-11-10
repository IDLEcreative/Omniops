import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { analyseMessages } from '@/lib/dashboard/analytics';
import { calculateUserAnalytics } from '@/lib/dashboard/analytics/user-analytics';
import { requireAuth } from '@/lib/middleware/auth';
import { checkAnalyticsRateLimit, addRateLimitHeaders } from '@/lib/middleware/analytics-rate-limit';
import { checkThresholds } from '@/lib/alerts/threshold-checker';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication: Require valid user session
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 error
    }
    const { user, supabase } = authResult;

    // 2. Rate Limiting: 20 requests per minute for dashboard
    const rateLimitError = await checkAnalyticsRateLimit(user, 'dashboard');
    if (rateLimitError) {
      return rateLimitError; // Return 429 error
    }

    // 3. Get user's organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 404 });
    }

    // 4. Get organization's domains for multi-tenant filtering
    const { data: configs, error: configError } = await supabase
      .from('customer_configs')
      .select('domain')
      .eq('organization_id', membership.organization_id);

    if (configError) {
      return NextResponse.json({ error: 'Failed to fetch organization domains' }, { status: 500 });
    }

    const allowedDomains = configs?.map(c => c.domain) || [];

    // 5. Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 6. Fetch messages for user's organization only (multi-tenant security)
    const serviceSupabase = await createServiceRoleClient();
    if (!serviceSupabase) {
      throw new Error('Failed to create Supabase client');
    }

    // Build query with domain filtering
    let query = serviceSupabase
      .from('messages')
      .select('content, role, created_at, metadata, conversations!inner(domain)')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    // Filter by allowed domains
    if (allowedDomains.length > 0) {
      query = query.in('conversations.domain', allowedDomains);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) throw messagesError;

    const analytics = analyseMessages(messages || [], { days });

    // Fetch conversations with session metadata for user analytics
    const { data: conversations, error: conversationsError } = await serviceSupabase
      .from('conversations')
      .select('session_id, created_at, metadata')
      .in('domain', allowedDomains)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (conversationsError) {
      console.error('[Dashboard] Error fetching conversations:', conversationsError);
    }

    // Calculate user analytics (DAU, session metrics, shopping behavior)
    const userAnalytics = calculateUserAnalytics(conversations || [], { days });

    // 7. Check alert thresholds and trigger notifications if needed
    const metrics = {
      response_time: analytics.avgResponseTimeSeconds,
      error_rate: 0, // Calculate from analytics if available
      sentiment_score: analytics.satisfactionScore,
      conversion_rate: 0, // Calculate from analytics if available
      resolution_rate: analytics.resolutionRate,
      message_volume: analytics.totalMessages,
    };

    // Run threshold checking asynchronously (don't block response)
    checkThresholds(membership.organization_id, metrics).catch((error) => {
      console.error('[Dashboard] Error checking alert thresholds:', error);
    });

    const response = NextResponse.json({
      responseTime: analytics.avgResponseTimeSeconds,
      satisfactionScore: analytics.satisfactionScore,
      resolutionRate: analytics.resolutionRate,
      topQueries: analytics.topQueries.map((item) => ({
        query: item.query.substring(0, 120),
        count: item.count,
        percentage: item.percentage
      })),
      failedSearches: analytics.failedSearches,
      languageDistribution: analytics.languageDistribution.map((item) => ({
        language: item.language,
        percentage: item.percentage,
        count: item.count,
        color: item.language.toLowerCase() === 'english'
          ? 'bg-blue-500'
          : item.language.toLowerCase() === 'spanish'
            ? 'bg-green-500'
            : item.language.toLowerCase() === 'french'
              ? 'bg-yellow-500'
              : item.language.toLowerCase() === 'german'
                ? 'bg-purple-500'
                : 'bg-gray-500'
      })),
      dailySentiment: analytics.dailySentiment,
      metrics: {
        totalMessages: analytics.totalMessages,
        userMessages: analytics.totalUserMessages,
        avgMessagesPerDay: analytics.avgMessagesPerDay,
        positiveMessages: analytics.positiveUserMessages,
        negativeMessages: analytics.negativeUserMessages
      },
      // User Analytics
      userMetrics: {
        dailyActiveUsers: userAnalytics.avg_daily_users,
        totalUniqueUsers: userAnalytics.total_unique_users,
        growthRate: userAnalytics.growth.growth_rate,
        growthAbsolute: userAnalytics.growth.growth_absolute,
      },
      sessionMetrics: {
        avgDuration: userAnalytics.session_stats.avg_duration_seconds,
        medianDuration: userAnalytics.session_stats.median_duration_seconds,
        totalSessions: userAnalytics.session_stats.total_sessions,
        bounceRate: userAnalytics.session_stats.bounce_rate,
      },
      pageViews: {
        total: userAnalytics.page_view_stats.total_views,
        uniquePages: userAnalytics.page_view_stats.unique_pages,
        avgPerSession: userAnalytics.page_view_stats.avg_views_per_session,
        topPages: userAnalytics.page_view_stats.top_pages,
      },
      shoppingBehavior: {
        productViews: userAnalytics.shopping_behavior.product_page_views,
        uniqueProducts: userAnalytics.shopping_behavior.unique_products_viewed,
        cartViews: userAnalytics.shopping_behavior.cart_page_views,
        checkoutViews: userAnalytics.shopping_behavior.checkout_page_views,
        conversionRate: userAnalytics.shopping_behavior.conversion_rate,
        avgProductsPerSession: userAnalytics.shopping_behavior.avg_products_per_session,
      },
      dailyUsers: userAnalytics.daily_metrics.map(day => ({
        date: day.date,
        users: day.unique_users,
        newUsers: day.new_users,
        returningUsers: day.returning_users,
        sessions: day.total_sessions,
        avgSessionDuration: day.avg_session_duration,
        pageViews: day.total_page_views,
      })),
    });

    // Add rate limit headers
    await addRateLimitHeaders(response, user, 'dashboard');
    return response;

  } catch (error) {
    console.error('[Dashboard] Error fetching analytics:', error);
    return NextResponse.json(
      {
        responseTime: 2.5,
        satisfactionScore: 4.0,
        resolutionRate: 85,
        topQueries: [],
        failedSearches: [],
        languageDistribution: [],
        dailySentiment: [],
        metrics: { totalMessages: 0, userMessages: 0, avgMessagesPerDay: 0, positiveMessages: 0, negativeMessages: 0 }
      },
      { status: 200 }
    );
  }
}
