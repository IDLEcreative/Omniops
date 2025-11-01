/**
 * Query Enhancement Processors
 */

import {
  COMPILED_PATTERNS,
  MAX_EXPANDED_TERMS,
  MAX_SYNONYMS,
  MAX_RELATED_QUERIES,
  SYNONYM_MAP,
  REVERSE_SYNONYMS,
  BRANDS,
  PRODUCTS,
  ISSUES,
  ACTIONS
} from './constants';
import { QueryIntent, EnhancedQuery } from './types';

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(COMPILED_PATTERNS.cleanup, ' ')
    .replace(COMPILED_PATTERNS.whitespace, ' ')
    .trim();
}

export function detectIntent(query: string): QueryIntent {
  const q = query.toLowerCase();

  // Fast intent detection with early returns
  if (/^(what|how|why|when|where|who|which)/i.test(q)) return 'informational';
  if (/\b(buy|purchase|order|price|cost|\$|£|€)/i.test(q)) return 'transactional';
  if (/\b(problem|issue|error|broken|fix|repair)/i.test(q)) return 'troubleshooting';
  if (/\b(vs|versus|compare|comparison|better|best)/i.test(q)) return 'comparison';
  if (/\b(contact|support|about|home|login)/i.test(q)) return 'navigational';

  return 'informational';
}

export function expandQuery(query: string): string[] {
  const words = query.split(' ');
  const expanded = new Set<string>();
  let count = 0;

  for (const word of words) {
    if (count >= MAX_EXPANDED_TERMS) break;

    expanded.add(word);
    count++;

    // Limited variations
    if (count < MAX_EXPANDED_TERMS) {
      if (COMPILED_PATTERNS.plural.test(word)) {
        expanded.add(word.slice(0, -1));
        count++;
      } else if (word.length > 3) {
        expanded.add(word + 's');
        count++;
      }
    }

    // Part number variations (limited)
    if (count < MAX_EXPANDED_TERMS && COMPILED_PATTERNS.alphaNum.test(word)) {
      const match = word.match(COMPILED_PATTERNS.alphaNumSplit);
      if (match) {
        expanded.add(`${match[1]}-${match[2]}`);
        count++;
      }
    }
  }

  return Array.from(expanded).slice(0, MAX_EXPANDED_TERMS);
}

export function findSynonyms(query: string): Map<string, string[]> {
  const synonyms = new Map<string, string[]>();
  const words = query.split(' ');
  let synonymCount = 0;

  for (const word of words) {
    if (synonymCount >= MAX_SYNONYMS) break;

    // Check direct match
    const directSyns = SYNONYM_MAP.get(word);
    if (directSyns) {
      synonyms.set(word, directSyns.slice(0, 3)); // Limit to 3 synonyms per word
      synonymCount += 3;
      continue;
    }

    // Check reverse lookup (limited)
    const reverseKey = REVERSE_SYNONYMS.get(word);
    if (reverseKey && synonymCount < MAX_SYNONYMS) {
      const syns = SYNONYM_MAP.get(reverseKey);
      if (syns) {
        synonyms.set(word, [reverseKey, ...syns.filter(s => s !== word).slice(0, 2)]);
        synonymCount += 3;
      }
    }
  }

  return synonyms;
}

export function extractEntities(query: string): EnhancedQuery['entities'] {
  const entities: EnhancedQuery['entities'] = {
    products: [],
    brands: [],
    skus: [],
    issues: [],
    actions: []
  };

  // SKU extraction (limited to 5)
  const skuMatches = query.match(COMPILED_PATTERNS.sku);
  if (skuMatches) {
    entities.skus = skuMatches.slice(0, 5).map(s => s.toUpperCase());
  }

  // Fast entity extraction using Sets
  const words = query.split(' ');
  for (const word of words) {
    const lower = word.toLowerCase();

    if (BRANDS.has(lower) && entities.brands.length < 3) {
      entities.brands.push(lower.charAt(0).toUpperCase() + lower.slice(1));
    }
    if (PRODUCTS.has(lower) && entities.products.length < 5) {
      entities.products.push(lower);
    }
    if (ISSUES.has(lower) && entities.issues.length < 3) {
      entities.issues.push(lower);
    }
    if (ACTIONS.has(lower) && entities.actions.length < 3) {
      entities.actions.push(lower);
    }
  }

  return entities;
}

export function correctSpelling(query: string): Map<string, string> {
  // Simplified spelling correction - could be enhanced with a proper dictionary
  const corrections = new Map<string, string>();
  const commonTypos: Record<string, string> = {
    'moter': 'motor',
    'engin': 'engine',
    'waranty': 'warranty',
    'instalation': 'installation',
    'replacment': 'replacement'
  };

  const words = query.split(' ');
  for (const word of words) {
    if (commonTypos[word]) {
      corrections.set(word, commonTypos[word]);
    }
  }

  return corrections;
}

export function generateRelatedQueries(query: string, intent: QueryIntent): string[] {
  const related: string[] = [];

  // Limit to 3 related queries
  switch (intent) {
    case 'troubleshooting':
      related.push(`how to fix ${query}`.slice(0, 50));
      break;
    case 'transactional':
      related.push(`${query} price`.slice(0, 50));
      break;
    case 'informational':
      related.push(`${query} guide`.slice(0, 50));
      break;
  }

  return related.slice(0, MAX_RELATED_QUERIES);
}

export function calculateConfidence(query: string, entities: EnhancedQuery['entities']): number {
  let score = 0.5;

  // Simplified scoring
  if (entities.skus.length > 0) score += 0.2;
  if (entities.brands.length > 0) score += 0.1;
  if (entities.products.length > 0) score += 0.1;
  if (query.split(' ').length >= 3) score += 0.1;

  return Math.min(score, 1.0);
}
