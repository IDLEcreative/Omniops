/**
 * Domain-Agnostic Agent - Context Building Tests
 * Tests for adaptive context generation with search results
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';
import {
  createMockSupabaseClient,
  initializeAgentWithBusinessType,
  STANDARD_TERMINOLOGY,
  createSampleEntity,
  type MockSupabaseClient
} from '@/__tests__/utils/domain-agnostic-test-helpers';

// Mock Supabase
const mockSupabase = createMockSupabaseClient();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Context Building', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(async () => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();

    await initializeAgentWithBusinessType(
      agent,
      mockSupabase,
      'ecommerce',
      STANDARD_TERMINOLOGY.ecommerce,
      0.9
    );
  });

  describe('Basic Context Building', () => {
    it('should build context with customer info and query', () => {
      const context = agent.buildAdaptiveContext(
        'First-time customer',
        'What products do you have?',
        []
      );

      expect(context).toContain('First-time customer');
      expect(context).toContain('What products do you have?');
    });

    it('should include business type in context', () => {
      const context = agent.buildAdaptiveContext(
        'Customer',
        'Show products',
        []
      );

      expect(context).toContain('ecommerce business');
    });

    it('should use appropriate terminology in context', () => {
      const context = agent.buildAdaptiveContext(
        'Customer',
        'What is available?',
        []
      );

      expect(context).toContain('products');
      expect(context).toContain('in stock');
    });
  });

  describe('Search Results Formatting', () => {
    it('should format search results with entity count', () => {
      const entities = [
        createSampleEntity('Product A', 100, true),
        createSampleEntity('Product B', 200, false)
      ];

      const context = agent.buildAdaptiveContext(
        'Customer',
        'Show products',
        entities
      );

      expect(context).toContain('Found 2 products');
    });

    it('should include entity details in context', () => {
      const entities = [
        createSampleEntity('Premium Widget', 299, true, {
          sku: 'WID-001',
          category: 'Electronics'
        })
      ];

      const context = agent.buildAdaptiveContext(
        'Customer',
        'Show premium products',
        entities
      );

      expect(context).toContain('Premium Widget');
      expect(context).toContain('price: $299');
      expect(context).toContain('in stock');
    });
  });

  describe('Empty Results Handling', () => {
    it('should handle empty search results gracefully', () => {
      const context = agent.buildAdaptiveContext(
        'Customer',
        'Show products',
        []
      );

      expect(context).toContain('No products found');
    });
  });

  describe('Large Result Sets', () => {
    it('should handle large search result sets', () => {
      const largeResultSet = Array.from({ length: 50 }, (_, i) =>
        createSampleEntity(`Product ${i}`, i * 10, i % 2 === 0)
      );

      const context = agent.buildAdaptiveContext(
        'Customer',
        'Show all products',
        largeResultSet
      );

      expect(context).toContain('Found 50 products');
      expect(context).toContain('Product 0');
      expect(context).toContain('Product 49');
    });
  });

  describe('Customer Context Variations', () => {
    it('should adapt to different customer profiles', () => {
      const context1 = agent.buildAdaptiveContext(
        'VIP customer with purchase history',
        'What is new?',
        []
      );

      expect(context1).toContain('VIP customer');

      const context2 = agent.buildAdaptiveContext(
        'Anonymous visitor',
        'Browse products',
        []
      );

      expect(context2).toContain('Anonymous visitor');
    });
  });
});
