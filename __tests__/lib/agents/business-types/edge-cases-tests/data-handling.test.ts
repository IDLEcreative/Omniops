/**
 * DomainAgnosticAgent - Data Handling Edge Cases
 * Tests null values, missing fields, malformed data
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';

const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Data Handling Edge Cases', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  it('should handle null entity attributes gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              business_type: 'education',
              entity_terminology: {
                entityName: 'course',
                entityNamePlural: 'courses',
                availableText: 'available',
                unavailableText: 'unavailable',
                priceLabel: 'price',
                searchPrompt: 'Search'
              },
              confidence: 0.9
            }
          })
        })
      })
    });

    await agent.initializeForDomain('test-domain');

    const entities = [
      {
        name: 'Test Course',
        is_available: true,
        attributes: null
      }
    ];

    const result = agent.formatEntitiesForAI(entities);
    expect(result).toContain('Test Course');
    expect(result).toContain('available');
  });

  it('should handle missing price field', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              business_type: 'general',
              entity_terminology: {
                entityName: 'item',
                entityNamePlural: 'items',
                availableText: 'available',
                unavailableText: 'unavailable',
                priceLabel: 'price',
                searchPrompt: 'Search'
              },
              confidence: 0.5
            }
          })
        })
      })
    });

    await agent.initializeForDomain('test-domain');

    const entities = [
      {
        name: 'Free Service',
        is_available: true
      }
    ];

    const result = agent.formatEntitiesForAI(entities);
    expect(result).toContain('Free Service');
    expect(result).not.toContain('$');
  });

  it('should handle very low confidence scores', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              business_type: 'general',
              entity_terminology: {
                entityName: 'item',
                entityNamePlural: 'items',
                availableText: 'available',
                unavailableText: 'unavailable',
                priceLabel: 'price',
                searchPrompt: 'Search'
              },
              confidence: 0.3
            }
          })
        })
      })
    });

    await agent.initializeForDomain('test-domain');
    const prompt = agent.getAdaptiveSystemPrompt();

    expect(prompt).toContain('30% certain');
  });

  it('should handle database query errors gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      })
    });

    await expect(agent.initializeForDomain('test-domain')).rejects.toThrow('Database error');
  });

  it('should handle undefined business_type', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              business_type: undefined,
              entity_terminology: {
                entityName: 'item',
                entityNamePlural: 'items',
                availableText: 'available',
                unavailableText: 'unavailable',
                priceLabel: 'price',
                searchPrompt: 'Search'
              },
              confidence: 0.5
            }
          })
        })
      })
    });

    await agent.initializeForDomain('test-domain');
    const prompt = agent.getAdaptiveSystemPrompt();

    expect(prompt).toBeDefined();
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('should handle empty search results', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              business_type: 'ecommerce',
              entity_terminology: {
                entityName: 'product',
                entityNamePlural: 'products',
                availableText: 'in stock',
                unavailableText: 'out of stock',
                priceLabel: 'price',
                searchPrompt: 'Search'
              },
              confidence: 0.9
            }
          })
        })
      })
    });

    await agent.initializeForDomain('test-domain');
    const context = agent.buildAdaptiveContext('Customer', 'Show products', []);

    expect(context).toContain('No products found');
  });

  it('should handle malformed entity data', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              business_type: 'ecommerce',
              entity_terminology: {
                entityName: 'product',
                entityNamePlural: 'products',
                availableText: 'in stock',
                unavailableText: 'out of stock',
                priceLabel: 'price',
                searchPrompt: 'Search'
              },
              confidence: 0.9
            }
          })
        })
      })
    });

    await agent.initializeForDomain('test-domain');

    const malformedEntities = [
      {
        // Missing name
        is_available: true,
        price: 100
      },
      {
        name: 'Valid Product',
        is_available: true,
        price: 50
      }
    ];

    const result = agent.formatEntitiesForAI(malformedEntities);
    expect(result).toBeDefined();
    expect(result).toContain('Valid Product');
  });
});
