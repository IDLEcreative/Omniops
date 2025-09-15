import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DatabaseCleaner } from '@/lib/database-cleaner';
import { z } from 'zod';

const cleanupSchema = z.object({
  domain: z.string().optional(),
  includeJobs: z.boolean().default(true),
  includeCache: z.boolean().default(true),
  preserveConfigs: z.boolean().default(true),
  action: z.enum(['clean', 'stats']).default('stats')
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if supabase client was created successfully
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const params = cleanupSchema.parse(body);

    const cleaner = new DatabaseCleaner(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (params.action === 'stats') {
      const stats = await cleaner.getScrapingStats(params.domain);
      return NextResponse.json({ success: true, stats });
    } else {
      const result = await cleaner.cleanAllScrapedData({
        domain: params.domain,
        includeJobs: params.includeJobs,
        includeCache: params.includeCache,
        preserveConfigs: params.preserveConfigs
      });
      
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Cleanup API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to perform cleanup operation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if supabase client was created successfully
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const domain = url.searchParams.get('domain') || undefined;

    const cleaner = new DatabaseCleaner(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const stats = await cleaner.getScrapingStats(domain);
    
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}