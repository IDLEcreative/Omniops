/**
 * Domain-Agnostic Agent - Automotive Sector Tests
 * Tests for automotive business type (vehicles, VIN, test drives)
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

describe('DomainAgnosticAgent - Automotive Business Type', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(async () => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();

    await initializeAgentWithBusinessType(
      agent,
      mockSupabase,
      'automotive',
      STANDARD_TERMINOLOGY.automotive,
      0.85
    );
  });

  describe('System Prompt Generation', () => {
    it('should generate automotive-specific system prompt', () => {
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('automotive');
      expect(prompt).toContain('vehicles');
      expect(prompt).toContain('vehicle specifications');
      expect(prompt).toContain('make, model, year, mileage');
      expect(prompt).toContain('financing options');
      expect(prompt).toContain('test drive scheduling');
      expect(prompt).toContain('VIN numbers');
    });

    it('should include automotive-specific features', () => {
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('VIN numbers');
      expect(prompt).toContain('test drive');
    });
  });

  describe('Context Building', () => {
    it('should use automotive terminology consistently', () => {
      const context = agent.buildAdaptiveContext(
        'Customer interested in SUVs',
        'Show me available vehicles',
        []
      );

      expect(context).toContain('vehicles');
      expect(context).toContain('automotive business');
      expect(context).toContain('available');
    });

    it('should handle automotive-specific queries', () => {
      const context = agent.buildAdaptiveContext(
        'First-time buyer',
        'What vehicles do you have under $20,000?',
        []
      );

      expect(context).toContain('vehicles');
      expect(context).toBeDefined();
    });
  });
});
