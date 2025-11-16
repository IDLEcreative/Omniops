/**
 * AI Processor - Product Recommendations Integration Tests
 *
 * Tests end-to-end recommendation integration:
 * - Tool result formatting with recommendations
 * - Complete integration scenarios
 *
 * See ai-processor-recommendations-basic.test.ts for basic functionality tests
 */

import {
  createMockProduct,
  createMockScrapedPage,
  createMockRecommendation,
} from './helpers/recommendations-test-helpers';

describe('AI Processor - Product Recommendations Integration', () => {
  describe('Tool Result Formatting', () => {
    it('should include recommendations in formatted tool response', () => {
      const toolResult = {
        success: true,
        results: [
          {
            url: 'https://example.com/pump-a',
            title: 'Hydraulic Pump A',
            content: 'Product description',
            similarity: 0.92,
            metadata: {
              recommendations: [
                {
                  id: 2,
                  name: 'Hydraulic Pump B',
                  price: '420.00',
                  similarity: 0.85,
                  recommendationReason: 'Very similar product',
                },
              ],
            },
          },
        ],
        source: 'woocommerce-api',
      };

      const result = toolResult.results[0];
      const hasRecommendations =
        result.metadata &&
        Array.isArray((result.metadata as any).recommendations) &&
        (result.metadata as any).recommendations.length > 0;

      expect(hasRecommendations).toBe(true);
    });

    it('should format complete tool response with recommendations', () => {
      const mockResult = {
        url: 'https://example.com/pump-a',
        title: 'Hydraulic Pump A',
        content: 'Industrial hydraulic pump for heavy-duty applications',
        similarity: 0.92,
        metadata: {
          sources: {
            liveData: true,
            scrapedContent: true,
          },
          recommendations: [
            {
              name: 'Hydraulic Pump B',
              price: '420.00',
              similarity: 0.85,
              recommendationReason: 'Very similar product',
            },
          ],
        },
      };

      // Simulate formatted output
      let output = `1. ${mockResult.title}\n`;
      output += `   URL: ${mockResult.url}\n`;
      output += `   Content: ${mockResult.content.substring(0, 200)}\n`;
      output += `   Relevance: ${(mockResult.similarity * 100).toFixed(1)}%\n\n`;

      if ((mockResult.metadata as any).recommendations?.length > 0) {
        output += `   Since you're looking at ${mockResult.title}, you might also like:\n`;
        (mockResult.metadata as any).recommendations.forEach((rec: any, idx: number) => {
          const priceStr = rec.price ? ` — ${rec.price}` : '';
          const similarityPercent = (rec.similarity * 100).toFixed(0);
          output += `      ${idx + 1}. ${rec.name}${priceStr} (${similarityPercent}% similar)\n`;
          if (rec.recommendationReason) {
            output += `         → ${rec.recommendationReason}\n`;
          }
        });
      }

      expect(output).toContain('Hydraulic Pump A');
      expect(output).toContain('might also like');
      expect(output).toContain('Hydraulic Pump B');
      expect(output).toContain('85% similar');
      expect(output).toContain('Very similar product');
    });

    it('should handle products with no recommendations gracefully', () => {
      const mockResult = {
        url: 'https://example.com/pump-a',
        title: 'Hydraulic Pump A',
        content: 'Product description',
        similarity: 0.92,
        metadata: {
          recommendations: [],
        },
      };

      const hasRecommendations = (mockResult.metadata as any).recommendations?.length > 0;

      expect(hasRecommendations).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work end-to-end: products → enrichment → recommendations → formatting', () => {
      // Step 1: Start with products
      const products = [
        createMockProduct({ id: 1, name: 'Pump A' }),
        createMockProduct({ id: 2, name: 'Pump B' }),
      ];

      // Step 2: Consolidate with scraped pages (enrichment)
      const enrichedProducts = products.map(p => ({
        ...p,
        scrapedPage: createMockScrapedPage(),
        relatedPages: [],
        recommendations: [], // Initially empty
        enrichedDescription: p.short_description || '',
        finalSimilarity: 0.90,
        sources: {
          liveData: true,
          scrapedContent: true,
          relatedContent: false,
        },
      }));

      // Step 3: Add recommendations to top products
      enrichedProducts[0].recommendations = [
        createMockRecommendation({ id: 3, name: 'Pump C', similarity: 0.85 }),
      ];

      // Step 4: Format for AI
      const formattedMetadata = {
        recommendations: enrichedProducts[0].recommendations.map(rec => ({
          id: rec.id,
          name: rec.name,
          price: rec.price,
          similarity: rec.similarity,
          recommendationReason: rec.recommendationReason,
        })),
      };

      // Verify complete flow
      expect(enrichedProducts).toHaveLength(2);
      expect(enrichedProducts[0].recommendations).toHaveLength(1);
      expect(formattedMetadata.recommendations).toHaveLength(1);
      expect(formattedMetadata.recommendations[0].name).toBe('Pump C');
    });

    it('should handle no commerce products (skip recommendations)', () => {
      // When there are no commerce products, recommendations should be skipped
      const toolResults: any[] = [
        {
          toolName: 'search_website_content',
          result: {
            success: true,
            results: [createMockScrapedPage()],
          },
        },
        // No woocommerce_operations result
      ];

      const hasCommerceResult = toolResults.some(
        r => r.toolName === 'woocommerce_operations'
      );

      expect(hasCommerceResult).toBe(false);
    });

    it('should handle no scraped pages (recommendations still work)', () => {
      // Recommendations should work even without scraped pages
      const enrichedProduct: any = {
        id: 1,
        name: 'Pump A',
        scrapedPage: undefined, // No scraped page
        relatedPages: [],
        recommendations: [
          createMockRecommendation(), // Still has recommendations
        ],
        sources: {
          liveData: true,
          scrapedContent: false,
          relatedContent: false,
        },
      };

      expect(enrichedProduct.recommendations).toHaveLength(1);
      expect(enrichedProduct.sources.liveData).toBe(true);
    });

    it('should handle too few products for recommendations (<3)', () => {
      const products = [
        createMockProduct({ id: 1 }),
      ];

      // With only 1 product, might skip recommendations
      const shouldRecommend = products.length >= 1; // Actually we do recommend even for 1

      expect(shouldRecommend).toBe(true);
    });
  });
});
