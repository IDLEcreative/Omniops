import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient, createServiceRoleClient, validateSupabaseEnv } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { withCSRF } from '@/lib/middleware/csrf';

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
    const offset = (page - 1) * limit;

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
    
    // Get total count for pagination from scraped_pages
    const { count } = await adminSupabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    // Fetch paginated scraped pages data
    const { data: scrapedData, error } = await adminSupabase
      .from('scraped_pages')
      .select('id, url, title, created_at, metadata')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('GET /api/training DB query failed', error, {
        page,
        limit,
        offset,
      });
      return NextResponse.json(
        { error: 'Failed to fetch training data from DB' },
        { status: 500 }
      );
    }

    // Transform data for frontend - adapting scraped_pages to training data format
    const items = scrapedData?.map(item => ({
      id: item.id,
      type: 'url',
      content: item.title || item.url,
      status: 'completed',
      createdAt: item.created_at,
      metadata: {
        ...item.metadata,
        url: item.url,
        title: item.title
      },
    })) || [];

    const response = NextResponse.json({ 
      items,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit
    });
    
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

    if (!type || !content || !domain) {
      return NextResponse.json(
        { error: 'Type, content, and domain are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['faq', 'product', 'policy', 'guide', 'custom'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const adminSupabase = await createServiceRoleClient();
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    
    // Create training data entry
    const { data, error } = await adminSupabase
      .from('training_data')
      .insert({
        user_id: user.id,
        domain,
        type,
        title: title || null,
        content,
        metadata: metadata || {},
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('POST /api/training insert failed', error, {
        userId: user.id,
        type,
      });
      throw error;
    }

    // Trigger embedding generation in the background
    processTrainingDataAsync(data.id, content, metadata, adminSupabase, body.domain || 'default');

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        type: data.type,
        content: data.content,
        status: data.status,
        createdAt: data.created_at,
      }
    });
  } catch (error) {
    logger.error('POST /api/training unhandled error', error);
    return NextResponse.json(
      { error: 'Failed to create training data' },
      { status: 500 }
    );
  }
}

/**
 * Process training data to generate embeddings asynchronously
 */
async function processTrainingDataAsync(
  trainingId: string,
  content: string,
  metadata: any,
  supabase: SupabaseClient,
  domain: string
) {
  try {
    // Update status to processing
    await supabase
      .from('training_data')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', trainingId);

    // Import embedding functions dynamically to avoid circular dependencies
    const { splitIntoChunks, generateEmbeddingVectors } = await import('@/lib/embeddings');

    // Split content into chunks (similar to web scraping)
    const chunks = splitIntoChunks(content);

    // Generate embedding vectors for each chunk
    const embeddings = await generateEmbeddingVectors(chunks);

    // Store embeddings in the database
    const embeddingRecords = embeddings.map((embedding: number[], index: number) => ({
      page_id: trainingId, // Use training ID as page reference
      chunk_index: index,
      chunk_text: chunks[index],
      embedding: embedding,
      metadata: {
        ...metadata,
        source: 'training_data',
        domain: domain,
        training_id: trainingId
      }
    }));

    if (embeddingRecords.length > 0) {
      const { error: embedError } = await supabase
        .from('page_embeddings')
        .insert(embeddingRecords);

      if (embedError) {
        throw embedError;
      }
    }

    // Update training data status to completed
    await supabase
      .from('training_data')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        embedding_count: embeddingRecords.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', trainingId);

    logger.info('Training data processed successfully', {
      trainingId,
      chunkCount: chunks.length,
      embeddingCount: embeddingRecords.length
    });

  } catch (error) {
    logger.error('Failed to process training data', error, { trainingId });

    // Update status to failed
    await supabase
      .from('training_data')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Processing failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', trainingId);
  }
}

// Export POST handler with CSRF protection
export const POST = withCSRF(handlePost);
