/**
 * Session Storage Module
 *
 * Manages localStorage persistence for session data:
 * - Saves/loads session metadata
 * - Tracks last activity timestamp
 * - Handles storage errors gracefully
 */

import { SessionMetadata } from '@/types/analytics';

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY_SESSION = 'omniops-session-metadata';
const STORAGE_KEY_LAST_ACTIVITY = 'omniops-session-last-activity';

/**
 * Save session metadata to localStorage
 */
export function saveSession(metadata: SessionMetadata): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(metadata));
  } catch (error) {
    console.error('[SessionTracker] Failed to save session:', error);
  }
}

/**
 * Load session metadata from localStorage
 */
export function loadSession(): SessionMetadata | null {
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
export function updateLastActivity(): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    console.error('[SessionTracker] Failed to update activity:', error);
  }
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number | null {
  try {
    const timestamp = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('[SessionTracker] Failed to get activity:', error);
    return null;
  }
}

/**
 * Check if session is still active (within timeout)
 */
export function isSessionActive(): boolean {
  try {
    const lastActivity = getLastActivity();
    if (lastActivity) {
      const now = Date.now();
      return (now - lastActivity) < SESSION_TIMEOUT_MS;
    }
  } catch (error) {
    console.error('[SessionTracker] Failed to check session activity:', error);
  }
  return false;
}

/**
 * Get current session ID without full metadata
 */
export function getCurrentSessionId(): string | null {
  try {
    const metadata = loadSession();
    return metadata?.session_id || null;
  } catch (error) {
    console.error('[SessionTracker] Failed to get session ID:', error);
  }
  return null;
}
