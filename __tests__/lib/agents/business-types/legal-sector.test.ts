/**
 * Domain-Agnostic Agent - Legal Sector Tests
 * Tests for legal services business type (consultations, professional tone)
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

describe('DomainAgnosticAgent - Legal Services Business Type', () => {
  let agent: DomainAgnosticAgent;

  beforeEach(async () => {
    agent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();

    await initializeAgentWithBusinessType(
      agent,
      mockSupabase,
      'legal',
      STANDARD_TERMINOLOGY.legal,
      0.92
    );
  });

  describe('System Prompt Generation', () => {
    it('should generate legal-specific system prompt', () => {
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('legal');
      expect(prompt).toContain('services');
      expect(prompt).toContain('practice areas');
      expect(prompt).toContain('consultation scheduling');
      expect(prompt).toContain('professional tone');
      expect(prompt).toContain('Avoid giving specific legal advice');
    });

    it('should emphasize professional communication', () => {
      const prompt = agent.getAdaptiveSystemPrompt();

      expect(prompt).toContain('professional tone');
    });
  });

  describe('Context Building', () => {
    it('should maintain professional tone in legal context', () => {
      const context = agent.buildAdaptiveContext(
        'Client seeking family law assistance',
        'Do you handle divorce cases?',
        []
      );

      expect(context).toContain('professional tone');
      expect(context).toContain('legal business');
      expect(context).toContain('services');
    });

    it('should use legal terminology appropriately', () => {
      const context = agent.buildAdaptiveContext(
        'Business owner',
        'What legal services do you offer?',
        []
      );

      expect(context).toContain('services');
      expect(context).toBeDefined();
    });
  });

  describe('Entity Formatting', () => {
    it('should format legal services with generic fields', () => {
      const entities = [
        {
          name: 'Family Law Consultation',
          primary_identifier: 'FL-001',
          price: 250,
          primary_category: 'Family Law',
          is_available: true,
          description: 'Initial consultation for family law matters'
        }
      ];

      const result = agent.formatEntitiesForAI(entities);

      expect(result).toContain('Family Law Consultation');
      expect(result).toContain('FL-001');
      expect(result).toContain('consultation fee: $250');
      expect(result).toContain('Family Law');
      expect(result).toContain('available');
    });
  });
});
