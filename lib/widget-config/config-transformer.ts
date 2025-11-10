/**
 * Widget Configuration Transformer
 *
 * Transforms database configuration into widget-ready format.
 */

import type { CustomerConfig, WidgetConfig } from './config-loader';
import { getDefaultAppearance, getDefaultBehavior } from './defaults';

export interface TransformedAppearance {
  position: string;
  width: number;
  height: number;
  showPulseAnimation: boolean;
  showNotificationBadge: boolean;
  startMinimized: boolean;
  primaryColor: string;
  widgetBackgroundColor: string;
  widgetBorderColor: string;
  headerBackgroundColor: string;
  headerBorderColor: string;
  headerTextColor: string;
  headerSubtitle: string;
  messageAreaBackgroundColor: string;
  userMessageBackgroundColor: string;
  userMessageTextColor: string;
  botMessageTextColor: string;
  inputAreaBackgroundColor: string;
  inputAreaBorderColor: string;
  inputBackgroundColor: string;
  inputBorderColor: string;
  inputFocusBorderColor: string;
  inputTextColor: string;
  inputPlaceholderColor: string;
  buttonGradientStart: string;
  buttonGradientEnd: string;
  buttonTextColor: string;
  buttonHoverBackgroundColor: string;
  fontFamily: string;
  fontSize: string;
  borderRadius: string;
  backgroundColor: string;
  textColor: string;
  darkMode: boolean;
}

export interface TransformedBehavior {
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
  animationType: string;
  animationSpeed: string;
  animationIntensity: string;
}

export interface TransformedBranding {
  business_name: string | null;
  primary_color: string;
  welcome_message: string;
  suggested_questions: string[];
  minimizedIconUrl: string;
  minimizedIconHoverUrl: string;
  minimizedIconActiveUrl: string;
}

export interface TransformedConfig {
  app_id: string | null;
  domain: string;
  woocommerce_enabled: boolean;
  shopify_enabled: boolean;
  branding: TransformedBranding;
  appearance: TransformedAppearance;
  behavior: TransformedBehavior;
  features: {
    websiteScraping: { enabled: boolean };
    woocommerce: { enabled: boolean };
    shopify: { enabled: boolean };
  };
}

/**
 * Transform appearance settings from database config
 */
export function transformAppearance(
  customerConfig: CustomerConfig,
  widgetConfig: WidgetConfig | null
): TransformedAppearance {
  const defaults = getDefaultAppearance();
  const primaryColor = widgetConfig?.theme_settings?.primaryColor || customerConfig.primary_color || '#3b82f6';

  return {
    // Position & Size
    position: widgetConfig?.position_settings?.position || defaults.position,
    width: widgetConfig?.position_settings?.width || defaults.width,
    height: widgetConfig?.position_settings?.height || defaults.height,
    showPulseAnimation: widgetConfig?.behavior_settings?.showAvatar ?? true,
    showNotificationBadge: true,
    startMinimized: !widgetConfig?.behavior_settings?.autoOpen,

    // Primary Branding Color
    primaryColor,

    // Widget Container Colors
    widgetBackgroundColor: widgetConfig?.theme_settings?.widgetBackgroundColor || defaults.widgetBackgroundColor,
    widgetBorderColor: widgetConfig?.theme_settings?.widgetBorderColor || defaults.widgetBorderColor,

    // Header Colors
    headerBackgroundColor: widgetConfig?.theme_settings?.headerBackgroundColor || primaryColor,
    headerBorderColor: widgetConfig?.theme_settings?.headerBorderColor || defaults.headerBorderColor,
    headerTextColor: widgetConfig?.theme_settings?.headerTextColor || defaults.headerTextColor,
    headerSubtitle: customerConfig.welcome_message || 'Online - We typically reply instantly',

    // Message Area Colors
    messageAreaBackgroundColor: widgetConfig?.theme_settings?.messageAreaBackgroundColor || defaults.messageAreaBackgroundColor,
    userMessageBackgroundColor: widgetConfig?.theme_settings?.userMessageBackgroundColor || defaults.userMessageBackgroundColor,
    userMessageTextColor: widgetConfig?.theme_settings?.userMessageTextColor || defaults.userMessageTextColor,
    botMessageTextColor: widgetConfig?.theme_settings?.botMessageTextColor || defaults.botMessageTextColor,

    // Input Area Colors
    inputAreaBackgroundColor: widgetConfig?.theme_settings?.inputAreaBackgroundColor || defaults.inputAreaBackgroundColor,
    inputAreaBorderColor: widgetConfig?.theme_settings?.inputAreaBorderColor || defaults.inputAreaBorderColor,
    inputBackgroundColor: widgetConfig?.theme_settings?.inputBackgroundColor || defaults.inputBackgroundColor,
    inputBorderColor: widgetConfig?.theme_settings?.inputBorderColor || defaults.inputBorderColor,
    inputFocusBorderColor: widgetConfig?.theme_settings?.inputFocusBorderColor || primaryColor,
    inputTextColor: widgetConfig?.theme_settings?.inputTextColor || defaults.inputTextColor,
    inputPlaceholderColor: widgetConfig?.theme_settings?.inputPlaceholderColor || defaults.inputPlaceholderColor,

    // Button Colors
    buttonGradientStart: widgetConfig?.theme_settings?.buttonGradientStart || primaryColor,
    buttonGradientEnd: widgetConfig?.theme_settings?.buttonGradientEnd || primaryColor,
    buttonTextColor: widgetConfig?.theme_settings?.buttonTextColor || defaults.buttonTextColor,
    buttonHoverBackgroundColor: widgetConfig?.theme_settings?.buttonHoverBackgroundColor || primaryColor,

    // Typography
    fontFamily: widgetConfig?.theme_settings?.fontFamily || defaults.fontFamily,
    fontSize: widgetConfig?.theme_settings?.fontSize || defaults.fontSize,
    borderRadius: widgetConfig?.theme_settings?.borderRadius || defaults.borderRadius,

    // Legacy/Compatibility
    backgroundColor: widgetConfig?.theme_settings?.backgroundColor || '#ffffff',
    textColor: widgetConfig?.theme_settings?.textColor || '#1f2937',
    darkMode: widgetConfig?.theme_settings?.darkMode || false,
  };
}

/**
 * Transform behavior settings from database config
 */
export function transformBehavior(
  customerConfig: CustomerConfig,
  widgetConfig: WidgetConfig | null
): TransformedBehavior {
  const defaults = getDefaultBehavior();

  return {
    welcomeMessage: widgetConfig?.behavior_settings?.welcomeMessage || customerConfig.welcome_message || defaults.welcomeMessage,
    placeholderText: widgetConfig?.behavior_settings?.placeholderText || defaults.placeholderText,
    botName: widgetConfig?.behavior_settings?.botName || defaults.botName,
    avatarUrl: widgetConfig?.behavior_settings?.avatarUrl || '',
    showAvatar: widgetConfig?.behavior_settings?.showAvatar ?? true,
    showTypingIndicator: widgetConfig?.behavior_settings?.showTypingIndicator ?? true,
    autoOpen: widgetConfig?.behavior_settings?.autoOpen || false,
    openDelay: widgetConfig?.behavior_settings?.openDelay || 3000,
    minimizable: widgetConfig?.behavior_settings?.minimizable ?? true,
    soundNotifications: widgetConfig?.behavior_settings?.soundNotifications || false,
    persistConversation: widgetConfig?.behavior_settings?.persistConversation ?? true,
    messageDelay: widgetConfig?.behavior_settings?.messageDelay || 500,
    animationType: widgetConfig?.behavior_settings?.animationType || 'pulse',
    animationSpeed: widgetConfig?.behavior_settings?.animationSpeed || 'normal',
    animationIntensity: widgetConfig?.behavior_settings?.animationIntensity || 'normal',
  };
}

/**
 * Transform branding settings from database config
 */
export function transformBranding(
  customerConfig: CustomerConfig,
  widgetConfig: WidgetConfig | null,
  primaryColor: string
): TransformedBranding {
  const defaults = getDefaultBehavior();

  return {
    business_name: customerConfig.business_name,
    primary_color: primaryColor,
    welcome_message: widgetConfig?.behavior_settings?.welcomeMessage || customerConfig.welcome_message || defaults.welcomeMessage,
    suggested_questions: customerConfig.suggested_questions || [],
    minimizedIconUrl: widgetConfig?.branding_settings?.minimizedIconUrl || '',
    minimizedIconHoverUrl: widgetConfig?.branding_settings?.minimizedIconHoverUrl || '',
    minimizedIconActiveUrl: widgetConfig?.branding_settings?.minimizedIconActiveUrl || '',
  };
}

/**
 * Transform complete configuration
 */
export function transformConfig(
  customerConfig: CustomerConfig,
  widgetConfig: WidgetConfig | null
): TransformedConfig {
  const appearance = transformAppearance(customerConfig, widgetConfig);
  const behavior = transformBehavior(customerConfig, widgetConfig);
  const branding = transformBranding(customerConfig, widgetConfig, appearance.primaryColor);

  return {
    app_id: customerConfig.app_id,
    domain: customerConfig.domain,
    woocommerce_enabled: !!customerConfig.woocommerce_url,
    shopify_enabled: !!customerConfig.shopify_shop,
    branding,
    appearance,
    behavior,
    features: {
      websiteScraping: { enabled: true },
      woocommerce: { enabled: !!customerConfig.woocommerce_url },
      shopify: { enabled: !!customerConfig.shopify_shop },
    },
  };
}
