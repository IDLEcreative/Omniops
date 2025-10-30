/**
 * Type definitions for the widget customization interface
 */

export interface SimplifiedWidgetConfig {
  // Essentials
  essentials: {
    primaryColor: string;
    logoUrl: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    botName: string;
    welcomeMessage: string;
    placeholderText: string;
    showAvatar: boolean;
    autoOpen: boolean;
    autoOpenDelay: number;
    soundNotifications: boolean;
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
    position: "bottom-right",
    botName: "Assistant",
    welcomeMessage: "Hi! How can I help you today?",
    placeholderText: "Type your message...",
    showAvatar: true,
    autoOpen: false,
    autoOpenDelay: 3000,
    soundNotifications: false,
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
