export interface WidgetAppearance {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width: number;
  height: number;
  showPulseAnimation: boolean;
  showNotificationBadge: boolean;
  startMinimized: boolean;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontSize?: string;
  fontFamily?: string;
  darkMode?: boolean;
}

export interface WidgetBehavior {
  welcomeMessage: string;
  placeholderText: string;
  botName: string;
  avatarUrl: string;
  showAvatar: boolean;
  showTypingIndicator: boolean;
  autoOpen: boolean;
  openDelay: number;
  minimizable: boolean;
  soundNotifications: boolean;
  persistConversation: boolean;
  messageDelay: number;
}

export interface WidgetFeatures {
  websiteScraping?: { enabled: boolean };
  woocommerce?: { enabled: boolean };
  shopify?: { enabled: boolean };
  [key: string]: unknown;
}

export interface WidgetBranding {
  business_name?: string | null;
  primary_color?: string | null;
  welcome_message?: string | null;
  suggested_questions?: string[] | null;
}

export interface RemoteWidgetConfig {
  domain: string;
  woocommerce_enabled: boolean;
  shopify_enabled: boolean;
  branding?: WidgetBranding | null;
  appearance?: Partial<WidgetAppearance> | null;
  behavior?: Partial<WidgetBehavior> | null;
  features?: WidgetFeatures | null;
}

export interface PrivacyOptions {
  allowOptOut: boolean;
  showPrivacyNotice: boolean;
  requireConsent: boolean;
  retentionDays: number;
}

export interface PrivacyPreferences {
  optedOut: boolean;
  consentGiven: boolean;
}

export interface WidgetConfig {
  serverUrl: string;
  appearance: WidgetAppearance;
  features: WidgetFeatures;
  behavior: WidgetBehavior;
  privacy: PrivacyOptions;
  userData: unknown;
  pageContext: unknown;
  cartData: unknown;
  orderContext: unknown;
  woocommerceEnabled: boolean;
  domain?: string | null; // New standard property name (preferred)
  storeDomain: string | null; // Legacy property name (still supported for backwards compatibility)
  debug: boolean;
  skipRemoteConfig?: boolean;
}

export interface FetchFallbackOptions<T> {
  timeoutMs?: number;
  retryDelaysMs?: number[];
  parser?: (response: Response) => Promise<T>;
  init?: RequestInit;
}

