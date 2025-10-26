import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { searchSimilarContent } from '@/lib/embeddings';
import OpenAI from 'openai';
import { mockCommerceProvider, mockOpenAIClient } from '@/test-utils/api-test-helpers';

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
  createClient: jest.fn(),
  requireClient: jest.fn(),
  requireServiceRoleClient: jest.fn(),
  validateSupabaseEnv: jest.fn().mockReturnValue(true),
}));
jest.mock('@/lib/embeddings');
jest.mock('openai');
jest.mock('@/lib/rate-limit', () => ({
  checkDomainRateLimit: jest.fn(() => ({ allowed: true, remaining: 99, resetTime: Date.now() + 3600000 }))
}));
jest.mock('@/lib/agents/commerce-provider', () => ({
  getCommerceProvider: jest.fn(),
}));
jest.mock('@/lib/link-sanitizer', () => ({
  sanitizeOutboundLinks: jest.fn((message) => message),
}));
jest.mock('@/lib/search-wrapper', () => ({
  extractQueryKeywords: jest.fn((q) => [q]),
  isPriceQuery: jest.fn(() => false),
  extractPriceRange: jest.fn(() => null),
}));
jest.mock('@/lib/chat-telemetry', () => ({
  ChatTelemetry: jest.fn(),
  telemetryManager: {
    createSession: jest.fn(() => ({
      log: jest.fn(),
      trackIteration: jest.fn(),
      trackSearch: jest.fn(),
      complete: jest.fn(),
    })),
  },
}));
jest.mock('@/lib/monitoring/performance-tracker', () => ({
  trackAsync: jest.fn((fn) => fn()),
}));
jest.mock('@/lib/redis-fallback', () => ({
  getRedisClientWithFallback: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('Chat API Route - Streaming Performance', () => {
  let mockSupabase: ReturnType<typeof createServiceRoleClient>;
  let mockOpenAI: jest.Mocked<OpenAI>;
  let performanceMarkers: { [key: string]: number } = {};

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMarkers = {};

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn((table: string) => {
        const startTime = Date.now();

        if (table === 'conversations') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(async () => {
                  performanceMarkers['conversation_create'] = Date.now() - startTime;
                  await new Promise(resolve => setTimeout(resolve, 100));
                  return {
                    data: { id: 'conv-123', session_id: 'session-123', created_at: new Date().toISOString() },
                    error: null
                  };
                })
              }))
            })),
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'conv-123', session_id: 'session-123' },
                  error: null
                }))
              }))
            }))
          };
        }

        if (table === 'messages') {
          return {
            insert: jest.fn(() => {
              performanceMarkers['message_save_start'] = Date.now() - startTime;
              return Promise.resolve({
                data: null,
                error: null
              });
            }),
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(async () => {
                    performanceMarkers['history_fetch'] = Date.now() - startTime;
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return {
                      data: [
                        { role: 'user', content: 'Previous message' },
                        { role: 'assistant', content: 'Previous response' }
                      ],
                      error: null
                    };
                  })
                }))
              }))
            }))
          };
        }

        if (table === 'customer_configs') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(async () => {
                  performanceMarkers['woocommerce_check'] = Date.now() - startTime;
                  await new Promise(resolve => setTimeout(resolve, 75));
                  return {
                    data: { woocommerce_enabled: true },
                    error: null
                  };
                })
              }))
            }))
          };
        }

        if (table === 'domains') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'domain-123' },
                  error: null
                }))
              }))
            }))
          };
        }

        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        };
      }),
      rpc: jest.fn().mockResolvedValue({ data: [], error: null })
    } as any;

    const mockModule = jest.requireMock('@/lib/supabase-server');
    mockModule.createServiceRoleClient.mockResolvedValue(mockSupabase);
    mockModule.createClient.mockResolvedValue(mockSupabase);
    mockModule.requireClient.mockResolvedValue(mockSupabase);
    mockModule.requireServiceRoleClient.mockResolvedValue(mockSupabase);

    // Mock search similar content
    (searchSimilarContent as jest.Mock).mockImplementation(async () => {
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 80));
      performanceMarkers['embedding_search'] = Date.now() - startTime;
      return [
        {
          content: 'Relevant content 1',
          url: 'https://example.com/page1',
          title: 'Page 1',
          similarity: 0.9
        }
      ];
    });

    // Mock OpenAI
    mockOpenAI = mockOpenAIClient() as any;
    mockOpenAI.chat.completions.create = jest.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        choices: [{
          message: { content: 'AI response', role: 'assistant' }
        }]
      } as any;
    });

    (OpenAI as jest.Mock).mockImplementation(() => mockOpenAI);

    // Mock commerce provider
    const commerceModule = jest.requireMock('@/lib/agents/commerce-provider');
    const provider = mockCommerceProvider({
      platform: 'woocommerce',
      products: [
        {
          id: 1,
          name: 'Product 1',
          price: '99.99',
          sku: 'SKU-1',
          permalink: 'https://example.com/product-1'
        }
      ],
      searchProducts: jest.fn(async (_query: string, _limit: number) => {
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 60));
        performanceMarkers['woocommerce_search'] = Date.now() - startTime;
        return [
          {
            id: 1,
            name: 'Product 1',
            price: '99.99',
            sku: 'SKU-1',
            permalink: 'https://example.com/product-1'
          }
        ];
      }),
    });
    commerceModule.getCommerceProvider.mockResolvedValue(provider);
  });

  it('should execute independent operations in parallel', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Tell me about products',
        session_id: 'session-123',
        domain: 'example.com',
        config: {
          features: {
            websiteScraping: { enabled: true },
            woocommerce: { enabled: true }
          }
        }
      }),
    });

    const startTime = Date.now();
    const response = await POST(request);
    const totalTime = Date.now() - startTime;

    expect(response.status).toBe(200);

    // Verify parallel execution
    console.log('Performance Markers:', performanceMarkers);
    console.log('Total Time:', totalTime);

    // Check that operations started nearly simultaneously
    expect(performanceMarkers['message_save_start']).toBeLessThan(20);
    expect(performanceMarkers['history_fetch']).toBeLessThan(20);
    expect(performanceMarkers['embedding_search']).toBeLessThan(100);

    // Total time should be less than sequential execution
    expect(totalTime).toBeLessThan(350);

    // Verify all operations completed
    expect(searchSimilarContent).toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('messages');
    expect(mockSupabase.from).toHaveBeenCalledWith('customer_configs');
  });
});
