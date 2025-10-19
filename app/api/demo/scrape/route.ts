import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { quickScrape, generateDemoEmbeddings } from '@/lib/demo-scraper';
import { getRedisClient } from '@/lib/redis';
import { randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const scrapeSchema = z.object({
  url: z.string().url()
});

// Rate limiting: 3 demos per IP per hour
async function checkDemoRateLimit(req: NextRequest) {
  const redis = await getRedisClient();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const key = `demo:ratelimit:${ip}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 3600); // 1 hour
  }

  if (count > 3) {
    throw new Error('Demo rate limit exceeded. Please try again in an hour.');
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    await checkDemoRateLimit(req);

    // Parse and validate request
    const body = await req.json();
    const { url } = scrapeSchema.parse(body);

    // Validate domain
    const domain = new URL(url).hostname;

    // Create unique session ID
    const sessionId = `demo_${Date.now()}_${randomBytes(8).toString('hex')}`;

    // Quick scrape with 8s timeout
    const scrapeResult = await quickScrape(url, {
      maxPages: 3,
      timeout: 8000,
      useSitemap: true
    });

    if (scrapeResult.pages.length === 0) {
      return NextResponse.json(
        { error: 'Unable to scrape website. Please try a different URL.' },
        { status: 400 }
      );
    }

    // Generate embeddings in-memory
    const { chunks, embeddings, metadata } = await generateDemoEmbeddings(scrapeResult.pages);

    // Store in Redis with 10-minute TTL
    const redis = await getRedisClient();
    const sessionData = {
      url,
      domain,
      pages: scrapeResult.pages,
      chunks,
      embeddings,
      metadata,
      created_at: Date.now(),
      expires_at: Date.now() + (10 * 60 * 1000), // 10 minutes
      message_count: 0,
      max_messages: 20
    };

    await redis.setex(
      `demo:${sessionId}:data`,
      600, // 10 minutes
      JSON.stringify(sessionData)
    );

    // Log to Supabase for lead tracking
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

      const { data } = await supabase.from('demo_attempts').insert({
        url,
        domain,
        ip_address: ip,
        scrape_success: true,
        pages_scraped: scrapeResult.totalPages,
        enrichment_status: 'pending' // Will be enriched by background job
      }).select('id').single();

      // Trigger async enrichment (fire and forget)
      if (data?.id) {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('//', '//').split('/')[0]}//${req.headers.get('host')}/api/cron/enrich-leads`, {
          method: 'GET'
        }).catch(() => {}); // Don't wait for enrichment
      }
    } catch (logError) {
      console.error('Failed to log demo attempt:', logError); // Don't fail the request if logging fails
    }

    return NextResponse.json({
      session_id: sessionId,
      pages_scraped: scrapeResult.totalPages,
      content_chunks: chunks.length,
      scrape_time_ms: scrapeResult.scrapeDuration,
      domain,
      ready: true
    });

  } catch (error) {
    console.error('Demo scrape error:', error);

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }
      if (error.message.includes('Invalid URL')) {
        return NextResponse.json(
          { error: 'Please provide a valid website URL' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze website. Please try again.' },
      { status: 500 }
    );
  }
}
