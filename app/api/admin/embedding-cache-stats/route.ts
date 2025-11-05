import { NextResponse } from 'next/server';
import { embeddingCache } from '@/lib/embedding-cache';

/**
 * GET /api/admin/embedding-cache-stats
 * Returns statistics about the embedding cache including hit rates and cost savings
 */
export async function GET() {
  try {
    const stats = embeddingCache.getStats();

    // Calculate cost savings
    // OpenAI embedding cost: ~$0.0001 per 1K tokens
    // Average chunk: ~250 tokens
    // Cost per embedding: ~$0.000025
    const costPerEmbedding = 0.000025;
    const totalCostSavings = stats.hits * costPerEmbedding;

    return NextResponse.json({
      success: true,
      stats: {
        hits: stats.hits,
        misses: stats.misses,
        evictions: stats.evictions,
        size: stats.size,
        maxSize: stats.maxSize,
        hitRate: stats.hitRate,
        ttlMinutes: stats.ttlMinutes,
        enabled: stats.enabled,
        costSavings: {
          total: `$${totalCostSavings.toFixed(4)}`,
          perHit: `$${costPerEmbedding.toFixed(6)}`,
        },
        message: `Cache hit rate: ${stats.hitRate}`,
      }
    });
  } catch (error) {
    console.error('Error getting embedding cache stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/embedding-cache-stats/clear
 * Clears the embedding cache (for testing/debugging)
 */
export async function POST() {
  try {
    embeddingCache.clear();

    return NextResponse.json({
      success: true,
      message: 'Embedding cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing embedding cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
