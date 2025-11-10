/**
 * Page View Stats Calculator
 *
 * Calculates page view metrics and top pages
 */

import { PageViewMetrics } from '../user-analytics';
import { PageView } from '@/types/analytics';
import { cleanUrl } from '../utils/urlUtils';

interface ConversationWithMetadata {
  session_id: string | null;
  created_at: string;
  metadata?: {
    session_metadata?: {
      page_views?: PageView[];
    };
  } | null;
}

export function calculatePageViewStats(
  conversations: ConversationWithMetadata[]
): PageViewMetrics {
  const pageViewCounts = new Map<string, number>();
  let totalViews = 0;
  let totalSessions = 0;

  conversations.forEach(conv => {
    const sessionMetadata = conv.metadata?.session_metadata;
    if (sessionMetadata?.page_views) {
      totalSessions++;

      sessionMetadata.page_views.forEach((view: PageView) => {
        totalViews++;
        const url = cleanUrl(view.url);
        pageViewCounts.set(url, (pageViewCounts.get(url) || 0) + 1);
      });
    }
  });

  const topPages = Array.from(pageViewCounts.entries())
    .map(([url, views]) => ({ url, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    total_views: totalViews,
    unique_pages: pageViewCounts.size,
    avg_views_per_session: totalSessions > 0
      ? Math.round((totalViews / totalSessions) * 10) / 10
      : 0,
    top_pages: topPages,
  };
}
