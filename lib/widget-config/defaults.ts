/**
 * Default Widget Configuration Values
 *
 * Provides default appearance and behavior settings for widgets
 * when no custom configuration is available.
 */

export interface DefaultAppearance {
  position: string;
  width: number;
  height: number;
  showPulseAnimation: boolean;
  showNotificationBadge: boolean;
  startMinimized: boolean;
  widgetBackgroundColor: string;
  widgetBorderColor: string;
  headerBackgroundColor: string;
  headerBorderColor: string;
  headerTextColor: string;
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
}

export interface DefaultBehavior {
  welcomeMessage: string;
  placeholderText: string;
  botName: string;
}

/**
 * Get default appearance configuration
 */
export function getDefaultAppearance(): DefaultAppearance {
  return {
    position: 'bottom-right',
    width: 400,
    height: 600,
    showPulseAnimation: true,
    showNotificationBadge: true,
    startMinimized: true,
    // Default colors matching current widget
    widgetBackgroundColor: '#111111',
    widgetBorderColor: '#2a2a2a',
    headerBackgroundColor: '#111111',
    headerBorderColor: '#2a2a2a',
    headerTextColor: '#ffffff',
    messageAreaBackgroundColor: '#111111',
    userMessageBackgroundColor: '#3f3f46',
    userMessageTextColor: '#ffffff',
    botMessageTextColor: '#ffffff',
    inputAreaBackgroundColor: '#111111',
    inputAreaBorderColor: '#2a2a2a',
    inputBackgroundColor: '#2a2a2a',
    inputBorderColor: '#3a3a3a',
    inputFocusBorderColor: '#4a4a4a',
    inputTextColor: '#ffffff',
    inputPlaceholderColor: '#9ca3af',
    buttonGradientStart: '#3a3a3a',
    buttonGradientEnd: '#2a2a2a',
    buttonTextColor: '#ffffff',
    buttonHoverBackgroundColor: '#1a1a1a',
    fontFamily: 'system-ui',
    fontSize: '14',
    borderRadius: '8',
  };
}

/**
 * Get default behavior configuration
 */
export function getDefaultBehavior(): DefaultBehavior {
  return {
    welcomeMessage: 'Hi! How can I help you today?',
    placeholderText: 'Type your message...',
    botName: 'Assistant',
  };
}
