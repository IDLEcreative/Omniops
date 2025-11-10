/**
 * Domain-Agnostic Agent - Edge Cases and Error Handling
 * Tests for error handling, malformed data, and edge cases
 *
 * @purpose Validates robust handling of null values, missing data, database errors,
 *          empty results, malformed entities, and various query edge cases
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Edge Cases and Error Handling', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('Data Handling Edge Cases', () => {
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

  describe('Query Intent Detection Edge Cases', () => {
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

      await agent.initializeForDomain('test-domain');
    });

    it('should handle queries with multiple intents', () => {
      const query = 'What do you have available and how much does it cost?';
      const result = agent.getAdaptiveActionPrompt(query);

      // Should detect availability intent (first match)
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

  describe('Context Building Edge Cases', () => {
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

      await agent.initializeForDomain('test-domain');
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
});
