import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { searchSimilarContent } from '@/lib/embeddings';
import OpenAI from 'openai';

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));
jest.mock('@/lib/embeddings');
jest.mock('openai');
jest.mock('@/lib/rate-limit', () => ({
  checkDomainRateLimit: jest.fn(() => ({ allowed: true, resetTime: Date.now() + 3600000 }))
}));

describe('Chat API Route - Async Performance', () => {
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
                  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB delay
                  return {
                    data: { id: 'conv-123', session_id: 'session-123' },
                    error: null
                  };
                })
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
                    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
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
                  await new Promise(resolve => setTimeout(resolve, 75)); // Simulate DB delay
                  return {
                    data: { woocommerce_enabled: true },
                    error: null
                  };
                })
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
      rpc: jest.fn()
    };

    (createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock search similar content
    (searchSimilarContent as jest.Mock).mockImplementation(async () => {
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 80)); // Simulate embedding search delay
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
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 200)); // Simulate AI delay
            return {
              choices: [{
                message: { content: 'AI response' }
              }]
            };
          })
        }
      },
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      }
    };

    (OpenAI as jest.Mock).mockImplementation(() => mockOpenAI);

    // Mock WooCommerce dynamic import
    jest.doMock('@/lib/woocommerce-dynamic', () => ({
      searchProductsDynamic: jest.fn(async () => {
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 60)); // Simulate API delay
        performanceMarkers['woocommerce_search'] = Date.now() - startTime;
        return [
          { 
            name: 'Product 1', 
            price: '99.99', 
            stock_status: 'instock' 
          }
        ];
      })
    }));
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
    // If operations were sequential, total time would be sum of all delays (100 + 50 + 80 + 75 + 60 = 365ms)
    // With parallel execution, it should be roughly the max delay (200ms for AI) plus overhead
    
    console.log('Performance Markers:', performanceMarkers);
    console.log('Total Time:', totalTime);
    
    // Check that operations started nearly simultaneously
    expect(performanceMarkers['message_save_start']).toBeLessThan(20); // Started quickly
    expect(performanceMarkers['history_fetch']).toBeLessThan(20); // Started quickly
    expect(performanceMarkers['embedding_search']).toBeLessThan(100); // Started after minimal delay
    
    // Total time should be significantly less than sequential execution
    expect(totalTime).toBeLessThan(350); // Should complete faster than sequential (365ms)
    
    // Verify all operations completed
    expect(searchSimilarContent).toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('messages');
    expect(mockSupabase.from).toHaveBeenCalledWith('customer_configs');
  });

  it('should handle partial failures gracefully with Promise.allSettled', async () => {
    // Make embedding search fail
    (searchSimilarContent as jest.Mock).mockRejectedValue(new Error('Embedding search failed'));

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

    const response = await POST(request);
    const data = await response.json();

    // Should still return successful response despite embedding search failure
    expect(response.status).toBe(200);
    expect(data.message).toBeDefined();
    expect(data.conversation_id).toBeDefined();
    
    // Other operations should have completed successfully
    expect(mockSupabase.from).toHaveBeenCalledWith('messages');
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
                  data: { id: 'conv-123', session_id: 'session-123' },
                  error: null
                };
              })
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

      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      };
    });

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