import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-server';
import { refreshDomainContent, discoverNewPages, refreshPageContent } from '@/lib/content-refresh';
import { z } from 'zod';

// Request schema
const RefreshRequestSchema = z.object({
  domainId: z.string().uuid(),
  refreshType: z.enum(['full', 'incremental', 'discover']),
  options: z.object({
    forceRefresh: z.boolean().optional(),
    maxPages: z.number().min(1).max(500).optional(),
    specificUrls: z.array(z.string().url()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RefreshRequestSchema.parse(body);
    
    const { domainId, refreshType, options } = validatedData;
    
    const supabase = await createClient();
    
    // Check if domain exists and user has access
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('domain, settings, user_id')
      .eq('id', domainId)
      .single();
    
    if (domainError || !domain) {
      return NextResponse.json(
        { error: 'Domain not found or access denied' },
        { status: 404 }
      );
    }
    
    // Create refresh job record
    const { data: job, error: jobError } = await supabase
      .from('content_refresh_jobs')
      .insert({
        domain_id: domainId,
        job_type: refreshType,
        status: 'processing',
        config: options,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (jobError) {
      console.error('Error creating refresh job:', jobError);
    }
    
    let result: {
      refreshed?: number;
      skipped?: number;
      failed?: number;
      newPagesFound?: number;
      newPagesProcessed?: number;
      pages?: string[];
    } = {};
    
    try {
      switch (refreshType) {
        case 'full':
          // Refresh all existing content
          result = await refreshDomainContent(domainId, {
            forceRefresh: options?.forceRefresh,
            maxPages: options?.maxPages,
          });
          break;
        
        case 'incremental':
          // Discover new pages and refresh old ones
          const baseUrl = `https://${domain.domain}`;
          
          // Find new pages
          const newPages = await discoverNewPages(domainId, baseUrl);
          result.newPagesFound = newPages.length;
          result.newPagesProcessed = 0;
          
          // Process new pages
          for (const url of newPages.slice(0, options?.maxPages || 10)) {
            try {
              await refreshPageContent(url, domainId);
              result.newPagesProcessed++;
            } catch (error) {
              console.error(`Failed to process new page ${url}:`, error);
            }
          }
          
          // Refresh stale content
          const refreshStats = await refreshDomainContent(domainId, {
            forceRefresh: false,
            maxPages: (options?.maxPages || 50) - result.newPagesProcessed,
          });
          
          result = {
            ...result,
            ...refreshStats,
          };
          break;
        
        case 'discover':
          // Just discover new pages without processing
          const discoveryUrl = `https://${domain.domain}`;
          const discovered = await discoverNewPages(domainId, discoveryUrl);
          
          result = {
            newPagesFound: discovered.length,
            pages: discovered.slice(0, 100), // Return first 100 URLs
          };
          break;
        
        default:
          throw new Error('Invalid refresh type');
      }
      
      // Update job status
      if (job) {
        await supabase
          .from('content_refresh_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            stats: result,
          })
          .eq('id', job.id);
      }
      
      return NextResponse.json({
        success: true,
        jobId: job?.id,
        domainId,
        refreshType,
        stats: result,
      });
    } catch (error) {
      // Update job status on error
      if (job) {
        await supabase
          .from('content_refresh_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', job.id);
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Refresh error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const domainId = searchParams.get('domainId');
  
  if (!jobId && !domainId) {
    return NextResponse.json(
      { error: 'Either jobId or domainId is required' },
      { status: 400 }
    );
  }
  
  const supabase = await createClient();
  
  try {
    if (jobId) {
      // Get specific job
      const { data: job, error } = await supabase
        .from('content_refresh_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (error || !job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(job);
    } else {
      // Get recent jobs for domain
      const { data: jobs, error } = await supabase
        .from('content_refresh_jobs')
        .select('*')
        .eq('domain_id', domainId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return NextResponse.json({
        jobs: jobs || [],
        domainId,
      });
    }
  } catch (error) {
    console.error('Error fetching refresh jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
