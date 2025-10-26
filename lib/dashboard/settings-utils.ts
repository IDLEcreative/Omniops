// Utility functions for settings management

export interface SettingsState {
  // General Settings
  companyName: string;
  companyDescription: string;
  timeZone: string;
  language: string;
  currency: string;

  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;

  // Bot Settings
  botName: string;
  botGreeting: string;
  responseTimeout: string;
  escalationEnabled: boolean;
  operatingHours: string;

  // Security
  twoFactorAuth: boolean;
  sessionTimeout: string;
  ipWhitelist: string;

  // Integrations
  openaiApiKey: string;
  supabaseUrl: string;
  redisUrl: string;
  woocommerceUrl: string;
  woocommerceConsumerKey: string;
  woocommerceConsumerSecret: string;

  // Advanced
  debugMode: boolean;
  logLevel: string;
  maxConcurrentChats: string;
  rateLimitPerMinute: string;
}

export const DEFAULT_SETTINGS: SettingsState = {
  // General Settings
  companyName: "Omniops Customer Service",
  companyDescription: "AI-powered customer service chat widget",
  timeZone: "America/New_York",
  language: "en",
  currency: "USD",

  // Notifications
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  weeklyReports: true,

  // Bot Settings
  botName: "Customer Assistant",
  botGreeting: "Hi! How can I help you today?",
  responseTimeout: "30",
  escalationEnabled: true,
  operatingHours: "24/7",

  // Security
  twoFactorAuth: true,
  sessionTimeout: "8",
  ipWhitelist: "",

  // Integrations
  openaiApiKey: "sk-..." + "*".repeat(20),
  supabaseUrl: "https://your-project.supabase.co",
  redisUrl: "redis://localhost:6379",
  woocommerceUrl: "",
  woocommerceConsumerKey: "",
  woocommerceConsumerSecret: "",

  // Advanced
  debugMode: false,
  logLevel: "info",
  maxConcurrentChats: "100",
  rateLimitPerMinute: "60",
};

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export interface ConfigData {
  domain: string;
  owned_domains: string[];
  woocommerce: {
    enabled: boolean;
    url: string;
    consumer_key: string;
    consumer_secret: string;
  };
  shopify: {
    enabled: boolean;
    domain: string;
    access_token: string;
  };
}

export async function saveSettingsToAPI(settings: SettingsState): Promise<void> {
  const configData: ConfigData = {
    domain: typeof window !== 'undefined' ? window.location.hostname : '',
    owned_domains: [],
    woocommerce: {
      enabled: !!(settings.woocommerceUrl && settings.woocommerceConsumerKey && settings.woocommerceConsumerSecret),
      url: settings.woocommerceUrl,
      consumer_key: settings.woocommerceConsumerKey,
      consumer_secret: settings.woocommerceConsumerSecret,
    },
    shopify: {
      enabled: false,
      domain: '',
      access_token: '',
    },
  };

  const response = await fetch('/api/dashboard/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(configData),
  });

  if (!response.ok) {
    throw new Error('Failed to save settings');
  }
}

export async function loadSettingsFromAPI(): Promise<Partial<SettingsState>> {
  const response = await fetch('/api/dashboard/config');
  if (!response.ok) {
    throw new Error('Failed to load settings');
  }

  const data = await response.json();
  if (data.config && data.config.woocommerce) {
    return {
      woocommerceUrl: data.config.woocommerce.url || '',
      woocommerceConsumerKey: data.config.woocommerce.consumer_key || '',
      woocommerceConsumerSecret: data.config.woocommerce.consumer_secret || '',
    };
  }

  return {};
}
