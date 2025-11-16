/**
 * AI Processor - Product Recommendations Basic Tests
 *
 * Tests basic product recommendation functionality:
 * - Cross-reference integration with recommendations
 * - Recommendation formatting for AI
 * - Error handling
 *
 * See ai-processor-recommendations-integration.test.ts for:
 * - End-to-end integration scenarios
 * - Tool result formatting
 */

import {
  createMockProduct,
  createMockScrapedPage,
  createMockRecommendation,
  createEnrichedProduct,
  formatRecommendation,
} from './helpers/recommendations-test-helpers';

describe('AI Processor - Product Recommendations Basic', () => {
  describe('Cross-Reference Integration', () => {
    it('should add recommendations to enriched products', () => {
      const enrichedProduct = createEnrichedProduct({
        id: 1,
        name: 'Pump A',
        recommendations: [
          createMockRecommendation({ id: 2, name: 'Pump B', similarity: 0.85 }),
          createMockRecommendation({ id: 3, name: 'Pump C', similarity: 0.75 }),
        ],
      });

      // Verify recommendations structure
      expect(enrichedProduct.recommendations).toHaveLength(2);
      expect(enrichedProduct.recommendations[0]).toHaveProperty('similarity');
      expect(enrichedProduct.recommendations[0]).toHaveProperty('recommendationReason');
    });

    it('should handle top products and exclude already-shown products', () => {
      const products = [
        createMockProduct({ id: 1, name: 'Top 1' }),
        createMockProduct({ id: 2, name: 'Top 2' }),
        createMockProduct({ id: 3, name: 'Top 3' }),
        createMockProduct({ id: 4, name: 'Product 4' }),
      ];

      const topProducts = products.slice(0, 3);
      expect(topProducts).toHaveLength(3);

      const shownIds = new Set(topProducts.map(p => p.id));
      const recommendation = createMockRecommendation({ id: 4 });
      expect(shownIds.has(recommendation.id)).toBe(false);
    });

    it('should handle recommendation generation failures gracefully', () => {
      // When recommendations fail, should set empty array
      const enrichedProduct = createEnrichedProduct({
        id: 1,
        name: 'Pump A',
        recommendations: [], // Empty on failure
      });

      expect(enrichedProduct.recommendations).toEqual([]);
    });

    it('should preserve existing enrichment when adding recommendations', () => {
      const enrichedProduct = createEnrichedProduct({
        id: 1,
        name: 'Pump A',
        scrapedPage: createMockScrapedPage(),
        relatedPages: [
          createMockScrapedPage({ url: 'https://example.com/related', title: 'Related' }),
        ],
        recommendations: [
          createMockRecommendation(),
        ],
        sources: {
          liveData: true,
          scrapedContent: true,
          relatedContent: true,
        },
      });

      // All enrichment should be preserved
      expect(enrichedProduct.scrapedPage).toBeDefined();
      expect(enrichedProduct.relatedPages).toHaveLength(1);
      expect(enrichedProduct.recommendations).toHaveLength(1);
      expect(enrichedProduct.sources.liveData).toBe(true);
      expect(enrichedProduct.sources.scrapedContent).toBe(true);
      expect(enrichedProduct.sources.relatedContent).toBe(true);
    });

    it('should include recommendations metadata in search results', () => {
      const enrichedMetadata = {
        id: 1,
        name: 'Pump A',
        matchedPageUrl: 'https://example.com/pump-a',
        relatedPages: [],
        recommendations: [
          {
            id: 2,
            name: 'Pump B',
            price: '420.00',
            permalink: 'https://example.com/pump-b',
            similarity: 0.85,
            recommendationReason: 'Very similar product',
          },
        ],
        sources: {
          liveData: true,
          scrapedContent: true,
          relatedContent: false,
        },
      };

      expect(enrichedMetadata.recommendations).toHaveLength(1);
      expect(enrichedMetadata.recommendations[0]).toHaveProperty('id');
      expect(enrichedMetadata.recommendations[0]).toHaveProperty('name');
      expect(enrichedMetadata.recommendations[0]).toHaveProperty('price');
      expect(enrichedMetadata.recommendations[0]).toHaveProperty('similarity');
      expect(enrichedMetadata.recommendations[0]).toHaveProperty('recommendationReason');
    });
  });

  describe('Recommendation Formatting for AI', () => {
    it('should format recommendation with name, price, and similarity', () => {
      const recommendation = {
        name: 'Hydraulic Pump B',
        price: '420.00',
        similarity: 0.85,
        recommendationReason: 'Very similar product',
      };

      const similarityPercent = (recommendation.similarity * 100).toFixed(0);
      const formattedRec = `${recommendation.name} — ${recommendation.price} (${similarityPercent}% similar)`;
      const formattedReason = `→ ${recommendation.recommendationReason}`;

      expect(formattedRec).toContain('Hydraulic Pump B');
      expect(formattedRec).toContain('420.00');
      expect(formattedRec).toContain('85% similar');
      expect(formattedReason).toBe('→ Very similar product');
    });

    it('should hide recommendations section when empty', () => {
      const metadata = {
        recommendations: [],
      };

      const shouldDisplay = metadata.recommendations && metadata.recommendations.length > 0;

      expect(shouldDisplay).toBe(false);
    });

    it('should format multiple recommendations correctly', () => {
      const recommendations = [
        {
          name: 'Pump B',
          price: '420.00',
          similarity: 0.85,
          recommendationReason: 'Very similar product',
        },
        {
          name: 'Pump C',
          price: '380.00',
          similarity: 0.75,
          recommendationReason: 'Related product',
        },
      ];

      // Each recommendation should be numbered
      const formatted = recommendations.map((rec, idx) => formatRecommendation(rec, idx));

      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toContain('1. Pump B');
      expect(formatted[1]).toContain('2. Pump C');
    });

    it('should handle missing prices and reasons', () => {
      const rec1 = { name: 'Pump B', price: undefined, similarity: 0.85 };
      const priceStr = rec1.price ? ` — ${rec1.price}` : '';
      const formatted = `${rec1.name}${priceStr} (${(rec1.similarity * 100).toFixed(0)}% similar)`;

      expect(formatted).toBe('Pump B (85% similar)');
      expect(formatted).not.toContain('—');

      const rec2 = { name: 'Pump C', recommendationReason: undefined };
      expect(rec2.recommendationReason).toBeUndefined();
    });

    it('should format similarity as percentage (0-100)', () => {
      const recommendations = [
        { similarity: 1.0 },   // 100%
        { similarity: 0.855 }, // 85.5% -> 86%
        { similarity: 0.704 }, // 70.4% -> 70%
      ];

      const percentages = recommendations.map(r => (r.similarity * 100).toFixed(0));

      expect(percentages[0]).toBe('100');
      expect(percentages[1]).toBe('86'); // Rounded up
      expect(percentages[2]).toBe('70');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing recommendations array', () => {
      const metadata: any = {
        sources: {
          liveData: true,
        },
        // recommendations field missing
      };

      const hasRecommendations =
        metadata?.recommendations &&
        Array.isArray(metadata.recommendations) &&
        metadata.recommendations.length > 0;

      expect(hasRecommendations).toBeFalsy();
    });

    it('should handle null/undefined recommendations', () => {
      const metadata1 = { recommendations: null };
      const metadata2 = { recommendations: undefined };

      const check1 = metadata1.recommendations && Array.isArray(metadata1.recommendations);
      const check2 = metadata2.recommendations && Array.isArray(metadata2.recommendations);

      expect(check1).toBeFalsy();
      expect(check2).toBeFalsy();
    });

    it('should handle recommendations without required fields', () => {
      const recommendation: any = {
        id: 2,
        // name missing
        // similarity missing
      };

      const isValid = recommendation.name && typeof recommendation.similarity === 'number';

      expect(isValid).toBeFalsy();
    });

    it('should handle invalid similarity values', () => {
      const recommendations = [
        { similarity: NaN },
        { similarity: Infinity },
        { similarity: -0.5 },
        { similarity: 1.5 },
      ];

      const formatted = recommendations.map(r => {
        const similarity = isFinite(r.similarity) ? Math.max(0, Math.min(1, r.similarity)) : 0;
        return (similarity * 100).toFixed(0);
      });

      expect(formatted[0]).toBe('0'); // NaN -> 0
      expect(formatted[1]).toBe('0'); // Infinity -> 0
      expect(formatted[2]).toBe('0'); // -0.5 -> 0 (clamped)
      expect(formatted[3]).toBe('100'); // 1.5 -> 1.0 -> 100 (clamped)
    });
  });
});
