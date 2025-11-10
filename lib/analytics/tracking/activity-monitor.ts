/**
 * Activity Monitor Module
 *
 * Handles user activity monitoring:
 * - Sets up activity listeners
 * - Monitors page duration updates
 * - Manages cleanup on unload
 */

import { updateLastActivity } from './session-storage';

export type ActivityCallback = () => void;

/**
 * Start monitoring user activity
 */
export function startActivityMonitoring(
  onActivityUpdate: ActivityCallback
): NodeJS.Timeout {
  // Update page duration every 10 seconds
  const interval = setInterval(() => {
    onActivityUpdate();
  }, 10000);

  // Track user activity events
  const activityHandler = () => updateLastActivity();
  ['click', 'scroll', 'keydown', 'mousemove'].forEach(event => {
    document.addEventListener(event, activityHandler, { passive: true });
  });

  return interval;
}

/**
 * Stop activity monitoring
 */
export function stopActivityMonitoring(interval: NodeJS.Timeout | null): void {
  if (interval) {
    clearInterval(interval);
  }
}

/**
 * Setup beforeunload handler
 */
export function setupBeforeUnload(onUnload: ActivityCallback): void {
  window.addEventListener('beforeunload', onUnload);
}
