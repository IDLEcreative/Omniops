/**
 * Search Application
 * Applies query enhancement to search operations
 */

import type { EnhancedQuery } from './types';

/**
 * Apply query enhancement to search
 * Converts enhanced query into search terms, boost fields, and filters
 */
export function applyToSearch(enhanced: EnhancedQuery): {
  searchTerms: string[];
  boostFields: Record<string, number>;
  filters: Record<string, any>;
} {
  const searchTerms = [
    enhanced.normalized,
    ...enhanced.expanded_terms.slice(0, 5),
    ...Array.from(enhanced.synonyms.values()).flat().slice(0, 5)
  ];

  const boostFields: Record<string, number> = {
    exact_match: 2.0,
    sku_match: enhanced.entities.skus.length > 0 ? 1.8 : 1.0,
    title_match: 1.5,
    content_match: 1.0
  };

  const filters: Record<string, any> = {};

  // Add intent-based filters
  switch (enhanced.intent) {
    case 'transactional':
      filters.content_types = ['product'];
      filters.availability = ['in_stock'];
      break;
    case 'troubleshooting':
      filters.content_types = ['faq', 'documentation', 'support'];
      break;
    case 'informational':
      filters.content_types = ['documentation', 'blog', 'general'];
      break;
  }

  return { searchTerms, boostFields, filters };
}
