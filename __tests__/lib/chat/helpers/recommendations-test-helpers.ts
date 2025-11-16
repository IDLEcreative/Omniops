/**
 * Recommendations Test Helpers
 *
 * Shared utilities for testing product recommendations functionality
 */

import type { CommerceProduct, RecommendedProduct } from '@/lib/search/result-consolidator';
import type { SearchResult } from '@/types';

/**
 * Creates a mock commerce product for testing
 */
export const createMockProduct = (overrides: Partial<CommerceProduct> = {}): CommerceProduct => ({
  id: 1,
  name: 'Hydraulic Pump A4VTG90',
  price: '450.00',
  categories: [{ name: 'Hydraulic Pumps', slug: 'hydraulic-pumps' }],
  short_description: 'Industrial hydraulic pump',
  permalink: 'https://example.com/pump-a',
  ...overrides,
});

/**
 * Creates a mock scraped page for testing
 */
export const createMockScrapedPage = (overrides: Partial<SearchResult> = {}): SearchResult => ({
  url: 'https://example.com/pump-a',
  title: 'Hydraulic Pump Details',
  content: 'Technical specifications for pump',
  similarity: 0.88,
  ...overrides,
});

/**
 * Creates a mock recommended product
 */
export const createMockRecommendation = (overrides: Partial<RecommendedProduct> = {}): RecommendedProduct => ({
  id: 2,
  name: 'Hydraulic Pump B',
  price: '420.00',
  similarity: 0.85,
  recommendationReason: 'Very similar product',
  categories: [{ name: 'Hydraulic Pumps', slug: 'hydraulic-pumps' }],
  ...overrides,
});

/**
 * Creates an enriched product with recommendations for testing
 */
export const createEnrichedProduct = (options: {
  id: number;
  name: string;
  price?: string;
  recommendations?: RecommendedProduct[];
  scrapedPage?: SearchResult;
  relatedPages?: SearchResult[];
  sources?: {
    liveData: boolean;
    scrapedContent: boolean;
    relatedContent: boolean;
  };
}) => ({
  id: options.id,
  name: options.name,
  price: options.price || '450.00',
  scrapedPage: options.scrapedPage || createMockScrapedPage(),
  relatedPages: options.relatedPages || [],
  recommendations: options.recommendations || [],
  enrichedDescription: 'Description',
  finalSimilarity: 0.90,
  sources: options.sources || {
    liveData: true,
    scrapedContent: true,
    relatedContent: false,
  },
});

/**
 * Formats a recommendation for testing output
 */
export const formatRecommendation = (rec: {
  name: string;
  price?: string;
  similarity: number;
  recommendationReason?: string;
}, index: number): string => {
  const priceStr = rec.price ? ` — ${rec.price}` : '';
  const similarityPercent = (rec.similarity * 100).toFixed(0);
  let formatted = `   ${index + 1}. ${rec.name}${priceStr} (${similarityPercent}% similar)`;

  if (rec.recommendationReason) {
    formatted += `\n      → ${rec.recommendationReason}`;
  }

  return formatted;
};

/**
 * Validates recommendation metadata structure
 */
export const validateRecommendationMetadata = (metadata: any): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!metadata.recommendations) {
    errors.push('Missing recommendations array');
  } else if (!Array.isArray(metadata.recommendations)) {
    errors.push('Recommendations is not an array');
  } else {
    metadata.recommendations.forEach((rec: any, idx: number) => {
      if (!rec.id) errors.push(`Recommendation ${idx}: Missing id`);
      if (!rec.name) errors.push(`Recommendation ${idx}: Missing name`);
      if (typeof rec.similarity !== 'number') {
        errors.push(`Recommendation ${idx}: Missing or invalid similarity`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
