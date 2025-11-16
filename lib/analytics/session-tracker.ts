/**
 * Session Tracker
 *
 * Tracks user sessions across pages and conversations:
 * - Generates and maintains session IDs
 * - Tracks page visits within session
 * - Calculates session metrics
 * - Links conversations to sessions
 * - Stores session metadata
 *
 * Session lifecycle:
 * 1. Session starts on first page load
 * 2. Continues across page navigations (same tab)
 * 3. Ends after 30 minutes of inactivity or tab close
 */

import { SessionMetadata } from '@/types/analytics';
import { detectBrowser, generateSessionId } from './tracking/browser-detection';
import {
  saveSession,
  loadSession,
  updateLastActivity,
  getLastActivity,
  SESSION_TIMEOUT_MS,
} from './tracking/session-storage';
import { calculateSessionMetrics, calculateEndMetrics } from './tracking/session-metrics';
import {
  createPageView,
  updatePageDuration,
  trackScrollDepth as trackScroll,
  trackInteraction as trackPageInteraction,
  addPageView,
  linkConversation as linkSessionConversation,
} from './tracking/page-tracking';
import {
  startActivityMonitoring,
  stopActivityMonitoring,
  setupBeforeUnload,
} from './tracking/activity-monitor';

// Re-export utilities for backward compatibility
export { getCurrentSessionId, isSessionActive } from './tracking/session-storage';

export class SessionTracker {
  private sessionId: string;
  private metadata: SessionMetadata;
  private pageStartTime: number = Date.now();
  private activityCheckInterval: NodeJS.Timeout | null = null;

  constructor(domain: string) {
    // ✅ FIX: Add browser environment check
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      throw new Error('SessionTracker can only be used in browser environment');
    }

    const existing = loadSession();
    const lastActivity = getLastActivity();
    const now = Date.now();

    if (existing && lastActivity && (now - lastActivity < SESSION_TIMEOUT_MS)) {
      this.sessionId = existing.session_id;
      this.metadata = existing;
    } else {
      this.sessionId = generateSessionId();
      this.metadata = {
        session_id: this.sessionId,
        domain,
        start_time: new Date().toISOString(),
        page_views: [],
        total_pages: 0,
        conversation_ids: [],
        user_agent: navigator.userAgent,
        initial_referrer: document.referrer || undefined,
        browser_info: detectBrowser(),
      };
    }

    updateLastActivity();
    this.trackPageView();
    this.startMonitoring();
    setupBeforeUnload(() => this.endSession());
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getMetadata(): SessionMetadata {
    return { ...this.metadata };
  }

  public trackPageView(url?: string, title?: string): void {
    const pageView = createPageView(url, title);
    this.metadata = addPageView(this.metadata, pageView);
    this.pageStartTime = Date.now();
    saveSession(this.metadata);
    updateLastActivity();
  }

  public linkConversation(conversationId: string): void {
    this.metadata = linkSessionConversation(this.metadata, conversationId);
    saveSession(this.metadata);
  }

  public trackScrollDepth(scrollDepth: number): void {
    this.metadata = trackScroll(this.metadata, scrollDepth);
    saveSession(this.metadata);
  }

  public trackInteraction(): void {
    this.metadata = trackPageInteraction(this.metadata);
    saveSession(this.metadata);
    updateLastActivity();
  }

  public endSession(): void {
    this.metadata = updatePageDuration(this.metadata, this.pageStartTime);
    const endMetrics = calculateEndMetrics(this.metadata);
    this.metadata.end_time = endMetrics.end_time;
    this.metadata.duration_seconds = endMetrics.duration_seconds;
    saveSession(this.metadata);
    this.stopMonitoring();
  }

  public calculateMetrics() {
    return calculateSessionMetrics(this.metadata);
  }

  public exportData(): SessionMetadata {
    this.metadata = updatePageDuration(this.metadata, this.pageStartTime);
    const metrics = calculateSessionMetrics(this.metadata);
    return {
      ...this.metadata,
      end_time: new Date().toISOString(),
      duration_seconds: metrics.duration_seconds,
    };
  }

  private startMonitoring(): void {
    this.activityCheckInterval = startActivityMonitoring(() => {
      this.metadata = updatePageDuration(this.metadata, this.pageStartTime);
      saveSession(this.metadata);
    });
  }

  private stopMonitoring(): void {
    stopActivityMonitoring(this.activityCheckInterval);
    this.activityCheckInterval = null;
  }
}

let globalSessionTracker: SessionTracker | null = null;

export function getSessionTracker(domain: string): SessionTracker {
  if (!globalSessionTracker) {
    globalSessionTracker = new SessionTracker(domain);
  }
  return globalSessionTracker;
}

export function destroySessionTracker(): void {
  if (globalSessionTracker) {
    globalSessionTracker.endSession();
    globalSessionTracker = null;
  }
}
