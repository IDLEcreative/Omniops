import {
  WidgetConfig,
  WidgetAppearance,
  WidgetBehavior,
  WidgetFeatures,
  RemoteWidgetConfig,
} from './types';

export const DEFAULT_CONFIG: WidgetConfig = {
  serverUrl: 'https://www.omniops.co.uk',
  appearance: {
    position: 'bottom-right',
    width: 400,
    height: 600,
    showPulseAnimation: true,
    showNotificationBadge: true,
    startMinimized: true,
  },
  features: {},
  behavior: {
    welcomeMessage: 'Hi! How can I help you today?',
    placeholderText: 'Type your message...',
    botName: 'Assistant',
    avatarUrl: '',
    showAvatar: true,
    showTypingIndicator: true,
    autoOpen: false,
    openDelay: 3000,
    minimizable: true,
    soundNotifications: false,
    persistConversation: true,
    messageDelay: 500,
  },
  privacy: {
    allowOptOut: true,
    showPrivacyNotice: true,
    requireConsent: false,
    retentionDays: 30,
  },
  userData: null,
  pageContext: null,
  cartData: null,
  orderContext: null,
  woocommerceEnabled: false,
  storeDomain: null,
  debug: false,
};

export function mergeAppearance(
  base: WidgetAppearance,
  overrides?: Partial<WidgetAppearance> | null
): WidgetAppearance {
  return { ...base, ...(overrides || {}) };
}

export function mergeBehavior(
  base: WidgetBehavior,
  overrides?: Partial<WidgetBehavior> | null
): WidgetBehavior {
  return { ...base, ...(overrides || {}) };
}

export function mergeFeatures(base: WidgetFeatures, overrides?: WidgetFeatures | null): WidgetFeatures {
  return { ...base, ...(overrides || {}) };
}

export function createConfig(userConfig: Partial<WidgetConfig> = {}): WidgetConfig {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    appearance: mergeAppearance(DEFAULT_CONFIG.appearance, userConfig.appearance),
    behavior: mergeBehavior(DEFAULT_CONFIG.behavior, userConfig.behavior),
    features: mergeFeatures(DEFAULT_CONFIG.features, userConfig.features),
    privacy: {
      ...DEFAULT_CONFIG.privacy,
      ...(userConfig.privacy || {}),
    },
  };
}

export function applyRemoteConfig(
  current: WidgetConfig,
  remote?: RemoteWidgetConfig | null,
  userOverrides: Partial<WidgetConfig> = {}
): WidgetConfig {
  if (!remote) {
    return current;
  }

  const merged = {
    ...current,
    woocommerceEnabled: remote.woocommerce_enabled || current.woocommerceEnabled,
  };

  merged.appearance = mergeAppearance(
    mergeAppearance(merged.appearance, remote.appearance || undefined),
    userOverrides.appearance
  );

  merged.behavior = mergeBehavior(
    mergeBehavior(merged.behavior, remote.behavior || undefined),
    userOverrides.behavior
  );

  merged.features = mergeFeatures(
    mergeFeatures(merged.features, remote.features || undefined),
    userOverrides.features
  );

  if (remote.domain) {
    merged.storeDomain = remote.domain;
  }

  if (remote.branding) {
    if (remote.branding.primary_color && !userOverrides.appearance?.primaryColor) {
      merged.appearance.primaryColor = remote.branding.primary_color || merged.appearance.primaryColor;
    }
    if (remote.branding.welcome_message && !userOverrides.behavior?.welcomeMessage) {
      merged.behavior.welcomeMessage = remote.branding.welcome_message || merged.behavior.welcomeMessage;
    }
  }

  return merged;
}
