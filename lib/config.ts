import { z } from 'zod';

// Widget configuration schema
export const WidgetConfigSchema = z.object({
  // Appearance
  appearance: z.object({
    primaryColor: z.string().default('#0070f3'),
    position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).default('bottom-right'),
    width: z.number().default(400),
    height: z.number().default(600),
    headerTitle: z.string().default('Customer Support'),
    headerSubtitle: z.string().default("We're here to help!"),
    welcomeMessage: z.string().default('👋 Hi! How can I help you today?'),
    placeholder: z.string().default('Type your message...'),
  }),

  // Features
  features: z.object({
    // E-commerce integrations
    woocommerce: z.object({
      enabled: z.boolean().default(false),
      features: z.object({
        productSearch: z.boolean().default(true),
        orderLookup: z.boolean().default(true),
        inventoryCheck: z.boolean().default(true),
      }),
    }),
    shopify: z.object({
      enabled: z.boolean().default(false),
      storeDomain: z.string().optional(),
      accessToken: z.string().optional(),
    }),
    
    // Content sources
    websiteScraping: z.object({
      enabled: z.boolean().default(true),
      urls: z.array(z.string()).default([]),
      crawlDepth: z.number().default(3),
      maxPages: z.number().default(-1), // Default to unlimited for production
      tier: z.enum(['starter', 'professional', 'enterprise']).default('professional'),
      tierLimits: z.object({
        starter: z.number().default(100),      // 100 pages for starter
        professional: z.number().default(1000), // 1000 pages for professional
        enterprise: z.number().default(-1),     // Unlimited for enterprise
      }).default({}),
    }),
    
    // Custom knowledge base
    customKnowledge: z.object({
      enabled: z.boolean().default(false),
      faqs: z.array(z.object({
        question: z.string(),
        answer: z.string(),
        category: z.string().optional(),
      })).default([]),
    }),

    // External APIs
    customApis: z.array(z.object({
      name: z.string(),
      endpoint: z.string(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
      headers: z.record(z.string()).optional(),
      description: z.string(), // For AI to understand when to use it
    })).default([]),
  }),

  // AI Configuration
  ai: z.object({
    provider: z.enum(['openai', 'anthropic', 'custom']).default('openai'),
    model: z.string().default('gpt-4o-mini'),
    temperature: z.number().min(0).max(2).default(0.7),
    systemPrompt: z.string().optional(),
    maxTokens: z.number().default(500),
    trustAIPresentation: z.boolean().default(true), // Trust AI to decide what to present
    postProcessing: z.object({
      enabled: z.boolean().default(false), // Disable manipulation by default
      forceProducts: z.boolean().default(false), // Don't force product injection
    }),
  }),

  // Behavior
  behavior: z.object({
    autoOpen: z.boolean().default(false),
    autoOpenDelay: z.number().default(5000), // ms
    persistConversation: z.boolean().default(true),
    requireEmail: z.boolean().default(false),
    allowFileUploads: z.boolean().default(false),
    typingIndicators: z.boolean().default(true),
  }),

  // Analytics
  analytics: z.object({
    enabled: z.boolean().default(true),
    trackEvents: z.boolean().default(true),
    googleAnalyticsId: z.string().optional(),
  }),
});

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

// Default configurations for different use cases
export const defaultConfigs = {
  ecommerce: {
    appearance: {
      headerTitle: 'Shopping Assistant',
      welcomeMessage: '🛍️ Hi! I can help you find products, track orders, or answer any questions.',
    },
    features: {
      woocommerce: { enabled: true, features: { productSearch: true, orderLookup: true, inventoryCheck: true } },
      websiteScraping: { enabled: true, urls: [], crawlDepth: 3, maxPages: 50 },
    },
  },
  
  support: {
    appearance: {
      headerTitle: 'Support Center',
      welcomeMessage: '💬 Hello! How can I assist you today?',
    },
    features: {
      websiteScraping: { enabled: true, urls: [], crawlDepth: 3, maxPages: 50 },
      customKnowledge: { enabled: true, faqs: [] },
    },
  },
  
  general: {
    appearance: {
      headerTitle: 'Chat Assistant',
      welcomeMessage: '👋 Hi there! Feel free to ask me anything.',
    },
    features: {
      websiteScraping: { enabled: true, urls: [], crawlDepth: 3, maxPages: 50 },
    },
  },
} as const;

// Function to merge user config with defaults
export function createWidgetConfig(
  userConfig: Partial<WidgetConfig> = {},
  template: keyof typeof defaultConfigs = 'general'
): WidgetConfig {
  const templateConfig = defaultConfigs[template];
  const mergedConfig = {
    ...templateConfig,
    ...userConfig,
    appearance: {
      ...templateConfig.appearance,
      ...userConfig.appearance,
    },
    features: {
      ...templateConfig.features,
      ...userConfig.features,
    },
    ai: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 500,
      ...userConfig.ai,
    },
    behavior: {
      autoOpen: false,
      autoOpenDelay: 5000,
      persistConversation: true,
      requireEmail: false,
      allowFileUploads: false,
      typingIndicators: true,
      ...userConfig.behavior,
    },
    analytics: {
      enabled: true,
      trackEvents: true,
      ...userConfig.analytics,
    },
  };

  return WidgetConfigSchema.parse(mergedConfig);
}