/**
 * Domain-Agnostic Agent - Initialization Tests
 * Tests for domain initialization and business context loading
 */

import { DomainAgnosticAgent, BusinessContext } from '@/lib/agents/domain-agnostic-agent';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Initialization', () => {
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

    it('should handle ecommerce classification', async () => {
      const mockClassification = {
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
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockClassification })
          })
        })
      });

      await agent.initializeForDomain('ecommerce-domain');

      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('ecommerce');
      expect(prompt).toContain('products');
    });

    it('should handle healthcare classification', async () => {
      const mockClassification = {
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
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockClassification })
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

    it('should handle restaurant classification', async () => {
      const mockClassification = {
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
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockClassification })
          })
        })
      });

      await agent.initializeForDomain('restaurant-domain');

      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('restaurant');
      expect(prompt).toContain('75% certain');
    });
  });

  describe('Uninitialized agent errors', () => {
    it('should throw error when getAdaptiveSystemPrompt called without initialization', () => {
      expect(() => agent.getAdaptiveSystemPrompt()).toThrow('Must initialize with domain first');
    });

    it('should throw error when buildAdaptiveContext called without initialization', () => {
      expect(() => {
        agent.buildAdaptiveContext('context', 'query', []);
      }).toThrow('Must initialize with domain first');
    });
  });
});
