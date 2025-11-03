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

import {
  SessionMetadata,
  PageView,
  BrowserInfo,
} from '@/types/analytics';

// ============================================================================
// Configuration
// ============================================================================

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY_SESSION = 'omniops-session-metadata';
const STORAGE_KEY_LAST_ACTIVITY = 'omniops-session-last-activity';

// ============================================================================
// Session ID Generation
// ============================================================================

function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session-${timestamp}-${random}`;
}

// ============================================================================
// Browser Detection
// ============================================================================

function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  // Browser detection
  if (ua.includes('Firefox/')) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Edg/')) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Chrome/')) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari/')) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  }

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  // Device type detection
  if (ua.includes('Mobile')) deviceType = 'mobile';
  else if (ua.includes('Tablet')) deviceType = 'tablet';

  return {
    name: browserName,
    version: browserVersion,
    os,
    device_type: deviceType,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  };
}

// ============================================================================
// Session Tracker Class
// ============================================================================

export class SessionTracker {
  private sessionId: string;
  private metadata: SessionMetadata;
  private pageStartTime: number = Date.now();
  private activityCheckInterval: NodeJS.Timeout | null = null;

  constructor(domain: string) {
    // Check for existing session
    const existing = this.loadSession();
    const lastActivity = this.getLastActivity();
    const now = Date.now();

    if (existing && lastActivity && (now - lastActivity < SESSION_TIMEOUT_MS)) {
      // Continue existing session
      this.sessionId = existing.session_id;
      this.metadata = existing;
    } else {
      // Start new session
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

    this.updateLastActivity();
    this.trackPageView();
    this.startActivityMonitoring();
    this.setupBeforeUnload();
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current session metadata
   */
  public getMetadata(): SessionMetadata {
    return { ...this.metadata };
  }

  /**
   * Track a page view
   */
  public trackPageView(url?: string, title?: string): void {
    const pageView: PageView = {
      url: url || window.location.href,
      title: title || document.title,
      timestamp: new Date().toISOString(),
    };

    this.metadata.page_views.push(pageView);
    this.metadata.total_pages = this.metadata.page_views.length;
    this.pageStartTime = Date.now();

    this.saveSession();
    this.updateLastActivity();
  }

  /**
   * Update duration for current page view
   */
  private updateCurrentPageDuration(): void {
    const currentPage = this.metadata.page_views[this.metadata.page_views.length - 1];
    if (currentPage) {
      const durationSeconds = (Date.now() - this.pageStartTime) / 1000;
      currentPage.duration_seconds = Math.floor(durationSeconds);
      this.saveSession();
    }
  }

  /**
   * Link a conversation to this session
   */
  public linkConversation(conversationId: string): void {
    if (!this.metadata.conversation_ids.includes(conversationId)) {
      this.metadata.conversation_ids.push(conversationId);
      this.saveSession();
    }
  }

  /**
   * Track scroll depth on current page
   */
  public trackScrollDepth(scrollDepth: number): void {
    const currentPage = this.metadata.page_views[this.metadata.page_views.length - 1];
    if (currentPage) {
      currentPage.scroll_depth = Math.max(currentPage.scroll_depth || 0, scrollDepth);
      this.saveSession();
    }
  }

  /**
   * Track interactions on current page
   */
  public trackInteraction(): void {
    const currentPage = this.metadata.page_views[this.metadata.page_views.length - 1];
    if (currentPage) {
      currentPage.interactions = (currentPage.interactions || 0) + 1;
      this.saveSession();
    }
    this.updateLastActivity();
  }

  /**
   * End current session
   */
  public endSession(): void {
    this.updateCurrentPageDuration();

    this.metadata.end_time = new Date().toISOString();
    const startTime = new Date(this.metadata.start_time).getTime();
    const endTime = new Date(this.metadata.end_time).getTime();
    this.metadata.duration_seconds = Math.floor((endTime - startTime) / 1000);

    this.saveSession();
    this.stopActivityMonitoring();
  }

  /**
   * Calculate session metrics
   */
  public calculateMetrics(): {
    duration_seconds: number;
    page_views: number;
    avg_page_duration_seconds: number;
    total_interactions: number;
    avg_scroll_depth: number;
    bounce_rate: number;
  } {
    const now = Date.now();
    const startTime = new Date(this.metadata.start_time).getTime();
    const durationSeconds = Math.floor((now - startTime) / 1000);

    const pageViews = this.metadata.page_views;
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
   * Save session to localStorage
   */
  private saveSession(): void {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('[SessionTracker] Failed to save session:', error);
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): SessionMetadata | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SESSION);
      if (data) {
        return JSON.parse(data) as SessionMetadata;
      }
    } catch (error) {
      console.error('[SessionTracker] Failed to load session:', error);
    }
    return null;
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, Date.now().toString());
    } catch (error) {
      console.error('[SessionTracker] Failed to update activity:', error);
    }
  }

  /**
   * Get last activity timestamp
   */
  private getLastActivity(): number | null {
    try {
      const timestamp = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('[SessionTracker] Failed to get activity:', error);
      return null;
    }
  }

  /**
   * Start activity monitoring
   */
  private startActivityMonitoring(): void {
    // Update page duration every 10 seconds
    this.activityCheckInterval = setInterval(() => {
      this.updateCurrentPageDuration();
    }, 10000);

    // Track user activity
    ['click', 'scroll', 'keydown', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => this.updateLastActivity(), { passive: true });
    });
  }

  /**
   * Stop activity monitoring
   */
  private stopActivityMonitoring(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
  }

  /**
   * Setup beforeunload handler
   */
  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  /**
   * Export session data for analytics
   */
  public exportData(): SessionMetadata {
    this.updateCurrentPageDuration();
    return {
      ...this.metadata,
      end_time: new Date().toISOString(),
      duration_seconds: this.calculateMetrics().duration_seconds,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

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

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current session ID without creating tracker
 */
export function getCurrentSessionId(): string | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SESSION);
    if (data) {
      const metadata = JSON.parse(data) as SessionMetadata;
      return metadata.session_id;
    }
  } catch (error) {
    console.error('[SessionTracker] Failed to get session ID:', error);
  }
  return null;
}

/**
 * Check if current session is active
 */
export function isSessionActive(): boolean {
  try {
    const lastActivity = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    if (lastActivity) {
      const now = Date.now();
      const last = parseInt(lastActivity, 10);
      return (now - last) < SESSION_TIMEOUT_MS;
    }
  } catch (error) {
    console.error('[SessionTracker] Failed to check session activity:', error);
  }
  return false;
}
