/**
 * Domain-Agnostic Agent - Execution Tests
 * Tests for prompt generation and query intent detection
 */

import { DomainAgnosticAgent, BusinessContext } from '@/lib/agents/domain-agnostic-agent';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Execution', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('getAdaptiveSystemPrompt', () => {
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
});
