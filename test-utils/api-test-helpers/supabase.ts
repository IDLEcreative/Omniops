export interface MockSupabaseOptions {
  user?: any;
  authError?: Error | null;
  tables?: Record<string, any>;
}

export interface MockChatSupabaseOptions {
  conversationId?: string;
  sessionId?: string;
  domainId?: string;
  messages?: Array<{ role: string; content: string }>;
  hasWooCommerce?: boolean;
  hasShopify?: boolean;
}

/**
 * Create a mock Supabase client with standard structure
 */
export function mockSupabaseClient(options: MockSupabaseOptions = {}) {
  const {
    user = { id: 'test-user-123', email: 'test@example.com' },
    authError = null,
    tables = {},
  } = options;

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: authError ? null : user },
        error: authError,
      }),
    },
    from: jest.fn((table: string) => {
      if (tables[table]) {
        return tables[table];
      }

      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

/**
 * Create enhanced mock Supabase client for chat routes
 * Includes support for conversations, messages, domains, and customer_configs tables
 */
export function mockChatSupabaseClient(options: MockChatSupabaseOptions = {}) {
  const {
    conversationId = 'conv-123',
    sessionId = 'session-123',
    domainId = 'domain-123',
    messages = [],
    hasWooCommerce = false,
    hasShopify = false,
  } = options;

  const tables = {
    conversations: {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: conversationId, session_id: sessionId, created_at: new Date().toISOString() },
            error: null,
          }),
        }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: conversationId, session_id: sessionId },
            error: null,
          }),
        }),
      }),
    },
    messages: {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'msg-123' },
            error: null,
          }),
        }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: messages,
              error: null,
            }),
          }),
        }),
      }),
    },
    domains: {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: domainId ? { id: domainId } : null,
            error: null,
          }),
        }),
      }),
    },
    customer_configs: {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              woocommerce_enabled: hasWooCommerce,
              woocommerce_url: hasWooCommerce ? 'https://example.com' : null,
              shopify_enabled: hasShopify,
              shopify_shop: hasShopify ? 'example.myshopify.com' : null,
            },
            error: null,
          }),
        }),
      }),
    },
  };

  const client = mockSupabaseClient({ tables });
  (client as any).rpc = jest.fn().mockResolvedValue({ data: [], error: null });
  return client;
}
