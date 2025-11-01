/**
 * Query Enhancer - Type Definitions
 */

export type QueryIntent = 'informational' | 'transactional' | 'navigational' | 'troubleshooting' | 'comparison';

export interface EnhancedQuery {
  original: string;
  normalized: string;
  intent: QueryIntent;
  expanded_terms: string[];
  synonyms: Map<string, string[]>;
  entities: {
    products: string[];
    brands: string[];
    skus: string[];
    issues: string[];
    actions: string[];
  };
  spelling_corrections: Map<string, string>;
  related_queries: string[];
  confidence_score: number;
}
