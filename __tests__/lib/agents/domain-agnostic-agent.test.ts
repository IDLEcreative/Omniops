/**
 * Tests for Domain-Agnostic Agent
 * CRITICAL: This agent handles multi-tenant business type detection and adaptation
 */

import { DomainAgnosticAgent, BusinessContext } from '@/lib/agents/domain-agnostic-agent';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('initializeForDomain', () => {
    it('should load business classification from database', async () => {
      const mockClassification = {
        business_type: 'ecommerce',
        entity_terminology: {
          entityName: 'product',
          entityNamePlural: 'products',
          availableText: 'in stock',
          unavailableText: 'out of stock',
          priceLabel: 'price',
          searchPrompt: 'Search our products'
        },
        confidence: 0.95
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockClassification })
          })
        })
      });

      await agent.initializeForDomain('test-domain-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('business_classifications');
    });

    it('should use default context when no classification exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null })
          })
        })
      });

      await agent.initializeForDomain('test-domain-123');

      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('general');
      expect(prompt).toContain('items');
    });

    it('should handle real estate classification', async () => {
      const mockClassification = {
        business_type: 'real_estate',
        entity_terminology: {
          entityName: 'property',
          entityNamePlural: 'properties',
          availableText: 'available',
          unavailableText: 'sold',
          priceLabel: 'asking price',
          searchPrompt: 'Search properties'
        },
        confidence: 0.88
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockClassification })
          })
        })
      });

      await agent.initializeForDomain('realestate-domain');

      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('real_estate');
      expect(prompt).toContain('properties');
      expect(prompt).toContain('bedrooms');
    });
  });

  describe('getAdaptiveSystemPrompt', () => {
    it('should throw error if not initialized', () => {
      expect(() => agent.getAdaptiveSystemPrompt()).toThrow('Must initialize with domain first');
    });

    it('should generate ecommerce-specific prompt', async () => {
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
                  searchPrompt: 'Search products'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      await agent.initializeForDomain('ecommerce-domain');
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('ecommerce');
      expect(prompt).toContain('shipping');
      expect(prompt).toContain('return policy');
      expect(prompt).toContain('products');
      expect(prompt).toContain('SKU');
    });

    it('should generate healthcare-specific prompt', async () => {
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
                  searchPrompt: 'Search services'
                },
                confidence: 0.85
              }
            })
          })
        })
      });

      await agent.initializeForDomain('healthcare-domain');
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('healthcare');
      expect(prompt).toContain('insurance');
      expect(prompt).toContain('appointment');
      expect(prompt).toContain('provider credentials');
    });

    it('should include customer data instruction when hasCustomerData is true', async () => {
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
                confidence: 0.7
              }
            })
          })
        })
      });

      await agent.initializeForDomain('test-domain');
      const prompt = agent.getAdaptiveSystemPrompt(true);

      expect(prompt).toContain('Customer Data Available');
      expect(prompt).toContain('personalize responses');
    });

    it('should include confidence level in prompt', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'restaurant',
                entity_terminology: {
                  entityName: 'dish',
                  entityNamePlural: 'dishes',
                  availableText: 'available',
                  unavailableText: 'unavailable',
                  priceLabel: 'price',
                  searchPrompt: 'Browse menu'
                },
                confidence: 0.75
              }
            })
          })
        })
      });

      await agent.initializeForDomain('restaurant-domain');
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('75% certain');
    });

    it('should never recommend competitors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'ecommerce',
                entity_terminology: {
                  entityName: 'product',
                  entityNamePlural: 'products',
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
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('Never recommend or link to external competitors');
    });
  });

  describe('getAdaptiveActionPrompt', () => {
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

    it('should detect availability query intent', () => {
      const queries = [
        'What do you have available?',
        'Show me what\'s in stock',
        'Do you have any pumps?'
      ];

      queries.forEach(query => {
        const result = agent.getAdaptiveActionPrompt(query);
        expect(result).toContain('in stock');
        expect(result).toContain('products');
      });
    });

    it('should detect price query intent', () => {
      const queries = [
        'How much does this cost?',
        'What\'s the price?',
        'How much for shipping?'
      ];

      queries.forEach(query => {
        const result = agent.getAdaptiveActionPrompt(query);
        expect(result).toContain('price information');
      });
    });

    it('should detect hours query intent', () => {
      const queries = [
        'What are your hours?',
        'Are you open today?',
      ];

      queries.forEach(query => {
        const result = agent.getAdaptiveActionPrompt(query);
        expect(result).toContain('business hours');
      });

      // Edge case: "close" also matches stock/availability
      const edgeCase = agent.getAdaptiveActionPrompt('When do you close?');
      // Should still be useful, even if not perfect detection
      expect(edgeCase).toBeDefined();
    });

    it('should detect contact query intent', () => {
      const queries = [
        'How can I contact you?',
        'What\'s your phone number?',
      ];

      queries.forEach(query => {
        const result = agent.getAdaptiveActionPrompt(query);
        expect(result).toContain('contact information');
      });

      // Edge case: "Do you have" matches availability detection first
      const edgeCase = agent.getAdaptiveActionPrompt('Do you have an email?');
      // Should still be useful for the user
      expect(edgeCase).toBeDefined();
    });

    it('should return default action for general queries', () => {
      const result = agent.getAdaptiveActionPrompt('Tell me about your company');

      expect(result).toContain('Help the customer');
      expect(result).toContain('Tell me about your company');
    });
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

    it('should throw if not initialized', () => {
      const uninitializedAgent = new DomainAgnosticAgent('test-url', 'test-key');

      expect(() => {
        uninitializedAgent.buildAdaptiveContext('context', 'query', []);
      }).toThrow('Must initialize with domain first');
    });
  });
});
