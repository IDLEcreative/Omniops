/**
 * User Analytics Module
 *
 * Calculates comprehensive user metrics including:
 * - Daily Active Users (DAU)
 * - New vs Returning Users
 * - Session duration and engagement
 * - User growth metrics
 * - Shopping behavior patterns
 */

import { SessionMetadata, PageView } from '@/types/analytics';
import { calculateDailyMetrics } from './calculators/dailyMetrics';
import { calculateSessionStats } from './calculators/sessionStats';
import { calculatePageViewStats } from './calculators/pageViewStats';
import { calculateShoppingBehavior } from './calculators/shoppingBehavior';

export interface DailyUserMetric {
  date: string;
  unique_users: number;
  new_users: number;
  returning_users: number;
  total_sessions: number;
  avg_session_duration: number;
  total_page_views: number;
}

export interface UserGrowthMetrics {
  current_period_users: number;
  previous_period_users: number;
  growth_rate: number; // Percentage
  growth_absolute: number;
}

export interface SessionDurationMetrics {
  avg_duration_seconds: number;
  median_duration_seconds: number;
  total_sessions: number;
  bounce_rate: number; // Sessions with only 1 page view
}

export interface PageViewMetrics {
  total_views: number;
  unique_pages: number;
  avg_views_per_session: number;
  top_pages: Array<{ url: string; views: number; }>;
}

export interface ShoppingBehaviorMetrics {
  product_page_views: number;
  unique_products_viewed: number;
  cart_page_views: number;
  checkout_page_views: number;
  conversion_rate: number; // checkout / product views
  avg_products_per_session: number;
}

export interface UserAnalyticsResult {
  daily_metrics: DailyUserMetric[];
  growth: UserGrowthMetrics;
  session_stats: SessionDurationMetrics;
  page_view_stats: PageViewMetrics;
  shopping_behavior: ShoppingBehaviorMetrics;
  total_unique_users: number;
  avg_daily_users: number;
}

interface ConversationWithMetadata {
  session_id: string | null;
  created_at: string;
  metadata?: {
    session_metadata?: SessionMetadata;
  } | null;
}

/**
 * Calculate comprehensive user analytics from conversations
 */
export function calculateUserAnalytics(
  conversations: ConversationWithMetadata[],
  options: { days?: number; previous_period_days?: number } = {}
): UserAnalyticsResult {
  const { days = 7, previous_period_days = 7 } = options;

  if (!conversations || conversations.length === 0) {
    return getEmptyAnalytics();
  }

  // Calculate date range
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(currentPeriodStart.getDate() - days);

  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - previous_period_days);

  // Filter conversations for current and previous periods
  const currentPeriodConvos = conversations.filter(c =>
    new Date(c.created_at) >= currentPeriodStart
  );

  const previousPeriodConvos = conversations.filter(c => {
    const date = new Date(c.created_at);
    return date >= previousPeriodStart && date < currentPeriodStart;
  });

  // Calculate daily metrics
  const dailyMetrics = calculateDailyMetrics(currentPeriodConvos, days);

  // Calculate unique users
  const currentPeriodUsers = new Set(
    currentPeriodConvos.map(c => c.session_id).filter(Boolean)
  );
  const previousPeriodUsers = new Set(
    previousPeriodConvos.map(c => c.session_id).filter(Boolean)
  );

  // Calculate growth
  const growth = calculateGrowthMetrics(
    currentPeriodUsers.size,
    previousPeriodUsers.size
  );

  // Calculate session stats
  const sessionStats = calculateSessionStats(currentPeriodConvos);

  // Calculate page view stats
  const pageViewStats = calculatePageViewStats(currentPeriodConvos);

  // Calculate shopping behavior
  const shoppingBehavior = calculateShoppingBehavior(currentPeriodConvos);

  // Calculate averages
  const avgDailyUsers = dailyMetrics.length > 0
    ? dailyMetrics.reduce((sum, day) => sum + day.unique_users, 0) / dailyMetrics.length
    : 0;

  return {
    daily_metrics: dailyMetrics,
    growth,
    session_stats: sessionStats,
    page_view_stats: pageViewStats,
    shopping_behavior: shoppingBehavior,
    total_unique_users: currentPeriodUsers.size,
    avg_daily_users: Math.round(avgDailyUsers),
  };
}


/**
 * Calculate growth metrics
 */
function calculateGrowthMetrics(
  currentPeriodUsers: number,
  previousPeriodUsers: number
): UserGrowthMetrics {
  const growthAbsolute = currentPeriodUsers - previousPeriodUsers;
  const growthRate = previousPeriodUsers > 0
    ? Math.round((growthAbsolute / previousPeriodUsers) * 100)
    : currentPeriodUsers > 0 ? 100 : 0;

  return {
    current_period_users: currentPeriodUsers,
    previous_period_users: previousPeriodUsers,
    growth_rate: growthRate,
    growth_absolute: growthAbsolute,
  };
}




/**
 * Get empty analytics result
 */
function getEmptyAnalytics(): UserAnalyticsResult {
  return {
    daily_metrics: [],
    growth: {
      current_period_users: 0,
      previous_period_users: 0,
      growth_rate: 0,
      growth_absolute: 0,
    },
    session_stats: {
      avg_duration_seconds: 0,
      median_duration_seconds: 0,
      total_sessions: 0,
      bounce_rate: 0,
    },
    page_view_stats: {
      total_views: 0,
      unique_pages: 0,
      avg_views_per_session: 0,
      top_pages: [],
    },
    shopping_behavior: {
      product_page_views: 0,
      unique_products_viewed: 0,
      cart_page_views: 0,
      checkout_page_views: 0,
      conversion_rate: 0,
      avg_products_per_session: 0,
    },
    total_unique_users: 0,
    avg_daily_users: 0,
  };
}
