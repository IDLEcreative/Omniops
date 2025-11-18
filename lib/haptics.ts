/**
 * Haptic Feedback Utility
 *
 * Provides tactile feedback for mobile interactions with graceful degradation.
 * Supports both Vibration API (Android) and Haptic Feedback API (iOS WebView).
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticPattern {
  vibration: number | number[];
  description: string;
}

/**
 * Haptic patterns mapped to vibration durations
 * Values in milliseconds
 */
const HAPTIC_PATTERNS: Record<HapticType, HapticPattern> = {
  light: {
    vibration: 10,
    description: 'Light tap (navigation, selection)',
  },
  medium: {
    vibration: 50,
    description: 'Medium tap (button press, add to cart)',
  },
  heavy: {
    vibration: 100,
    description: 'Heavy tap (important action, error)',
  },
  success: {
    vibration: [50, 100, 50],
    description: 'Success pattern (item added, order placed)',
  },
  warning: {
    vibration: [100, 50, 100],
    description: 'Warning pattern (low stock, cart limit)',
  },
  error: {
    vibration: [100, 100, 100],
    description: 'Error pattern (out of stock, failed action)',
  },
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Vibration API (most mobile browsers)
  if ('vibrate' in navigator) return true;

  // Check for iOS Haptic Feedback (WebView only)
  // @ts-expect-error - webkit.messageHandlers may not be defined in types
  if (window.webkit?.messageHandlers?.hapticFeedback) return true;

  return false;
}

/**
 * Trigger haptic feedback
 *
 * @param type - Type of haptic feedback
 * @returns boolean - Whether haptic was triggered successfully
 */
export function triggerHaptic(type: HapticType): boolean {
  if (!isHapticSupported()) {
    return false;
  }

  const pattern = HAPTIC_PATTERNS[type];

  try {
    // Try Vibration API first (Android and some browsers)
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern.vibration);
      return true;
    }

    // Try iOS Haptic Feedback (WebView)
    // @ts-expect-error - webkit.messageHandlers may not be defined in types
    if (window.webkit?.messageHandlers?.hapticFeedback) {
      // @ts-expect-error - webkit.messageHandlers may not be defined in types
      window.webkit.messageHandlers.hapticFeedback.postMessage({
        type,
        intensity: pattern.vibration,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return false;
  }
}

/**
 * Cancel any ongoing haptic feedback
 */
export function cancelHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

/**
 * Convenience functions for common haptic patterns
 */

/**
 * Light tap - for navigation and subtle interactions
 */
export function hapticLight(): boolean {
  return triggerHaptic('light');
}

/**
 * Medium tap - for button presses and add to cart
 */
export function hapticMedium(): boolean {
  return triggerHaptic('medium');
}

/**
 * Heavy tap - for important actions
 */
export function hapticHeavy(): boolean {
  return triggerHaptic('heavy');
}

/**
 * Success feedback - item added, order placed
 */
export function hapticSuccess(): boolean {
  return triggerHaptic('success');
}

/**
 * Warning feedback - low stock, cart limit
 */
export function hapticWarning(): boolean {
  return triggerHaptic('warning');
}

/**
 * Error feedback - out of stock, failed action
 */
export function hapticError(): boolean {
  return triggerHaptic('error');
}

/**
 * Haptic feedback for swipe gestures
 *
 * @param velocity - Swipe velocity (0-1)
 */
export function hapticSwipe(velocity: number): boolean {
  const normalizedVelocity = Math.min(Math.max(velocity, 0), 1);

  if (normalizedVelocity < 0.3) {
    return hapticLight();
  } else if (normalizedVelocity < 0.7) {
    return hapticMedium();
  } else {
    return hapticHeavy();
  }
}

/**
 * Haptic feedback for product change in feed
 * Subtle tick when swiping between products
 */
export function hapticProductChange(): boolean {
  if (!isHapticSupported()) return false;

  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(5); // Very subtle
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Debug function to test all haptic patterns
 * Useful for development and testing
 */
export async function testAllHaptics(): Promise<void> {
  if (!isHapticSupported()) {
    console.warn('Haptic feedback not supported on this device');
    return;
  }


  for (const [type, pattern] of Object.entries(HAPTIC_PATTERNS)) {
    triggerHaptic(type as HapticType);
    // Wait between patterns
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

}

/**
 * Get haptic support information
 * Useful for debugging and analytics
 */
export function getHapticInfo(): {
  supported: boolean;
  vibrationAPI: boolean;
  iOSHaptic: boolean;
  userAgent: string;
} {
  return {
    supported: isHapticSupported(),
    vibrationAPI: typeof window !== 'undefined' && 'vibrate' in navigator,
    iOSHaptic:
      typeof window !== 'undefined' &&
      // @ts-expect-error - webkit.messageHandlers may not be defined in types
      !!window.webkit?.messageHandlers?.hapticFeedback,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
  };
}
