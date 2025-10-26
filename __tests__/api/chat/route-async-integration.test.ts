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

describe('Chat API Route - Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createServiceRoleClient>;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'conv-123', session_id: 'session-123', created_at: new Date().toISOString() },
                  error: null
                }))
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
            insert: jest.fn(() => Promise.resolve({
              data: null,
              error: null
            })),
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({
                    data: [],
                    error: null
                  }))
                }))
              }))
            }))
          };
        }

        if (table === 'customer_configs') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { woocommerce_enabled: true },
                  error: null
                }))
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
    (searchSimilarContent as jest.Mock).mockResolvedValue([
      {
        content: 'Relevant content',
        url: 'https://example.com/page',
        title: 'Page',
        similarity: 0.9
      }
    ]);

    // Mock OpenAI
    mockOpenAI = mockOpenAIClient() as any;
    mockOpenAI.chat.completions.create = jest.fn(async () => ({
      choices: [{
        message: { content: 'AI response', role: 'assistant' }
      }]
    } as any));

    (OpenAI as jest.Mock).mockImplementation(() => mockOpenAI);

    // Mock commerce provider
    const commerceModule = jest.requireMock('@/lib/agents/commerce-provider');
    const provider = mockCommerceProvider({
      platform: 'woocommerce',
      products: []
    });
    commerceModule.getCommerceProvider.mockResolvedValue(provider);
  });

  it('should validate conversation and message saving happen in correct order', async () => {
    const operationOrder: string[] = [];

    // Track operation order
    mockSupabase.from = jest.fn((table: string) => {
      if (table === 'conversations') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(async () => {
                operationOrder.push('conversation_created');
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
            operationOrder.push('message_save_started');
            return Promise.resolve({
              data: null,
              error: null
            });
          }),
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(async () => {
                  operationOrder.push('history_fetched');
                  return {
                    data: [],
                    error: null
                  };
                })
              }))
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
    }) as any;

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        session_id: 'session-123'
      }),
    });

    await POST(request);

    // Verify conversation is created before message saving
    const convIndex = operationOrder.indexOf('conversation_created');
    const msgIndex = operationOrder.indexOf('message_save_started');

    expect(convIndex).toBeGreaterThanOrEqual(0);
    expect(msgIndex).toBeGreaterThanOrEqual(0);
    expect(convIndex).toBeLessThan(msgIndex);
  });
});
