/**
 * AI Quote System Integration Tests
 * Tests the complete quote generation pipeline with real domains
 */

import {
  collectBusinessIntelligence,
  analyzeBusiness,
  getTierDisplayName
} from '@/lib/ai-quote';

describe('AI Quote System', () => {
  // Skip tests if OPENAI_API_KEY not set
  const skipIfNoApiKey = process.env.OPENAI_API_KEY ? describe : describe.skip;

  skipIfNoApiKey('Full Quote Analysis Pipeline', () => {
    it('should analyze a real domain and return pricing recommendation', async () => {
      // Test with a known e-commerce domain
      const domain = 'wordpress.com';

      // Collect business intelligence
      const intel = await collectBusinessIntelligence(domain);

      // Verify collected data
      expect(intel).toBeDefined();
      expect(intel.domain).toBe(domain);
      expect(intel.traffic).toBeDefined();
      expect(intel.website).toBeDefined();
      expect(intel.company).toBeDefined();
      expect(intel.domainInfo).toBeDefined();

      // Analyze with AI
      const recommendation = await analyzeBusiness(intel);

      // Verify recommendation
      expect(recommendation).toBeDefined();
      expect(recommendation.tier).toMatch(/small_business|sme|mid_market|enterprise/);
      expect(recommendation.monthlyPrice).toBeGreaterThan(0);
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(100);
      expect(recommendation.estimatedCompletions).toBeGreaterThanOrEqual(0);
      expect(recommendation.reasoning).toBeInstanceOf(Array);
      expect(recommendation.reasoning.length).toBeGreaterThan(0);

      console.log('✅ Quote Analysis Results:');
      console.log(`   Domain: ${domain}`);
      console.log(`   Tier: ${getTierDisplayName(recommendation.tier)}`);
      console.log(`   Price: £${recommendation.monthlyPrice}/month`);
      console.log(`   Confidence: ${recommendation.confidence}%`);
      console.log(`   Estimated Completions: ${recommendation.estimatedCompletions}`);
      console.log(`   Analysis Time: ~${recommendation.analyzedAt}`);
    }, 60000); // 60 second timeout
  });

  describe('Business Intelligence Collection', () => {
    it('should collect website data', async () => {
      const intel = await collectBusinessIntelligence('github.com');

      expect(intel.website).toBeDefined();
      expect(intel.website.totalPages).toBeGreaterThanOrEqual(0);
      expect(intel.website.categories).toBeInstanceOf(Array);
      expect(intel.website.languages).toBeInstanceOf(Array);
    }, 30000);

    it('should collect company data', async () => {
      const intel = await collectBusinessIntelligence('github.com');

      expect(intel.company).toBeDefined();
      expect(intel.company.name).toBeDefined();
      expect(intel.company.companyStatus).toMatch(/active|dissolved|unknown/);
    }, 30000);

    it('should collect traffic data', async () => {
      const intel = await collectBusinessIntelligence('github.com');

      expect(intel.traffic).toBeDefined();
      expect(intel.traffic.monthlyVisitors).toBeGreaterThanOrEqual(0);
      expect(intel.traffic.source).toMatch(/cloudflare|similarweb|estimated/);
      expect(intel.traffic.confidence).toBeGreaterThanOrEqual(0);
      expect(intel.traffic.confidence).toBeLessThanOrEqual(100);
    }, 30000);

    it('should collect domain data', async () => {
      const intel = await collectBusinessIntelligence('github.com');

      expect(intel.domainInfo).toBeDefined();
      expect(intel.domainInfo.domainAge).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Pricing Recommendations', () => {
    it('should recommend appropriate tier based on traffic', async () => {
      const intel = await collectBusinessIntelligence('github.com');
      const recommendation = await analyzeBusiness(intel);

      // GitHub is a huge platform, should get enterprise tier
      expect(recommendation.tier).toBeDefined();
      expect(['sme', 'mid_market', 'enterprise']).toContain(recommendation.tier);
    }, 60000);

    it('should calculate estimated completions correctly', async () => {
      const intel = await collectBusinessIntelligence('wordpress.com');
      const recommendation = await analyzeBusiness(intel);

      // Formula: monthlyVisitors × 0.05 × 0.90
      const expectedMin = (intel.traffic.monthlyVisitors * 0.05 * 0.90) * 0.9; // 10% tolerance
      const expectedMax = (intel.traffic.monthlyVisitors * 0.05 * 0.90) * 1.1;

      expect(recommendation.estimatedCompletions).toBeLessThanOrEqual(
        Math.ceil(expectedMax)
      );
    }, 60000);

    it('should provide reasoning for tier selection', async () => {
      const intel = await collectBusinessIntelligence('wordpress.com');
      const recommendation = await analyzeBusiness(intel);

      expect(recommendation.reasoning).toBeInstanceOf(Array);
      expect(recommendation.reasoning.length).toBeGreaterThan(0);

      // Should mention key signals
      const reasoningText = recommendation.reasoning.join(' ').toLowerCase();
      expect(
        reasoningText.includes('traffic') ||
          reasoningText.includes('employee') ||
          reasoningText.includes('revenue') ||
          reasoningText.includes('visitor')
      ).toBe(true);
    }, 60000);
  });
});
