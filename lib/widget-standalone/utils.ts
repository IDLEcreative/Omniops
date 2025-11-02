/**
 * Widget Standalone Utilities
 */

import type { StandaloneWidgetConfig } from './types';
import type { PrivacySettings } from '../../components/ChatWidget/hooks/useChatState';

export function buildWidgetConfig(config: StandaloneWidgetConfig) {
  return {
    serverUrl: config.serverUrl, // CRITICAL: Pass through for API calls
    domain: config.domain, // Pass through detected domain for registration
    headerTitle: config.headerTitle || 'Support',
    features: config.features || {
      websiteScraping: { enabled: true },
      woocommerce: { enabled: false },
    },
    appearance: {
      showPulseAnimation: config.appearance?.showPulseAnimation ?? true,
      showNotificationBadge: config.appearance?.showNotificationBadge ?? true,
      startMinimized: config.appearance?.startMinimized ?? true,
    },
  };
}

export function buildPrivacySettings(config: StandaloneWidgetConfig): Partial<PrivacySettings> {
  return {
    allowOptOut: config.privacySettings?.allowOptOut ?? true,
    showPrivacyNotice: config.privacySettings?.showPrivacyNotice ?? true,
    requireConsent: config.privacySettings?.requireConsent ?? false,
    consentGiven: config.privacySettings?.consentGiven ?? false,
    retentionDays: config.privacySettings?.retentionDays ?? 30,
  };
}

export function injectStyles(styles: string) {
  const styleEl = document.createElement('style');
  styleEl.id = 'omniops-widget-styles';
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export function setupContainer(containerId: string): HTMLElement | null {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[Omniops Widget] Container #${containerId} not found`);
    return null;
  }

  container.style.cssText = 'position: fixed; inset: 0; overflow: hidden; background: transparent;';
  return container;
}
