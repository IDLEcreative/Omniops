/**
 * Page Tracking Module
 *
 * Manages page view tracking:
 * - Creates page view records
 * - Updates page durations
 * - Tracks scroll depth and interactions
 */

import { PageView, SessionMetadata } from '@/types/analytics';

/**
 * Create a new page view record
 */
export function createPageView(url?: string, title?: string): PageView {
  return {
    url: url || window.location.href,
    title: title || document.title,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Update current page duration
 */
export function updatePageDuration(
  metadata: SessionMetadata,
  pageStartTime: number
): SessionMetadata {
  const currentPage = metadata.page_views[metadata.page_views.length - 1];
  if (currentPage) {
    const durationSeconds = (Date.now() - pageStartTime) / 1000;
    currentPage.duration_seconds = Math.floor(durationSeconds);
  }
  return metadata;
}

/**
 * Track scroll depth on current page
 */
export function trackScrollDepth(
  metadata: SessionMetadata,
  scrollDepth: number
): SessionMetadata {
  const currentPage = metadata.page_views[metadata.page_views.length - 1];
  if (currentPage) {
    currentPage.scroll_depth = Math.max(currentPage.scroll_depth || 0, scrollDepth);
  }
  return metadata;
}

/**
 * Track interaction on current page
 */
export function trackInteraction(metadata: SessionMetadata): SessionMetadata {
  const currentPage = metadata.page_views[metadata.page_views.length - 1];
  if (currentPage) {
    currentPage.interactions = (currentPage.interactions || 0) + 1;
  }
  return metadata;
}

/**
 * Add page view to session
 */
export function addPageView(
  metadata: SessionMetadata,
  pageView: PageView
): SessionMetadata {
  metadata.page_views.push(pageView);
  metadata.total_pages = metadata.page_views.length;
  return metadata;
}

/**
 * Link conversation to session
 */
export function linkConversation(
  metadata: SessionMetadata,
  conversationId: string
): SessionMetadata {
  if (!metadata.conversation_ids.includes(conversationId)) {
    metadata.conversation_ids.push(conversationId);
  }
  return metadata;
}
