/**
 * Multi-Signal Result Ranking
 * Combines multiple signals to rank search results intelligently
 */

import type { CommerceProduct } from '@/types/supabase/commerce';
import type { SearchResult } from '@/types/supabase/search';

export interface RankingSignal {
  semanticSimilarity: number;    // 0-1 from embeddings
  keywordMatch: number;          // 0-1 from WooCommerce search rank
  priceMatch: number;            // 0-1 if within user's budget
  stockAvailability: number;     // 1 if in stock, 0.5 backorder, 0 out
  popularity: number;            // 0-1 based on sales/views
  recency: number;               // 0-1 newer = higher
}

export interface RankingWeights {
  semanticSimilarity: number;    // default: 0.40
  keywordMatch: number;          // default: 0.25
  stockAvailability: number;     // default: 0.20
  priceMatch: number;            // default: 0.10
  popularity: number;            // default: 0.03
  recency: number;               // default: 0.02
}

export interface RankedProduct extends CommerceProduct {
  finalScore: number;
  rankingSignals: RankingSignal;
  rankingExplanation: string;
  // Optional enrichment properties (from EnrichedProduct)
  scrapedPage?: SearchResult;
  relatedPages?: SearchResult[];
  recommendations?: Array<CommerceProduct & { similarity: number; recommendationReason: string }>;
  enrichedDescription?: string;
  sources?: string[];
}

const DEFAULT_WEIGHTS: RankingWeights = {
  semanticSimilarity: 0.40,  // Most important - semantic match
  keywordMatch: 0.25,        // Still important - keyword relevance
  stockAvailability: 0.20,   // In-stock preferred
  priceMatch: 0.10,          // Budget consideration
  popularity: 0.03,          // Social proof
  recency: 0.02              // Freshness
};

/**
 * Calculate final ranking score using weighted signals
 */
export function calculateFinalScore(
  signals: RankingSignal,
  weights: RankingWeights = DEFAULT_WEIGHTS
): number {
  return (
    signals.semanticSimilarity * weights.semanticSimilarity +
    signals.keywordMatch * weights.keywordMatch +
    signals.stockAvailability * weights.stockAvailability +
    signals.priceMatch * weights.priceMatch +
    signals.popularity * weights.popularity +
    signals.recency * weights.recency
  );
}

/**
 * Calculate stock availability signal
 */
export function calculateStockSignal(product: CommerceProduct): number {
  if (!product.stock_status) return 0.5; // Unknown = moderate

  switch (product.stock_status.toLowerCase()) {
    case 'instock':
    case 'in stock':
      return 1.0;
    case 'onbackorder':
    case 'on backorder':
    case 'backorder':
      return 0.5;
    case 'outofstock':
    case 'out of stock':
    case 'out-of-stock':
      return 0.0;
    default:
      return 0.5;
  }
}

/**
 * Calculate price match signal based on budget
 * Returns 1.0 if within budget, decreases as price exceeds budget
 */
export function calculatePriceSignal(
  productPrice: number | null,
  userBudget?: number
): number {
  if (!productPrice) return 0.5; // Unknown price = moderate score
  if (!userBudget) return 1.0; // No budget constraint = perfect score

  if (productPrice <= userBudget) {
    return 1.0; // Within budget
  }

  // Gradually decrease score as price exceeds budget
  const overBudgetRatio = (productPrice - userBudget) / userBudget;
  if (overBudgetRatio > 1.0) {
    return 0.0; // More than 2x budget = zero score
  }

  return 1.0 - overBudgetRatio; // Linear decrease
}

/**
 * Calculate popularity signal based on total sales
 * Uses logarithmic scaling to prevent outliers from dominating
 */
export function calculatePopularitySignal(totalSales: number = 0): number {
  if (totalSales <= 0) return 0.1; // No sales data = low score

  // Logarithmic scale: 1 sale = 0.3, 10 sales = 0.5, 100 sales = 0.7, 1000+ sales = 1.0
  const logSales = Math.log10(totalSales + 1);
  const score = Math.min(logSales / 3, 1.0); // Cap at 1.0

  return Math.max(score, 0.1); // Minimum 0.1
}

/**
 * Calculate recency signal based on creation/modified date
 * Products created/updated in last 30 days = 1.0, older = decreasing score
 */
export function calculateRecencySignal(
  dateCreated?: string | Date,
  dateModified?: string | Date
): number {
  const relevantDate = dateModified || dateCreated;
  if (!relevantDate) return 0.5; // Unknown = moderate

  const date = typeof relevantDate === 'string' ? new Date(relevantDate) : relevantDate;
  const now = new Date();
  const ageInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays < 30) return 1.0; // Less than 30 days = fresh
  if (ageInDays < 90) return 0.8; // 1-3 months = recent
  if (ageInDays < 180) return 0.6; // 3-6 months = moderate
  if (ageInDays < 365) return 0.4; // 6-12 months = older
  return 0.2; // More than 1 year = stale
}

/**
 * Generate human-readable ranking explanation
 */
export function generateRankingExplanation(
  signals: RankingSignal,
  finalScore: number
): string {
  const explanations: string[] = [];

  // Semantic similarity
  if (signals.semanticSimilarity > 0.9) {
    explanations.push('Excellent semantic match');
  } else if (signals.semanticSimilarity > 0.7) {
    explanations.push('Good semantic match');
  }

  // Stock availability
  if (signals.stockAvailability === 1.0) {
    explanations.push('In stock');
  } else if (signals.stockAvailability === 0.5) {
    explanations.push('Available on backorder');
  } else if (signals.stockAvailability === 0.0) {
    explanations.push('Currently out of stock');
  }

  // Price match
  if (signals.priceMatch === 1.0) {
    explanations.push('Within budget');
  } else if (signals.priceMatch < 0.5) {
    explanations.push('Above budget');
  }

  // Popularity
  if (signals.popularity > 0.7) {
    explanations.push('Popular choice');
  }

  // Recency
  if (signals.recency > 0.8) {
    explanations.push('Recently added/updated');
  }

  return explanations.join(', ') || 'Relevant result';
}

/**
 * Rank products using multi-signal algorithm
 */
export function rankProducts(
  products: CommerceProduct[],
  options: {
    userBudget?: number;
    weights?: Partial<RankingWeights>;
  } = {}
): RankedProduct[] {
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights };

  return products
    .map((product) => {
      // Calculate all signals
      const signals: RankingSignal = {
        semanticSimilarity: product.similarity || 0.5,
        keywordMatch: product.relevance || 0.5,
        stockAvailability: calculateStockSignal(product),
        priceMatch: calculatePriceSignal(
          product.price ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : null,
          options.userBudget
        ),
        popularity: calculatePopularitySignal(product.total_sales),
        recency: calculateRecencySignal(product.date_created, product.date_modified)
      };

      // Calculate final score
      const finalScore = calculateFinalScore(signals, weights);

      // Generate explanation
      const rankingExplanation = generateRankingExplanation(signals, finalScore);

      return {
        ...product,
        finalScore,
        rankingSignals: signals,
        rankingExplanation
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore); // Highest score first
}

/**
 * Extract budget from user query using simple pattern matching
 * Examples: "under £100", "less than $50", "budget of 200", "around €75"
 */
export function extractBudgetFromQuery(query: string): number | undefined {
  const budgetPatterns = [
    /under\s*[£$€]?\s*(\d+(?:\.\d+)?)/i,
    /less\s*than\s*[£$€]?\s*(\d+(?:\.\d+)?)/i,
    /budget\s*(?:of)?\s*[£$€]?\s*(\d+(?:\.\d+)?)/i,
    /around\s*[£$€]?\s*(\d+(?:\.\d+)?)/i,
    /up\s*to\s*[£$€]?\s*(\d+(?:\.\d+)?)/i,
    /max(?:imum)?\s*[£$€]?\s*(\d+(?:\.\d+)?)/i
  ];

  for (const pattern of budgetPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }

  return undefined;
}
