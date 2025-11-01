/**
 * Pattern Learner - Type Definitions
 */

export interface ExtractedPattern {
  selector: string;
  attribute?: string;
  fieldType: 'name' | 'price' | 'image' | 'availability' | 'sku' | 'description' | 'variant' | 'specification';
  confidence: number;
  sampleValue?: string;
  extractionMethod: 'json-ld' | 'microdata' | 'dom' | 'regex';
}

export interface DomainPatterns {
  domain: string;
  platform?: string;
  patterns: ExtractedPattern[];
  productListSelectors?: string[];
  paginationSelectors?: {
    next?: string;
    total?: string;
    current?: string;
  };
  lastUpdated: string;
  successRate: number;
  totalExtractions: number;
}
