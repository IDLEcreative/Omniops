/**
 * Domain-Agnostic Agent - Cross-Industry Comparison Tests
 * Tests for multi-tenant business type isolation and terminology differences
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';
import {
  createMockSupabaseClient,
  mockBusinessTypeConfig,
  STANDARD_TERMINOLOGY,
  type MockSupabaseClient
} from '@/__tests__/utils/domain-agnostic-test-helpers';

// Mock Supabase
const mockSupabase = createMockSupabaseClient();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DomainAgnosticAgent - Cross-Industry Comparison', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Business Type Terminology Isolation', () => {
    it('should use different terminology for different business types', async () => {
      // Test e-commerce
      const ecommerceAgent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');

      mockBusinessTypeConfig(mockSupabase, {
        business_type: 'ecommerce',
        entity_terminology: STANDARD_TERMINOLOGY.ecommerce,
        confidence: 0.9
      });

      await ecommerceAgent.initializeForDomain('ecommerce-domain');
      const ecommercePrompt = ecommerceAgent.getAdaptiveSystemPrompt();

      // Test education
      const educationAgent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');

      mockBusinessTypeConfig(mockSupabase, {
        business_type: 'education',
        entity_terminology: STANDARD_TERMINOLOGY.education,
        confidence: 0.9
      });

      await educationAgent.initializeForDomain('education-domain');
      const educationPrompt = educationAgent.getAdaptiveSystemPrompt();

      // Verify different terminology
      expect(ecommercePrompt).toContain('products');
      expect(ecommercePrompt).not.toContain('courses');
      expect(educationPrompt).toContain('courses');
      // Note: "products" may appear in generic text but should not be the primary term
      expect(educationPrompt).toMatch(/courses.*not.*"products"/s);
    });

    it('should maintain business type isolation across multiple agents', async () => {
      const legalAgent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');
      const automotiveAgent = new DomainAgnosticAgent('https://test.supabase.co', 'test-key');

      // Configure legal agent
      mockBusinessTypeConfig(mockSupabase, {
        business_type: 'legal',
        entity_terminology: STANDARD_TERMINOLOGY.legal,
        confidence: 0.92
      });
      await legalAgent.initializeForDomain('legal-domain');

      // Configure automotive agent
      mockBusinessTypeConfig(mockSupabase, {
        business_type: 'automotive',
        entity_terminology: STANDARD_TERMINOLOGY.automotive,
        confidence: 0.85
      });
      await automotiveAgent.initializeForDomain('automotive-domain');

      // Verify isolation
      const legalPrompt = legalAgent.getAdaptiveSystemPrompt();
      const automotivePrompt = automotiveAgent.getAdaptiveSystemPrompt();

      expect(legalPrompt).toContain('services');
      expect(legalPrompt).toContain('consultation fee');
      expect(automotivePrompt).toContain('vehicles');
      expect(automotivePrompt).not.toContain('consultation fee');
    });
  });
});
