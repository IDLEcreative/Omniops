export interface TestQuery {
  name: string;
  query: string;
  expectedType: 'product' | 'navigation' | 'general';
  description: string;
}

export interface ChunkAnalysis {
  query: string;
  resultsCount: number;
  avgSimilarity: number;
  chunkTypes: Record<string, number>;
  topResults: Array<{
    similarity: number;
    title: string;
    url: string;
    contentPreview: string;
    chunkLength: number;
  }>;
}
