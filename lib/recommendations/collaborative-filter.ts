/**
 * Collaborative Filtering Recommendations
 *
 * "Users who viewed/purchased X also viewed/purchased Y"
 * Uses user behavior patterns to recommend products.
 *
 * @module recommendations/collaborative-filter
 */

import { createClient } from '@/lib/supabase/server';
import { ProductRecommendation } from './engine';

export interface CollaborativeFilterRequest {
  sessionId?: string;
  userId?: string;
  domainId: string;
  limit: number;
  excludeProductIds?: string[];
  context?: any;
}

/**
 * Get recommendations using collaborative filtering
 */
export async function collaborativeFilterRecommendations(
  request: CollaborativeFilterRequest
): Promise<ProductRecommendation[]> {
  try {
    // Get user's interaction history
    const viewedProducts = await getUserViewedProducts(
      request.sessionId,
      request.userId,
      request.domainId
    );

    if (!viewedProducts.length) {
      return [];
    }

    // Find users with similar behavior
    const similarUsers = await findSimilarUsers(
      viewedProducts,
      request.domainId
    );

    // Get products those users interacted with
    const recommendations = await getProductsFromSimilarUsers(
      similarUsers,
      viewedProducts,
      request.limit,
      request.excludeProductIds
    );

    return recommendations;
  } catch (error) {
    console.error('[CollaborativeFilter] Error:', error);
    return [];
  }
}

/**
 * Get products user has viewed/clicked
 */
async function getUserViewedProducts(
  sessionId?: string,
  userId?: string,
  domainId?: string
): Promise<string[]> {
  const supabase = await createClient();

  try {
    const query = supabase
      .from('recommendation_events')
      .select('product_id, clicked, purchased')
      .or(`session_id.eq.${sessionId},user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;

    if (error || !data) return [];

    // Return unique product IDs, prioritizing clicked/purchased
    const products = new Set<string>();
    data
      .sort((a, b) => {
        const scoreA = a.purchased ? 3 : a.clicked ? 2 : 1;
        const scoreB = b.purchased ? 3 : b.clicked ? 2 : 1;
        return scoreB - scoreA;
      })
      .forEach((event) => products.add(event.product_id));

    return Array.from(products);
  } catch (error) {
    console.error('[CollaborativeFilter] Get viewed error:', error);
    return [];
  }
}

/**
 * Find users with similar product interactions
 */
async function findSimilarUsers(
  userProducts: string[],
  domainId: string
): Promise<Array<{ sessionId: string; similarity: number }>> {
  const supabase = await createClient();

  try {
    // Get all sessions that interacted with these products
    const { data: events, error } = await supabase
      .from('recommendation_events')
      .select('session_id, product_id, clicked, purchased')
      .in('product_id', userProducts)
      .not('session_id', 'is', null);

    if (error || !events) return [];

    // Calculate Jaccard similarity for each session
    const sessionProducts = new Map<string, Set<string>>();
    events.forEach((event) => {
      if (!sessionProducts.has(event.session_id)) {
        sessionProducts.set(event.session_id, new Set());
      }
      sessionProducts.get(event.session_id)!.add(event.product_id);
    });

    const userProductSet = new Set(userProducts);
    const similarities: Array<{ sessionId: string; similarity: number }> = [];

    sessionProducts.forEach((products, sessionId) => {
      const intersection = new Set(
        [...products].filter((p) => userProductSet.has(p))
      );
      const union = new Set([...userProductSet, ...products]);
      const similarity = intersection.size / union.size;

      if (similarity > 0.3) {
        // Minimum 30% similarity
        similarities.push({ sessionId, similarity });
      }
    });

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 20);
  } catch (error) {
    console.error('[CollaborativeFilter] Similar users error:', error);
    return [];
  }
}

/**
 * Get products from similar users
 */
async function getProductsFromSimilarUsers(
  similarUsers: Array<{ sessionId: string; similarity: number }>,
  excludeProducts: string[],
  limit: number,
  additionalExcludes?: string[]
): Promise<ProductRecommendation[]> {
  const supabase = await createClient();

  try {
    const sessionIds = similarUsers.map((u) => u.sessionId);

    const { data: events, error } = await supabase
      .from('recommendation_events')
      .select('product_id, clicked, purchased, session_id')
      .in('session_id', sessionIds)
      .not('product_id', 'in', `(${excludeProducts.join(',')})`);

    if (error || !events) return [];

    // Score products based on user similarity and engagement
    const productScores = new Map<string, number>();

    events.forEach((event) => {
      const user = similarUsers.find((u) => u.sessionId === event.session_id);
      if (!user) return;

      const engagementScore = event.purchased ? 3 : event.clicked ? 2 : 1;
      const score = user.similarity * engagementScore;

      const current = productScores.get(event.product_id) || 0;
      productScores.set(event.product_id, current + score);
    });

    // Filter additional excludes
    if (additionalExcludes) {
      additionalExcludes.forEach((id) => productScores.delete(id));
    }

    // Sort and return top recommendations
    const recommendations = Array.from(productScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId, score]) => ({
        productId,
        score: Math.min(score / 10, 1), // Normalize to 0-1
        algorithm: 'collaborative',
        reason: 'Users with similar interests also liked this',
        metadata: {
          rawScore: score,
          similarUserCount: similarUsers.length,
        },
      }));

    return recommendations;
  } catch (error) {
    console.error('[CollaborativeFilter] Get products error:', error);
    return [];
  }
}
