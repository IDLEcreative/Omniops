/**
 * Hybrid Recommendation Ranker
 *
 * Combines multiple recommendation algorithms with weighted scoring
 * to produce the best overall recommendations.
 *
 * @module recommendations/hybrid-ranker
 */

import { ProductRecommendation } from './engine';
import { vectorSimilarityRecommendations } from './vector-similarity';
import { collaborativeFilterRecommendations } from './collaborative-filter';
import { contentBasedRecommendations } from './content-filter';

export interface HybridRankerRequest {
  sessionId?: string;
  userId?: string;
  domainId: string;
  productIds?: string[];
  categories?: string[];
  tags?: string[];
  limit: number;
  excludeProductIds?: string[];
  context?: any;
}

interface AlgorithmWeight {
  vector: number;
  collaborative: number;
  content: number;
}

// Default algorithm weights (can be customized per domain)
const DEFAULT_WEIGHTS: AlgorithmWeight = {
  vector: 0.5, // 50% - Semantic similarity
  collaborative: 0.3, // 30% - User behavior
  content: 0.2, // 20% - Product attributes
};

/**
 * Get recommendations using hybrid algorithm
 */
export async function hybridRanker(
  request: HybridRankerRequest
): Promise<ProductRecommendation[]> {
  try {
    // Run all algorithms in parallel
    const [vectorResults, collaborativeResults, contentResults] =
      await Promise.all([
        vectorSimilarityRecommendations({
          domainId: request.domainId,
          productIds: request.productIds,
          context: request.context,
          limit: request.limit * 2, // Get more for better mixing
          excludeProductIds: request.excludeProductIds,
        }),
        collaborativeFilterRecommendations({
          sessionId: request.sessionId,
          userId: request.userId,
          domainId: request.domainId,
          limit: request.limit * 2,
          excludeProductIds: request.excludeProductIds,
          context: request.context,
        }),
        contentBasedRecommendations({
          domainId: request.domainId,
          productIds: request.productIds,
          categories: request.categories,
          tags: request.tags,
          limit: request.limit * 2,
          excludeProductIds: request.excludeProductIds,
          context: request.context,
        }),
      ]);

    // Combine and rank results
    const combined = combineResults(
      vectorResults,
      collaborativeResults,
      contentResults,
      DEFAULT_WEIGHTS
    );

    // Apply diversity filtering
    const diversified = diversifyRecommendations(combined);

    // Return top N
    return diversified.slice(0, request.limit);
  } catch (error) {
    console.error('[HybridRanker] Error:', error);
    return [];
  }
}

/**
 * Combine results from multiple algorithms
 */
function combineResults(
  vectorResults: ProductRecommendation[],
  collaborativeResults: ProductRecommendation[],
  contentResults: ProductRecommendation[],
  weights: AlgorithmWeight
): ProductRecommendation[] {
  // Map to accumulate scores per product
  const productScores = new Map<string, {
    totalScore: number;
    algorithms: string[];
    details: Map<string, number>;
  }>();

  // Add vector similarity scores
  vectorResults.forEach((rec) => {
    const entry = productScores.get(rec.productId) || {
      totalScore: 0,
      algorithms: [],
      details: new Map(),
    };
    entry.totalScore += rec.score * weights.vector;
    entry.algorithms.push('vector');
    entry.details.set('vector', rec.score);
    productScores.set(rec.productId, entry);
  });

  // Add collaborative filtering scores
  collaborativeResults.forEach((rec) => {
    const entry = productScores.get(rec.productId) || {
      totalScore: 0,
      algorithms: [],
      details: new Map(),
    };
    entry.totalScore += rec.score * weights.collaborative;
    entry.algorithms.push('collaborative');
    entry.details.set('collaborative', rec.score);
    productScores.set(rec.productId, entry);
  });

  // Add content-based scores
  contentResults.forEach((rec) => {
    const entry = productScores.get(rec.productId) || {
      totalScore: 0,
      algorithms: [],
      details: new Map(),
    };
    entry.totalScore += rec.score * weights.content;
    entry.algorithms.push('content');
    entry.details.set('content', rec.score);
    productScores.set(rec.productId, entry);
  });

  // Convert to recommendations array
  const recommendations: ProductRecommendation[] = [];

  productScores.forEach((data, productId) => {
    // Boost score if multiple algorithms agree
    const algorithmBonus = data.algorithms.length > 1 ? 0.1 : 0;
    const finalScore = Math.min(data.totalScore + algorithmBonus, 1);

    recommendations.push({
      productId,
      score: finalScore,
      algorithm: 'hybrid',
      reason: buildHybridReason(data.algorithms),
      metadata: {
        algorithms: data.algorithms,
        scores: Object.fromEntries(data.details),
        algorithmCount: data.algorithms.length,
      },
    });
  });

  // Sort by score descending
  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Diversify recommendations to avoid too much similarity
 */
function diversifyRecommendations(
  recommendations: ProductRecommendation[]
): ProductRecommendation[] {
  if (recommendations.length <= 5) return recommendations;

  const diversified: ProductRecommendation[] = [];
  const usedAlgorithms = new Set<string>();

  // First pass: Pick top recommendations ensuring algorithm diversity
  for (const rec of recommendations) {
    const primaryAlgorithm = rec.metadata?.algorithms?.[0];

    if (diversified.length < 3) {
      // First 3 are always top scores
      diversified.push(rec);
      if (primaryAlgorithm) usedAlgorithms.add(primaryAlgorithm);
    } else {
      // After first 3, prefer recommendations from underrepresented algorithms
      const isDiverse =
        !primaryAlgorithm || !usedAlgorithms.has(primaryAlgorithm);

      if (isDiverse) {
        diversified.push(rec);
        if (primaryAlgorithm) usedAlgorithms.add(primaryAlgorithm);
      }
    }

    if (diversified.length >= recommendations.length) break;
  }

  // Fill remaining slots with highest scores
  const remaining = recommendations.filter(
    (rec) => !diversified.includes(rec)
  );
  diversified.push(...remaining);

  return diversified;
}

/**
 * Build human-readable reason from algorithms
 */
function buildHybridReason(algorithms: string[]): string {
  const unique = Array.from(new Set(algorithms));

  if (unique.length === 3) {
    return 'Highly recommended based on multiple factors';
  } else if (unique.length === 2) {
    return `Recommended based on ${unique.join(' and ')} analysis`;
  } else if (unique.includes('vector')) {
    return 'Semantically similar to your interests';
  } else if (unique.includes('collaborative')) {
    return 'Popular among similar users';
  } else if (unique.includes('content')) {
    return 'Similar product attributes';
  }

  return 'Recommended for you';
}
