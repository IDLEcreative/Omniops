/**
 * Query Reformulator - Entity Extraction
 */

import { Entities } from './types';

/**
 * Extract key entities from a message
 */
export function extractEntities(message: string): Entities {
  const entities: Entities = {
    products: [],
    categories: [],
    specifications: [],
    useCases: []
  };

  // Product patterns
  const productPatterns = [
    /\b(tipper|dumper|trailer|pump|valve|motor|sheeting|flip|roller)\b/gi,
    /\b[A-Z]{2,}[\d-]+[A-Z]?\b/g, // SKU patterns
  ];

  // Category patterns
  const categoryPatterns = [
    /\b(agricultural?|farming?|construction|hydraulic|electric|manual)\b/gi,
    /\b(equipment|machinery|parts?|systems?|accessories)\b/gi,
  ];

  // Specification patterns
  const specPatterns = [
    /\b\d+\s*(mm|cm|m|kg|ton|hp|volt|amp|bar|psi|gpm|lpm)\b/gi,
    /\b(heavy[\s-]duty|light[\s-]weight|commercial|industrial)\b/gi,
  ];

  // Use case patterns
  const useCasePatterns = [
    /\b(for\s+[\w\s]+ing)\b/gi,
    /\b(used\s+for|suitable\s+for|designed\s+for)\s+[\w\s]+/gi,
  ];

  // Extract entities
  productPatterns.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) entities.products.push(...matches.map(m => m.toLowerCase()));
  });

  categoryPatterns.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) entities.categories.push(...matches.map(m => m.toLowerCase()));
  });

  specPatterns.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) entities.specifications.push(...matches.map(m => m.toLowerCase()));
  });

  useCasePatterns.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) entities.useCases.push(...matches.map(m => m.toLowerCase()));
  });

  // Deduplicate
  entities.products = [...new Set(entities.products)];
  entities.categories = [...new Set(entities.categories)];
  entities.specifications = [...new Set(entities.specifications)];
  entities.useCases = [...new Set(entities.useCases)];

  return entities;
}

/**
 * Merge entities from multiple messages
 */
export function mergeEntities(...entitySets: Entities[]): Entities {
  const merged: Entities = {
    products: [],
    categories: [],
    specifications: [],
    useCases: []
  };

  entitySets.forEach(entities => {
    merged.products.push(...entities.products);
    merged.categories.push(...entities.categories);
    merged.specifications.push(...entities.specifications);
    merged.useCases.push(...entities.useCases);
  });

  // Deduplicate
  merged.products = [...new Set(merged.products)];
  merged.categories = [...new Set(merged.categories)];
  merged.specifications = [...new Set(merged.specifications)];
  merged.useCases = [...new Set(merged.useCases)];

  return merged;
}
