/**
 * DomainAgnosticAgent - Context Building Edge Cases
 * Tests large result sets, null contexts, empty queries
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';

const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Context Building Edge Cases', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(async () => {
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

    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    await agent.initializeForDomain('test-domain');
    jest.clearAllMocks();
  });

  it('should handle very large search result sets', () => {
    const largeResultSet = Array.from({ length: 100 }, (_, i) => ({
      name: `Product ${i}`,
      price: i * 10,
      is_available: i % 2 === 0,
      primary_identifier: `PROD-${i}`
    }));

    const context = agent.buildAdaptiveContext(
      'Customer',
      'Show all products',
      largeResultSet
    );

    expect(context).toContain('Found 100 products');
    expect(context).toContain('Product 0');
    expect(context).toContain('Product 99');
  });

  it('should handle null customer context gracefully', () => {
    const context = agent.buildAdaptiveContext(
      null as any,
      'Test query',
      []
    );

    expect(context).toContain('No customer data available');
  });

  it('should handle empty string query gracefully', () => {
    const context = agent.buildAdaptiveContext(
      'Customer',
      '',
      []
    );

    expect(context).toBeDefined();
    expect(context).toContain('User Query');
  });
});
