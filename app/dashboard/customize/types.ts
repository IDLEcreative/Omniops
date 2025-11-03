/**
 * Type definitions for the widget customization interface
 */

export interface SimplifiedWidgetConfig {
  // Essentials
  essentials: {
    primaryColor: string;
    logoUrl: string;
    minimizedIconUrl: string; // Custom icon for minimized widget button
    minimizedIconHoverUrl: string; // Custom icon for hover state
    minimizedIconActiveUrl: string; // Custom icon for active/clicked state
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    botName: string;
    welcomeMessage: string;
    placeholderText: string;
    showAvatar: boolean;
    autoOpen: boolean;
    autoOpenDelay: number;
    soundNotifications: boolean;
    animationType: 'none' | 'pulse' | 'bounce' | 'rotate' | 'fade' | 'wiggle';
    animationSpeed: 'slow' | 'normal' | 'fast';
    animationIntensity: 'subtle' | 'normal' | 'strong';
  };

  // Intelligence
  intelligence: {
    personality: 'professional' | 'friendly' | 'concise';
    language: string;
    responseStyle: 'short' | 'balanced' | 'detailed';
    enableSmartSuggestions: boolean;
    enableWebSearch: boolean;
  };

  // Connect
  connect: {
    enableWooCommerce: boolean;
    enableShopify: boolean;
    enableKnowledgeBase: boolean;
    enableProductCatalog: boolean;
    trackConversations: boolean;
    dataRetentionDays: number;
  };
}

export const defaultConfig: SimplifiedWidgetConfig = {
  essentials: {
    primaryColor: "#3b82f6",
    logoUrl: "",
    minimizedIconUrl: "", // Default to empty, will use MessageCircle icon if not set
    minimizedIconHoverUrl: "", // Default to empty, will fallback to normal state
    minimizedIconActiveUrl: "", // Default to empty, will fallback to normal state
    position: "bottom-right",
    botName: "Assistant",
    welcomeMessage: "Hi! How can I help you today?",
    placeholderText: "Type your message...",
    showAvatar: true,
    autoOpen: false,
    autoOpenDelay: 3000,
    soundNotifications: false,
    animationType: "pulse",
    animationSpeed: "normal",
    animationIntensity: "normal",
  },
  intelligence: {
    personality: "friendly",
    language: "auto",
    responseStyle: "balanced",
    enableSmartSuggestions: true,
    enableWebSearch: false,
  },
  connect: {
    enableWooCommerce: false,
    enableShopify: false,
    enableKnowledgeBase: true,
    enableProductCatalog: true,
    trackConversations: true,
    dataRetentionDays: 30,
  },
};
