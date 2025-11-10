/**
 * Session Metrics Module
 *
 * Calculates session analytics metrics:
 * - Duration, page views, interactions
 * - Average page duration and scroll depth
 * - Bounce rate calculation
 */

import { SessionMetadata } from '@/types/analytics';

export interface SessionMetrics {
  duration_seconds: number;
  page_views: number;
  avg_page_duration_seconds: number;
  total_interactions: number;
  avg_scroll_depth: number;
  bounce_rate: number;
}

/**
 * Calculate comprehensive session metrics
 */
export function calculateSessionMetrics(metadata: SessionMetadata): SessionMetrics {
  const now = Date.now();
  const startTime = new Date(metadata.start_time).getTime();
  const durationSeconds = Math.floor((now - startTime) / 1000);

  const pageViews = metadata.page_views;
  const totalDuration = pageViews.reduce((sum, pv) => sum + (pv.duration_seconds || 0), 0);
  const avgPageDuration = pageViews.length > 0 ? totalDuration / pageViews.length : 0;

  const totalInteractions = pageViews.reduce((sum, pv) => sum + (pv.interactions || 0), 0);
  const totalScrollDepth = pageViews.reduce((sum, pv) => sum + (pv.scroll_depth || 0), 0);
  const avgScrollDepth = pageViews.length > 0 ? totalScrollDepth / pageViews.length : 0;

  // Bounce rate: session with only 1 page view
  const bounceRate = pageViews.length === 1 ? 1 : 0;

  return {
    duration_seconds: durationSeconds,
    page_views: pageViews.length,
    avg_page_duration_seconds: Math.floor(avgPageDuration),
    total_interactions: totalInteractions,
    avg_scroll_depth: Math.floor(avgScrollDepth),
    bounce_rate: bounceRate,
  };
}

/**
 * Calculate session end metrics
 */
export function calculateEndMetrics(metadata: SessionMetadata): {
  end_time: string;
  duration_seconds: number;
} {
  const endTime = new Date().toISOString();
  const startTime = new Date(metadata.start_time).getTime();
  const endTimeMs = new Date(endTime).getTime();
  const durationSeconds = Math.floor((endTimeMs - startTime) / 1000);

  return {
    end_time: endTime,
    duration_seconds: durationSeconds,
  };
}
