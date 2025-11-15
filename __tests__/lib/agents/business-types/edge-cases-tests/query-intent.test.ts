/**
 * DomainAgnosticAgent - Query Intent Detection Edge Cases
 * Tests multiple intents, empty queries, special characters
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';

const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Query Intent Detection Edge Cases', () => {
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

  it('should handle queries with multiple intents', () => {
    const query = 'What do you have available and how much does it cost?';
    const result = agent.getAdaptiveActionPrompt(query);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle empty query string', () => {
    const result = agent.getAdaptiveActionPrompt('');
    expect(result).toContain('Help the customer');
  });

  it('should handle very long query strings', () => {
    const longQuery = 'I am looking for ' + 'something '.repeat(100) + 'that is available';
    const result = agent.getAdaptiveActionPrompt(longQuery);

    expect(result).toBeDefined();
    expect(result).toContain('in stock');
  });

  it('should handle special characters in queries', () => {
    const query = 'Do you have @special #products with $symbols?';
    const result = agent.getAdaptiveActionPrompt(query);

    expect(result).toBeDefined();
  });

  it('should handle non-English characters', () => {
    const query = '你有什么产品？'; // Chinese: What products do you have?
    const result = agent.getAdaptiveActionPrompt(query);

    expect(result).toBeDefined();
  });
});
