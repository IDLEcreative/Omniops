/**
 * Domain-Agnostic Agent - Brand-Agnostic Validation Tests
 * Critical tests ensuring multi-tenant compliance (no hardcoded business terms)
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

describe('DomainAgnosticAgent - Brand-Agnostic Validation', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(() => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('No Hardcoded Company Names', () => {
    it('should not contain hardcoded company names in ecommerce', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'ecommerce',
        STANDARD_TERMINOLOGY.ecommerce,
        0.9
      );

      const prompt = agent.getAdaptiveSystemPrompt();

      // Should not contain specific company names
      expect(prompt).not.toContain('Thompson');
      expect(prompt).not.toContain('Cifa');
      expect(prompt).not.toContain('Amazon');
      expect(prompt).not.toContain('Shopify');
    });

    it('should not contain hardcoded company names in education', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'education',
        STANDARD_TERMINOLOGY.education,
        0.9
      );

      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).not.toContain('Harvard');
      expect(prompt).not.toContain('MIT');
      expect(prompt).not.toContain('Coursera');
    });

    it('should not contain hardcoded company names in legal', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'legal',
        STANDARD_TERMINOLOGY.legal,
        0.9
      );

      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).not.toContain('Baker McKenzie');
      expect(prompt).not.toContain('LegalZoom');
    });
  });

  describe('No Industry-Specific Product Types', () => {
    it('should not contain industry-specific product types in general config', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'general',
        STANDARD_TERMINOLOGY.general,
        0.5
      );

      const prompt = agent.getAdaptiveSystemPrompt();

      // Generic prompt should not contain specific product types
      expect(prompt).not.toContain('pumps');
      expect(prompt).not.toContain('hydraulic');
      expect(prompt).not.toContain('parts');
      expect(prompt).not.toContain('widgets');
    });

    it('should use only configured terminology', async () => {
      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'automotive',
        STANDARD_TERMINOLOGY.automotive,
        0.85
      );

      const prompt = agent.getAdaptiveSystemPrompt();

      // Should contain configured terms
      expect(prompt).toContain('vehicles');
      // Should not contain terms from other industries
      expect(prompt).not.toContain('products');
      expect(prompt).not.toContain('courses');
      expect(prompt).not.toContain('services');
    });
  });

  describe('Multi-Tenant Terminology Compliance', () => {
    it('should only use terminology from database configuration', async () => {
      const customTerminology = {
        entityName: 'listing',
        entityNamePlural: 'listings',
        availableText: 'active',
        unavailableText: 'inactive',
        priceLabel: 'monthly rent',
        searchPrompt: 'Search listings'
      };

      await initializeAgentWithBusinessType(
        agent,
        mockSupabase,
        'real_estate',
        customTerminology,
        0.88
      );

      const prompt = agent.getAdaptiveSystemPrompt();

      // Should use custom terminology
      expect(prompt).toContain('listings');
      expect(prompt).toContain('monthly rent');

      // Should not use default e-commerce terms
      expect(prompt).not.toContain('products');
      expect(prompt).not.toContain('in stock');
    });
  });
});
