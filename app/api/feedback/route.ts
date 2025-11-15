/**
 * Feedback Collection API
 *
 * Handles storage and retrieval of user feedback:
 * - POST: Submit new feedback
 * - GET: Retrieve feedback (admin only)
 *
 * Features:
 * - Automatic categorization
 * - Sentiment analysis
 * - Urgent feedback notifications
 * - Trend tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FeedbackSchema, FeedbackType, FeedbackAnalyzer } from '@/lib/feedback/feedback-collector';
import { z } from 'zod';

// ============================================================================
// POST - Submit Feedback
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate feedback data
    const feedback = FeedbackSchema.parse(body);

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    // Determine sentiment
    const sentiment = feedback.rating
      ? FeedbackAnalyzer.categorizeSentiment(feedback.rating)
      : null;

    // Check if urgent
    const isUrgent = FeedbackAnalyzer.isUrgent(feedback);

    // Store feedback in database
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        type: feedback.type,
        rating: feedback.rating,
        nps_score: feedback.npsScore,
        message: feedback.message,
        category: feedback.category,
        sentiment,
        is_urgent: isUrgent,
        conversation_id: feedback.conversationId,
        session_id: feedback.sessionId,
        domain: feedback.domain,
        user_agent: feedback.userAgent,
        url: feedback.url,
        metadata: feedback.metadata,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to store feedback:', error);
      return NextResponse.json(
        { error: 'Failed to store feedback' },
        { status: 500 }
      );
    }

    // Send notifications for urgent feedback
    if (isUrgent) {
      await sendUrgentFeedbackNotification(data);
    }

    return NextResponse.json({
      success: true,
      feedback_id: data.id,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Retrieve Feedback (Admin Only)
// ============================================================================

const FeedbackQuerySchema = z.object({
  domain: z.string().optional(),
  type: z.nativeEnum(FeedbackType).optional(),
  sentiment: z.enum(['negative', 'neutral', 'positive']).optional(),
  urgent_only: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const query = FeedbackQuerySchema.parse(params);

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    // Build query
    const offset = query.offset || 0;
    const limit = query.limit || 50;

    let dbQuery = supabase
      .from('feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (query.domain) {
      dbQuery = dbQuery.eq('domain', query.domain);
    }

    if (query.type) {
      dbQuery = dbQuery.eq('type', query.type);
    }

    if (query.sentiment) {
      dbQuery = dbQuery.eq('sentiment', query.sentiment);
    }

    if (query.urgent_only) {
      dbQuery = dbQuery.eq('is_urgent', true);
    }

    if (query.start_date) {
      dbQuery = dbQuery.gte('created_at', query.start_date);
    }

    if (query.end_date) {
      dbQuery = dbQuery.lte('created_at', query.end_date);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Failed to retrieve feedback:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve feedback' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const stats = await calculateFeedbackStats(supabase, query.domain);

    return NextResponse.json({
      feedback: data,
      count,
      stats,
      pagination: {
        offset: query.offset || 0,
        limit: query.limit || 50,
        total: count,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function sendUrgentFeedbackNotification(feedback: any): Promise<void> {
  // TODO: Implement notification system (email, Slack, etc.)
  console.log('🚨 URGENT FEEDBACK RECEIVED:', {
    id: feedback.id,
    type: feedback.type,
    domain: feedback.domain,
    message: feedback.message,
  });

  // For now, just log it
  // In production, this would send:
  // - Email to support team
  // - Slack notification
  // - SMS for critical bugs
}

async function calculateFeedbackStats(
  supabase: any,
  domain?: string
): Promise<any> {
  // Build base query
  let baseQuery = supabase.from('feedback').select('type, rating, nps_score, sentiment');

  if (domain) {
    baseQuery = baseQuery.eq('domain', domain);
  }

  const { data: allFeedback } = await baseQuery;

  if (!allFeedback || allFeedback.length === 0) {
    return {
      total: 0,
      by_type: {},
      by_sentiment: {},
      average_rating: 0,
      nps_score: 0,
    };
  }

  // Calculate stats
  const byType = allFeedback.reduce((acc: any, item: any) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const bySentiment = allFeedback.reduce((acc: any, item: any) => {
    if (item.sentiment) {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
    }
    return acc;
  }, {});

  const ratings = allFeedback
    .filter((f: any) => f.rating !== null)
    .map((f: any) => f.rating);

  const npsScores = allFeedback
    .filter((f: any) => f.nps_score !== null)
    .map((f: any) => f.nps_score);

  return {
    total: allFeedback.length,
    by_type: byType,
    by_sentiment: bySentiment,
    average_rating: ratings.length > 0
      ? FeedbackAnalyzer.calculateAverageSatisfaction(ratings)
      : 0,
    nps_score: npsScores.length > 0
      ? FeedbackAnalyzer.calculateNPS(npsScores)
      : 0,
  };
}
