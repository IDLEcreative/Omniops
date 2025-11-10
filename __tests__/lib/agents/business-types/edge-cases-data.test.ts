/**
 * Domain-Agnostic Agent - Edge Cases: Data Handling Tests
 * Tests for null values, malformed data, and boundary conditions
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';
import {
  createMockSupabaseClient,
  initializeAgentWithBusinessType,
  mockBusinessTypeConfig,
  STANDARD_TERMINOLOGY,
  type MockSupabaseClient
} from '@/__tests__/utils/domain-agnostic-test-helpers';

// Mock Supabase
const mockSupabase = createMockSupabaseClient();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Edge Cases: Data Handling', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('Null and Undefined Values', () => {
    it('should handle null entity attributes gracefully', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'education',
        STANDARD_TERMINOLOGY.education,
        0.9
      );

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
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'general',
        STANDARD_TERMINOLOGY.general,
        0.5
      );

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

    it('should handle undefined business_type', async () => {
      mockBusinessTypeConfig(mockSupabase, {
        business_type: undefined as any,
        entity_terminology: STANDARD_TERMINOLOGY.general,
        confidence: 0.5
      });

      await agent.initializeForDomain('test-domain');
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle null customer context gracefully', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'ecommerce',
        STANDARD_TERMINOLOGY.ecommerce,
        0.9
      );

      const context = agent.buildAdaptiveContext(
        null as any,
        'Test query',
        []
      );

      expect(context).toContain('No customer data available');
    });

    it('should handle empty string query gracefully', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'ecommerce',
        STANDARD_TERMINOLOGY.ecommerce,
        0.9
      );

      const context = agent.buildAdaptiveContext(
        'Customer',
        '',
        []
      );

      expect(context).toBeDefined();
      expect(context).toContain('User Query');
    });
  });

  describe('Malformed Data', () => {
    it('should handle malformed entity data', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'ecommerce',
        STANDARD_TERMINOLOGY.ecommerce,
        0.9
      );

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

    it('should handle entities with missing required fields', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'ecommerce',
        STANDARD_TERMINOLOGY.ecommerce,
        0.9
      );

      const entities = [
        {
          name: 'Incomplete Product'
          // Missing is_available, price
        }
      ];

      const result = agent.formatEntitiesForAI(entities);
      expect(result).toBeDefined();
      expect(result).toContain('Incomplete Product');
    });
  });
});
