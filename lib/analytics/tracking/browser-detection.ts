/**
 * Browser Detection Module
 *
 * Detects browser information from user agent:
 * - Browser name and version
 * - Operating system
 * - Device type (mobile/tablet/desktop)
 * - Viewport dimensions
 */

import { BrowserInfo } from '@/types/analytics';

/**
 * Detect browser information from user agent
 */
export function detectBrowser(): BrowserInfo {
  // ✅ FIX: Add browser environment check
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      name: 'Unknown',
      version: 'Unknown',
      os: 'Unknown',
      device_type: 'desktop',
      viewport_width: 0,
      viewport_height: 0,
    };
  }

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

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session-${timestamp}-${random}`;
}
