import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient, createServiceRoleClient, validateSupabaseEnv } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { withCSRF } from '@/lib/middleware/csrf';
import { fetchTrainingData } from '@/lib/training/fetch-training-data';
import {
  createTrainingData,
  validateTrainingDataInput,
  type CreateTrainingDataParams
} from '@/lib/training/create-training-data';

/**
 * GET /api/training
 * Fetch training data for authenticated user with pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Validate Supabase configuration
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          message: 'The service is currently undergoing maintenance. Please try again later.'
        },
        { status: 503 }
      );
    }

    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get authenticated user
    const userSupabase = await createClient();
    if (!userSupabase) {
      return NextResponse.json(
        { error: 'Authentication unavailable' },
        { status: 503 }
      );
    }

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[DEBUG FLOW] 25. GET /api/training - Authenticated user:', {
      id: user.id,
      email: user.email
    });

    const adminSupabase = await createServiceRoleClient();
    if (!adminSupabase) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        },
        { status: 503 }
      );
    }

    // Fetch training data using service module
    const result = await fetchTrainingData({
      userId: user.id,
      page,
      limit,
      adminSupabase
    });

    console.log('[DEBUG FLOW] 40. Returning response with items:', {
      itemsCount: result.items.length,
      total: result.total,
      page: result.page,
      limit: result.limit
    });

    const response = NextResponse.json(result);

    // Add cache headers for better performance
    response.headers.set('Cache-Control', 's-maxage=10, stale-while-revalidate');

    return response;
  } catch (error) {
    logger.error('GET /api/training unhandled error', error);
    return NextResponse.json(
      { error: 'Failed to fetch training data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/training
 * Create new training data entry
 *
 * CSRF PROTECTED: Requires valid CSRF token in X-CSRF-Token header
 */
async function handlePost(request: NextRequest) {
  try {
    // Validate environment configuration early for clearer errors in prod
    const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!hasUrl || !hasAnon || !hasServiceKey) {
      logger.error('POST /api/training misconfigured Supabase env', undefined, {
        hasUrl,
        hasAnon,
        hasServiceKey,
      });
      return NextResponse.json(
        { error: 'Service misconfigured: missing Supabase env' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, content, metadata, domain, title } = body;

    const adminSupabase = await createServiceRoleClient();
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Build params object
    const params: CreateTrainingDataParams = {
      userId: user.id,
      type,
      content,
      metadata,
      domain,
      title,
      adminSupabase
    };

    // Validate input
    const validationError = validateTrainingDataInput(params);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Create training data using service module
    const result = await createTrainingData(params);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('POST /api/training unhandled error', error);
    return NextResponse.json(
      { error: 'Failed to create training data' },
      { status: 500 }
    );
  }
}

// Export POST handler with CSRF protection
export const POST = withCSRF(handlePost);
