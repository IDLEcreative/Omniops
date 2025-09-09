// Application constants

export const APP_NAME = 'Omniops Customer Service Agent';
export const APP_VERSION = '1.0.0';

// Rate limiting
export const RATE_LIMITS = {
  default: { requests: 100, window: 60 * 1000 }, // 100 per minute
  premium: { requests: 500, window: 60 * 1000 }, // 500 per minute
} as const;

// Chat settings
export const CHAT_SETTINGS = {
  maxMessageLength: 1000,
  maxConversationHistory: 10,
  aiModel: 'gpt-5-mini',  // Using GPT-5-mini model
  embeddingModel: 'text-embedding-3-small',
  temperature: 1,  // Using default temperature for compatibility
  maxTokens: 500,
} as const;

// Scraping settings
export const SCRAPING_SETTINGS = {
  maxPages: 100,
  chunkSize: 1000,
  batchSize: 20,
  excludePaths: ['/wp-admin', '/admin', '/login', '/cart', '/checkout'],
  crawlTimeout: 300000, // 5 minutes
} as const;

// Embedding settings
export const EMBEDDING_SETTINGS = {
  dimensions: 1536,
  similarityThreshold: 0.7,
  maxResults: 5,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  positions: ['bottom-right', 'bottom-left'] as const,
  defaultColor: '#0070f3',
  animationDuration: 200,
} as const;

// API Routes
export const API_ROUTES = {
  chat: '/api/chat',
  scrape: '/api/scrape',
  config: '/api/dashboard/config',
  testConnection: '/api/dashboard/test-connection',
  products: '/api/woocommerce/products',
  orders: '/api/woocommerce/orders',
  support: '/api/support',
  health: '/api/health',
  version: '/api/version',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  rateLimitExceeded: 'Rate limit exceeded. Please try again later.',
  invalidRequest: 'Invalid request data',
  internalError: 'Internal server error',
  unauthorized: 'Unauthorized access',
  notFound: 'Resource not found',
  databaseError: 'Database operation failed',
  externalApiError: 'External API request failed',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  configUpdated: 'Configuration updated successfully',
  pageScraped: 'Page scraped successfully',
  crawlStarted: 'Website crawl started',
  ticketCreated: 'Support ticket created successfully',
  dataExported: 'Data exported successfully',
  dataDeleted: 'Data deleted successfully',
} as const;

// Regex Patterns
export const PATTERNS = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  hexColor: /^#[0-9A-F]{6}$/i,
} as const;