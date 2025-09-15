/**
 * Type declarations for the query-enhancer.js module
 */

export interface EnhancedQueryResult {
  original: string;
  normalized: string;
  expanded: string;
  synonyms: any[];
  suggestedTerms: string[];
  confidence: number;
  enhancements: any[];
}

export class QueryEnhancer {
  constructor();
  enhanceQuery(originalQuery: string, domain?: string, supabase?: any): Promise<EnhancedQueryResult>;
  getDomainPatterns(domain: string, supabase: any): Promise<any>;
  applyLearnedSynonyms(query: string, synonyms: any): Promise<any[]>;
  applyLearnedPatterns(query: string, patterns: any): Promise<string[]>;
  extractQueryFeatures(query: string): any;
  suggestQueryImprovements(query: string, domainPatterns?: any): any[];
}