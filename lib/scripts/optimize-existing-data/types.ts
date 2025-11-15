export interface MigrationConfig {
  batchSize: number;
  dryRun: boolean;
  startFrom?: string;
  maxPages?: number;
  outputDir: string;
  reportInterval: number;
  optimizationLevel: 'basic' | 'standard' | 'advanced';
  preserveOriginal: boolean;
}

export interface MigrationProgress {
  totalPages: number;
  processedPages: number;
  successfulOptimizations: number;
  failedOptimizations: number;
  totalOriginalTokens: number;
  totalOptimizedTokens: number;
  averageReduction: number;
  startTime: Date;
  errors: Array<{ url: string; error: string }>;
}

export interface OptimizationResult {
  url: string;
  success: boolean;
  originalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;
  semanticChunks: number;
  metadataGenerated: boolean;
  deduplicationApplied: boolean;
  processingTime: number;
  error?: string;
}
