import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/middleware/auth';
import { checkAnalyticsRateLimit } from '@/lib/middleware/analytics-rate-limit';

jest.mock('@/lib/supabase-server');
jest.mock('@/lib/middleware/auth');
jest.mock('@/lib/middleware/analytics-rate-limit');

export interface AnalyticsExportTestContext {
  messages: any[];
  conversations: any[];
}

export interface ServiceRoleOverrides {
  messageResponse?: { data: any; error: any };
  conversationResponse?: { data: any; error: any };
}

export function createRealisticMessages(count: number = 100) {
  const queries = [
    'How do I track my order?',
    'What is your return policy?',
    'Do you offer international shipping?',
    'How can I reset my password?',
    'What payment methods do you accept?',
    'Is this product in stock?',
    'How long does shipping take?',
    'Can I change my delivery address?',
    'Do you have a size guide?',
    'How do I contact customer support?',
  ];

  const languages = ['en', 'es', 'fr', 'de', 'it'];
  const sentiments = ['positive', 'negative', 'neutral'];

  return Array.from({ length: count }).map((_, index) => {
    const isUserMessage = index % 2 === 0;
    const query = queries[Math.floor(Math.random() * queries.length)];
    const language = languages[Math.floor(Math.random() * languages.length)];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

    return {
      content: isUserMessage ? query : `Here's information about: ${query}`,
      role: isUserMessage ? 'user' : 'assistant',
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        confidence: Math.random(),
        language,
        sentiment,
        response_time_ms: Math.floor(Math.random() * 5000),
      },
      conversations: {
        domain: 'test.com',
      },
    };
  });
}

export function createRealisticConversations(count: number = 50) {
  const pages = [
    '/products/item-1',
    '/products/item-2',
    '/cart',
    '/checkout',
    '/account',
    '/help',
    '/contact',
    '/about',
    '/terms',
    '/privacy',
  ];

  return Array.from({ length: count }).map((_, index) => {
    const sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
    const pageViews = Math.floor(Math.random() * 10) + 1;

    return {
      session_id: sessionId,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        user_id: `user-${index}`,
        page_views: pageViews,
        pages_visited: pages.slice(0, Math.min(pageViews, pages.length)),
        session_duration_seconds: Math.floor(Math.random() * 600) + 30,
        is_new_user: Math.random() > 0.7,
        has_converted: Math.random() > 0.92,
        products_viewed: Math.floor(Math.random() * 5),
      },
    };
  });
}

export function createAnalyticsRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/analytics/export');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url);
}

export function setupAnalyticsTestContext(
  options: { messageCount?: number; conversationCount?: number } = {}
): AnalyticsExportTestContext {
  const context: AnalyticsExportTestContext = {
    messages: createRealisticMessages(options.messageCount ?? 200),
    conversations: createRealisticConversations(options.conversationCount ?? 100),
  };

  (requireAuth as jest.Mock).mockResolvedValue({
    user: { id: 'user-123', email: 'test@example.com' },
    supabase: buildAuthSupabaseMock(),
  });

  mockServiceRoleClient(buildServiceRoleClientMock(context));
  resetRateLimit();

  return context;
}

export function buildServiceRoleClientMock(
  context: AnalyticsExportTestContext,
  overrides: ServiceRoleOverrides = {}
) {
  return {
    from: jest.fn((table: string) => {
      if (table === 'messages') {
        return {
          select: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue(
            overrides.messageResponse ?? { data: context.messages, error: null }
          ),
        };
      }

      if (table === 'conversations') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue(
            overrides.conversationResponse ?? { data: context.conversations, error: null }
          ),
        };
      }

      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

export function mockServiceRoleClient(mockClient: unknown) {
  (createServiceRoleClient as jest.Mock).mockResolvedValue(mockClient);
}

export function mockRateLimitImplementation(
  implementation: () => NextResponse | null | Promise<NextResponse | null>
) {
  (checkAnalyticsRateLimit as jest.Mock).mockImplementation(implementation);
}

export function resetRateLimit() {
  (checkAnalyticsRateLimit as jest.Mock).mockResolvedValue(null);
}

function buildAuthSupabaseMock() {
  return {
    from: jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { organization_id: 'org-123', role: 'admin' },
            error: null,
          }),
        };
      }

      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { name: 'Acme Corporation' },
            error: null,
          }),
        };
      }

      if (table === 'customer_configs') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [{ domain: 'test.com' }, { domain: 'example.com' }],
            error: null,
          }),
        };
      }

      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}
