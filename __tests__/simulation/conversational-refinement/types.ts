/**
 * Type definitions for conversational refinement simulation
 */

export interface MockProduct {
  id: string;
  name: string;
  price: number;
  stock_status: 'instock' | 'onbackorder' | 'outofstock';
  categories: string[];
  similarity_score: number;
  rankingScore?: number;
  rankingSignals?: {
    semanticSimilarity: number;
    stockAvailability: number;
    priceMatch: number;
    popularity?: number;
    recency?: number;
  };
  rankingExplanation?: string;
}
