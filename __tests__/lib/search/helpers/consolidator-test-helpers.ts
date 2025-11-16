/**
 * Test Helpers for Result Consolidator Tests
 *
 * Shared mock generators for testing result consolidation
 */

import type { SearchResult } from '@/lib/embeddings-functions';
import type { CommerceProduct } from '@/lib/search/result-consolidator';

/**
 * Create a mock commerce product with default values
 */
export const createMockProduct = (overrides: Partial<CommerceProduct> = {}): CommerceProduct => ({
  id: 1,
  name: 'Hydraulic Pump A4VTG90',
  slug: 'hydraulic-pump-a4vtg90',
  permalink: 'https://example.com/products/hydraulic-pump-a4vtg90',
  price: '2499.99',
  stock_status: 'instock',
  short_description: 'Industrial hydraulic pump',
  description: 'High-performance hydraulic pump for industrial applications',
  similarity: 0.92,
  ...overrides,
});

/**
 * Create a mock scraped page with default values
 */
export const createMockScrapedPage = (overrides: Partial<SearchResult> = {}): SearchResult => ({
  url: 'https://example.com/products/hydraulic-pump-a4vtg90',
  title: 'Hydraulic Pump A4VTG90 - Product Details',
  content: 'Detailed specifications and installation guide for the A4VTG90 pump model.',
  similarity: 0.88,
  ...overrides,
});
