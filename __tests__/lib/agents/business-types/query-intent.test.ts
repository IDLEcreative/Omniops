/**
 * Domain-Agnostic Agent - Query Intent Detection Tests
 * Tests for multi-intent queries, empty queries, and special characters
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

describe('DomainAgnosticAgent - Query Intent Detection', () => {
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

  describe('Multiple Intent Queries', () => {
    it('should handle queries with multiple intents', () => {
      const query = 'What do you have available and how much does it cost?';
      const result = agent.getAdaptiveActionPrompt(query);

      // Should detect availability intent (first match)
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should prioritize primary intent in complex queries', () => {
      const query = 'Show me all available products under $100 with free shipping';
      const result = agent.getAdaptiveActionPrompt(query);

      expect(result).toBeDefined();
      expect(result).toContain('in stock');
    });
  });

  describe('Empty and Whitespace Queries', () => {
    it('should handle empty query string', () => {
      const result = agent.getAdaptiveActionPrompt('');
      expect(result).toContain('Help the customer');
    });

    it('should handle whitespace-only queries', () => {
      const result = agent.getAdaptiveActionPrompt('   ');
      expect(result).toBeDefined();
    });
  });

  describe('Long Queries', () => {
    it('should handle very long query strings', () => {
      const longQuery = 'I am looking for ' + 'something '.repeat(100) + 'that is available';
      const result = agent.getAdaptiveActionPrompt(longQuery);

      expect(result).toBeDefined();
      expect(result).toContain('in stock');
    });
  });

  describe('Special Characters and Unicode', () => {
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

    it('should handle emoji in queries', () => {
      const query = 'Do you have 🎁 gift products?';
      const result = agent.getAdaptiveActionPrompt(query);

      expect(result).toBeDefined();
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle uppercase queries', () => {
      const query = 'SHOW ME ALL PRODUCTS';
      const result = agent.getAdaptiveActionPrompt(query);

      expect(result).toBeDefined();
    });

    it('should handle mixed case queries', () => {
      const query = 'WhAt PrOdUcTs ArE aVaIlAbLe?';
      const result = agent.getAdaptiveActionPrompt(query);

      expect(result).toBeDefined();
    });
  });
});
