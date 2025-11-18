/**
 * Product Recommendation Engine
 *
 * Orchestrates multiple recommendation algorithms to provide
 * personalized product suggestions based on:
 * - Chat conversation context
 * - User behavior and history
 * - Product similarity (vector embeddings)
 * - Collaborative filtering
 *
 * @module recommendations/engine
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@/lib/supabase/server';
import { vectorSimilarityRecommendations } from './vector-similarity';
import { collaborativeFilterRecommendations } from './collaborative-filter';
import { contentBasedRecommendations } from './content-filter';
import { hybridRanker } from './hybrid-ranker';
import { analyzeContext } from './context-analyzer';

export interface RecommendationRequest {
  sessionId?: string;
  conversationId?: string;
  domainId: string;
  userId?: string;
  limit?: number;
  algorithm?: 'collaborative' | 'content_based' | 'hybrid' | 'vector_similarity';
  context?: string; // Chat message context
  excludeProductIds?: string[];
  supabaseClient?: SupabaseClient; // Optional for dependency injection (testing)
}

export interface ProductRecommendation {
  productId: string;
  score: number;
  algorithm: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RecommendationResult {
  recommendations: ProductRecommendation[];
  algorithm: string;
  executionTime: number;
  context?: {
    detectedIntent?: string;
    mentionedProducts?: string[];
    categories?: string[];
  };
}

/**
 * Get product recommendations using specified algorithm
 */
export async function getRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResult> {
  const startTime = Date.now();
  const limit = request.limit || 5;
  const algorithm = request.algorithm || 'hybrid';

  try {
    // Analyze context if provided
    let contextAnalysis;
    if (request.context) {
      contextAnalysis = await analyzeContext(request.context, request.domainId);
    }

    let recommendations: ProductRecommendation[] = [];

    // Route to appropriate algorithm
    switch (algorithm) {
      case 'vector_similarity': {
        const result = await vectorSimilarityRecommendations({
          ...request,
          limit,
          context: contextAnalysis,
        });
        recommendations = result ?? [];
        break;
      }

      case 'collaborative': {
        const result = await collaborativeFilterRecommendations({
          ...request,
          limit,
          context: contextAnalysis,
        });
        recommendations = result ?? [];
        break;
      }

      case 'content_based': {
        const result = await contentBasedRecommendations({
          ...request,
          limit,
          context: contextAnalysis,
        });
        recommendations = result ?? [];
        break;
      }

      case 'hybrid':
      default: {
        const result = await hybridRanker({
          ...request,
          limit,
          context: contextAnalysis,
        });
        recommendations = result ?? [];
        break;
      }
    }

    // Filter out excluded products
    if (request.excludeProductIds?.length) {
      recommendations = recommendations.filter(
        (rec) => !request.excludeProductIds!.includes(rec.productId)
      );
    }

    // Apply business rules (inventory, pricing, etc.)
    const filtered = await applyBusinessRules(
      recommendations,
      request.domainId
    );
    recommendations = filtered ?? [];

    // Track recommendations
    await trackRecommendations(recommendations, request, request.supabaseClient);

    const executionTime = Date.now() - startTime;

    return {
      recommendations: recommendations.slice(0, limit),
      algorithm,
      executionTime,
      context: contextAnalysis,
    };
  } catch (error) {
    console.error('[RecommendationEngine] Error:', error);
    throw error;
  }
}

/**
 * Apply business rules to filter/rank recommendations
 */
async function applyBusinessRules(
  recommendations: ProductRecommendation[],
  domainId: string
): Promise<ProductRecommendation[]> {
  // TODO: Integrate with WooCommerce to check:
  // - Inventory status (in stock)
  // - Product visibility
  // - Pricing tiers
  // - Category permissions

  // For now, return as-is
  // Future: Filter out out-of-stock, hidden, or restricted products
  return recommendations;
}

/**
 * Track recommendations for analytics
 */
async function trackRecommendations(
  recommendations: ProductRecommendation[],
  request: RecommendationRequest,
  supabaseClient?: SupabaseClient
): Promise<void> {
  if (!recommendations || !recommendations.length) return;

  try {
    const supabase = supabaseClient ?? (await createClient());
    if (!supabase) return;

    const events = recommendations.map((rec) => ({
      session_id: request.sessionId,
      conversation_id: request.conversationId,
      product_id: rec.productId,
      algorithm_used: rec.algorithm,
      score: rec.score,
      shown: true,
      clicked: false,
      purchased: false,
      metadata: rec.metadata || {},
    }));

    const { error } = await supabase
      .from('recommendation_events')
      .insert(events);

    if (error) {
      console.error('[RecommendationEngine] Tracking error:', error);
    }
  } catch (error) {
    console.error('[RecommendationEngine] Tracking failed:', error);
  }
}

/**
 * Track recommendation events (clicks, purchases)
 */
export async function trackRecommendationEvent(
  productId: string,
  eventType: 'click' | 'purchase',
  sessionId?: string,
  conversationId?: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  try {
    const supabase = supabaseClient ?? (await createClient());
    if (!supabase) return;

    // Find the most recent recommendation event for this product
    const { data: event, error: findError } = await supabase
      .from('recommendation_events')
      .select('id')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !event) {
      console.warn('[RecommendationEngine] No event found to update');
      return;
    }

    // Update the event
    const updates: any = {};
    if (eventType === 'click') {
      updates.clicked = true;
    } else if (eventType === 'purchase') {
      updates.clicked = true;
      updates.purchased = true;
    }

    const { error: updateError } = await supabase
      .from('recommendation_events')
      .update(updates)
      .eq('id', event.id);

    if (updateError) {
      console.error('[RecommendationEngine] Event update error:', updateError);
    }
  } catch (error) {
    console.error('[RecommendationEngine] Event tracking failed:', error);
  }
}

/**
 * Get recommendation metrics for analytics
 */
export async function getRecommendationMetrics(
  domainId: string,
  hours: number = 24,
  supabaseClient?: SupabaseClient
) {
  try {
    const supabase = supabaseClient ?? (await createClient());
    if (!supabase) throw new Error('Failed to initialize Supabase client');

    const { data, error } = await supabase
      .rpc('get_recommendation_metrics', {
        p_domain_id: domainId,
        p_hours: hours,
      });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('[RecommendationEngine] Metrics error:', error);
    throw error;
  }
}
