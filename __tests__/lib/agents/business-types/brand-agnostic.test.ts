/**
 * Domain-Agnostic Agent - Brand-Agnostic Validation
 * Tests ensuring the agent remains brand-neutral and multi-tenant compatible
 *
 * @purpose Validates that system prompts and responses never contain hardcoded
 *          company names, product types, or industry-specific assumptions
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Brand-Agnostic Validation', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('Multiple Business Types Comparison', () => {
    it('should use different terminology for different business types', async () => {
      // Test e-commerce
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

      await agent.initializeForDomain('ecommerce-domain');
      const ecommercePrompt = agent.getAdaptiveSystemPrompt();

      // Test education
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                business_type: 'education',
                entity_terminology: {
                  entityName: 'course',
                  entityNamePlural: 'courses',
                  availableText: 'open',
                  unavailableText: 'closed',
                  priceLabel: 'tuition',
                  searchPrompt: 'Search'
                },
                confidence: 0.9
              }
            })
          })
        })
      });

      const educationAgent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
      await educationAgent.initializeForDomain('education-domain');
      const educationPrompt = educationAgent.getAdaptiveSystemPrompt();

      // Verify different terminology
      expect(ecommercePrompt).toContain('products');
      expect(ecommercePrompt).not.toContain('courses');
      expect(educationPrompt).toContain('courses');
      // Note: "products" may appear in generic text but should not be the primary term
      expect(educationPrompt).toMatch(/courses.*not.*"products"/s);
    });
  });

  describe('Brand-Agnostic Validation', () => {
    it('should not contain hardcoded company names', async () => {
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
      const prompt = agent.getAdaptiveSystemPrompt();

      // Should not contain specific company names
      expect(prompt).not.toContain('Thompson');
      expect(prompt).not.toContain('Cifa');
      expect(prompt).not.toContain('Amazon');
      expect(prompt).not.toContain('Shopify');
    });

    it('should not contain industry-specific product types', async () => {
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
      const prompt = agent.getAdaptiveSystemPrompt();

      // Generic prompt should not contain specific product types
      expect(prompt).not.toContain('pumps');
      expect(prompt).not.toContain('hydraulic');
      expect(prompt).not.toContain('parts');
    });
  });
});
