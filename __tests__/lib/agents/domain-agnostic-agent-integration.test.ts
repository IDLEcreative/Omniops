/**
 * Domain-Agnostic Agent - Integration Tests
 * Tests for entity formatting and context building
 */

import { DomainAgnosticAgent, BusinessContext } from '@/lib/agents/domain-agnostic-agent';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Integration', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('formatEntitiesForAI', () => {
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

    it('should handle empty entity list', () => {
      const result = agent.formatEntitiesForAI([]);

      expect(result).toContain('No products found');
    });

    it('should format real estate entities correctly', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'real_estate',
                entity_terminology: {
                  entityName: 'property',
                  entityNamePlural: 'properties',
                  availableText: 'available',
                  unavailableText: 'sold',
                  priceLabel: 'asking price',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('realestate-domain');

      const entities = [
        {
          name: '123 Main St',
          price: 450000,
          is_available: true,
          attributes: {
            bedrooms: 3,
            bathrooms: 2,
            square_feet: 1800,
            address: '123 Main St, City, ST 12345'
          },
          description: 'Beautiful home with modern updates'
        }
      ];

      const result = agent.formatEntitiesForAI(entities);

      expect(result).toContain('123 Main St');
      expect(result).toContain('3 bedrooms');
      expect(result).toContain('2 bathrooms');
      expect(result).toContain('1800 sq ft');
      expect(result).toContain('$450,000');
      expect(result).toContain('available');
    });

    it('should format healthcare entities correctly', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'healthcare',
                entity_terminology: {
                  entityName: 'service',
                  entityNamePlural: 'services',
                  availableText: 'available',
                  unavailableText: 'unavailable',
                  priceLabel: 'cost',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('healthcare-domain');

      const entities = [
        {
          name: 'Annual Physical',
          is_available: true,
          attributes: {
            provider_name: 'Dr. Smith',
            specialty: 'Family Medicine',
            insurance_accepted: ['Blue Cross', 'Aetna']
          },
          description: 'Comprehensive annual checkup'
        }
      ];

      const result = agent.formatEntitiesForAI(entities);

      expect(result).toContain('Annual Physical');
      expect(result).toContain('Dr. Smith');
      expect(result).toContain('Family Medicine');
      expect(result).toContain('Blue Cross, Aetna');
    });

    it('should format generic entities with fallback', async () => {
      const entities = [
        {
          name: 'Test Item',
          primary_identifier: 'SKU-123',
          price: 99.99,
          primary_category: 'Electronics',
          is_available: true,
          description: 'A test item for testing purposes'
        }
      ];

      const result = agent.formatEntitiesForAI(entities);

      expect(result).toContain('Test Item');
      expect(result).toContain('SKU-123');
      expect(result).toContain('$99.99');
      expect(result).toContain('Electronics');
      expect(result).toContain('in stock');
    });

    it('should handle entities without optional fields', async () => {
      const entities = [
        {
          name: 'Minimal Entity',
          is_available: false
        }
      ];

      const result = agent.formatEntitiesForAI(entities);

      expect(result).toContain('Minimal Entity');
      expect(result).toContain('out of stock');
    });
  });

  describe('buildAdaptiveContext', () => {
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

    it('should build complete context string', () => {
      const customerContext = 'Premium customer, frequent buyer';
      const userQuery = 'Show me your latest products';
      const searchResults = [
        {
          name: 'Product A',
          price: 49.99,
          is_available: true,
          primary_identifier: 'SKU-001'
        }
      ];

      const context = agent.buildAdaptiveContext(customerContext, userQuery, searchResults);

      expect(context).toContain('System Instructions');
      expect(context).toContain('Customer Context');
      expect(context).toContain('Premium customer');
      expect(context).toContain('User Query');
      expect(context).toContain('Show me your latest products');
      expect(context).toContain('Available products');
      expect(context).toContain('Product A');
      expect(context).toContain('Your Task');
      expect(context).toContain('Remember to');
    });

    it('should handle empty customer context', () => {
      const context = agent.buildAdaptiveContext('', 'Test query', []);

      expect(context).toContain('No customer data available');
    });

    it('should include user query in context', () => {
      const userQuery = 'What products do you have for winter?';
      const context = agent.buildAdaptiveContext('', userQuery, []);

      expect(context).toContain(userQuery);
    });

    it('should format search results in context', () => {
      const searchResults = [
        {
          name: 'Winter Jacket',
          price: 129.99,
          is_available: true,
          primary_identifier: 'WJ-001'
        },
        {
          name: 'Snow Boots',
          price: 89.99,
          is_available: false,
          primary_identifier: 'SB-001'
        }
      ];

      const context = agent.buildAdaptiveContext('', 'Winter items', searchResults);

      expect(context).toContain('Winter Jacket');
      expect(context).toContain('$129.99');
      expect(context).toContain('in stock');
      expect(context).toContain('Snow Boots');
      expect(context).toContain('$89.99');
      expect(context).toContain('out of stock');
    });
  });
});
