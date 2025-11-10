/**
 * Product Recommendations API
 *
 * GET /api/recommendations - Get product recommendations
 * POST /api/recommendations - Track recommendation events
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getRecommendations,
  trackRecommendationEvent,
  getRecommendationMetrics,
} from '@/lib/recommendations/engine';

// Validation schemas
const getRecommendationsSchema = z.object({
  sessionId: z.string().optional(),
  conversationId: z.string().optional(),
  domainId: z.string().uuid(),
  userId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  algorithm: z
    .enum(['collaborative', 'content_based', 'hybrid', 'vector_similarity'])
    .optional(),
  context: z.string().optional(),
  excludeProductIds: z.array(z.string()).optional(),
});

const trackEventSchema = z.object({
  productId: z.string(),
  eventType: z.enum(['click', 'purchase']),
  sessionId: z.string().optional(),
  conversationId: z.string().optional(),
});

/**
 * GET /api/recommendations
 * Get product recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const params = {
      sessionId: searchParams.get('sessionId') || undefined,
      conversationId: searchParams.get('conversationId') || undefined,
      domainId: searchParams.get('domainId') || '',
      userId: searchParams.get('userId') || undefined,
      limit: searchParams.get('limit') || undefined,
      algorithm: searchParams.get('algorithm') || undefined,
      context: searchParams.get('context') || undefined,
      excludeProductIds: searchParams.get('excludeProductIds')
        ? searchParams.get('excludeProductIds')!.split(',')
        : undefined,
    };

    const validated = getRecommendationsSchema.parse(params);

    // Get recommendations
    const result = await getRecommendations(validated);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[RecommendationsAPI] GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get recommendations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recommendations
 * Track recommendation events (clicks, purchases)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = trackEventSchema.parse(body);

    await trackRecommendationEvent(
      validated.productId,
      validated.eventType,
      validated.sessionId,
      validated.conversationId
    );

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error: any) {
    console.error('[RecommendationsAPI] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to track event',
      },
      { status: 500 }
    );
  }
}
