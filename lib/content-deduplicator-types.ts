// Core interfaces and types for content deduplication

export interface ContentHash {
  hash: string;
  content: string;
  type: 'navigation' | 'footer' | 'sidebar' | 'header' | 'unique';
  frequency: number;
  pages: string[]; // URLs where this content appears
  size: number;
  compressedSize?: number;
  similarity?: number;
}

export interface DeduplicatedStorage {
  commonElements: Map<string, ContentHash>;
  uniqueContent: Map<string, string>;
  references: Map<string, string[]>; // page -> element IDs
}

export interface Pattern {
  id: string;
  template: string;
  frequency: number;
  variations: string[];
  pages: string[];
}

export interface DeduplicationMetrics {
  totalPages: number;
  uniqueContent: number;
  duplicateContent: number;
  storageReduction: number; // percentage
  commonPatterns: Pattern[];
  compressionRatio: number;
  processingTime: number;
}

export interface SimilarityResult {
  hash: string;
  similarity: number;
  type: 'exact' | 'near-duplicate' | 'template-variation';
}

export interface ProcessingOptions {
  similarityThreshold: number;
  enableCompression: boolean;
  batchSize: number;
  useRedis: boolean;
  detectTemplates: boolean;
}
