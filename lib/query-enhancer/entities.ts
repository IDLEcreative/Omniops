/**
 * Entity Extraction
 * Extracts products, brands, SKUs, issues, and actions from queries
 */

import type { EnhancedQuery } from './types';

/**
 * Extract entities from query
 * Identifies SKUs, brands, products, issues, and actions
 */
export function extractEntities(query: string): EnhancedQuery['entities'] {
  const entities: EnhancedQuery['entities'] = {
    products: [],
    brands: [],
    skus: [],
    issues: [],
    actions: []
  };

  // SKU patterns (e.g., AB-123, XYZ456)
  const skuPattern = /\b([A-Z]{2,}[\-\/]?[\d]{2,}[\w\-]*)\b/gi;
  const skuMatches = query.match(skuPattern);
  if (skuMatches) {
    entities.skus = skuMatches.map(s => s.toUpperCase());
  }

  // Common brands (generic examples)
  const brands = ['samsung', 'apple', 'sony', 'lg', 'bosch'];
  for (const brand of brands) {
    if (query.includes(brand)) {
      entities.brands.push(brand.charAt(0).toUpperCase() + brand.slice(1));
    }
  }

  // Product types (generic examples)
  const products = ['device', 'equipment', 'battery', 'filter', 'item', 'sensor', 'accessory'];
  for (const product of products) {
    if (query.includes(product)) {
      entities.products.push(product);
    }
  }

  // Common issues
  const issues = ['broken', 'not working', 'failed', 'error', 'problem', 'issue', 'damaged', 'worn'];
  for (const issue of issues) {
    if (query.includes(issue)) {
      entities.issues.push(issue);
    }
  }

  // Actions
  const actions = ['install', 'replace', 'repair', 'fix', 'troubleshoot', 'maintain', 'upgrade'];
  for (const action of actions) {
    if (query.includes(action)) {
      entities.actions.push(action);
    }
  }

  return entities;
}
