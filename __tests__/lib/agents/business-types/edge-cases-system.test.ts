/**
 * Domain-Agnostic Agent - Edge Cases: System Behavior Tests
 * Tests for confidence scores, database errors, and result set sizes
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';
import {
  createMockSupabaseClient,
  initializeAgentWithBusinessType,
  STANDARD_TERMINOLOGY,
  type MockSupabaseClient
} from '@/__tests__/utils/domain-agnostic-test-helpers';

// Mock Supabase
const mockSupabase = createMockSupabaseClient();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Edge Cases: System Behavior', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('Confidence Scores', () => {
    it('should handle very low confidence scores', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'general',
        STANDARD_TERMINOLOGY.general,
        0.3
      );

      const prompt = agent.getAdaptiveSystemPrompt();
      expect(prompt).toContain('30% certain');
    });

    it('should handle high confidence scores', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'ecommerce',
        STANDARD_TERMINOLOGY.ecommerce,
        0.95
      );

      const prompt = agent.getAdaptiveSystemPrompt();
      expect(prompt).toBeDefined();
    });

    it('should handle zero confidence scores', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'general',
        STANDARD_TERMINOLOGY.general,
        0
      );

      const prompt = agent.getAdaptiveSystemPrompt();
      expect(prompt).toBeDefined();
    });
  });

  describe('Database Errors', () => {
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

    it('should handle connection timeout errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Connection timeout'))
          })
        })
      });

      await expect(agent.initializeForDomain('test-domain')).rejects.toThrow('Connection timeout');
    });
  });

  describe('Empty and Large Result Sets', () => {
    it('should handle empty search results', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'ecommerce',
        STANDARD_TERMINOLOGY.ecommerce,
        0.9
      );

      const context = agent.buildAdaptiveContext('Customer', 'Show products', []);
      expect(context).toContain('No products found');
    });

    it('should handle very large search result sets', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'ecommerce',
        STANDARD_TERMINOLOGY.ecommerce,
        0.9
      );

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

    it('should handle single result set', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'ecommerce',
        STANDARD_TERMINOLOGY.ecommerce,
        0.9
      );

      const singleResult = [
        {
          name: 'Only Product',
          price: 50,
          is_available: true
        }
      ];

      const context = agent.buildAdaptiveContext(
        'Customer',
        'Show products',
        singleResult
      );

      expect(context).toContain('Found 1 product');
      expect(context).toContain('Only Product');
    });
  });
});
