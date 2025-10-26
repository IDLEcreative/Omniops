/**
 * Request validation schemas for product search
 */

import { z } from 'zod';

export const searchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  domain: z.string().optional(),
  filters: z.object({
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    inStock: z.boolean().optional(),
    brand: z.string().optional(),
    category: z.string().optional()
  }).optional(),
  limit: z.number().min(1).max(100).default(20),
  includeOutOfStock: z.boolean().default(false),
  searchMode: z.enum(['fast', 'comprehensive', 'auto']).default('auto')
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

/**
 * Simple query classification based on patterns
 */
export function classifyQuery(query: string) {
  const lower = query.toLowerCase();
  const skuPattern = /\b[A-Z0-9]{2,}[-\/][A-Z0-9]+\b/i;
  const standaloneSkuPattern = /\b[A-Z]{1,3}\d{6,}\b/;

  const hasSKU = skuPattern.test(query) || standaloneSkuPattern.test(query);
  const hasPrice = /\b(price|cost|cheap|expensive|under|below|above|over|\$\d+)\b/i.test(lower);
  const hasAvailability = /\b(in stock|available|availability)\b/i.test(lower);
  const hasBrand = /\b(samsung|whirlpool|lg|ge|bosch)\b/i.test(lower);

  let route = 'semantic_search';
  let type = 'general_search';

  if (hasSKU) {
    route = 'sql_direct';
    type = 'sku_lookup';
  } else if (hasPrice || hasAvailability) {
    route = 'hybrid_search';
    type = hasPrice ? 'price_query' : 'availability_query';
  }

  return {
    type,
    route,
    confidence: hasSKU ? 0.9 : 0.7,
    sku: hasSKU ? (query.match(skuPattern) || query.match(standaloneSkuPattern))?.[0] : null,
    priceIntent: hasPrice,
    availabilityIntent: hasAvailability,
    brand: hasBrand ? (query.match(/\b(samsung|whirlpool|lg|ge|bosch)\b/i))?.[0] : null
  };
}

/**
 * Calculate improvement percentage based on search time
 */
export function calculateImprovement(queryType: string, searchTime: number): string {
  const baselineTimes: Record<string, number> = {
    'sku_lookup': 2000,
    'shopping_query': 1500,
    'price_query': 1200,
    'availability_query': 1200,
    'general_search': 1000
  };

  const baseline = baselineTimes[queryType] || 1000;
  const improvement = ((baseline - searchTime) / baseline) * 100;

  return `${improvement.toFixed(1)}% faster`;
}
