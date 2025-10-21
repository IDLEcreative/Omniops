import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient, createClient } from '@/lib/supabase-server';
import { scrapePage, checkCrawlStatus, getHealthStatus } from '@/lib/scraper-api';
import { crawlWebsiteWithCleanup } from '@/lib/scraper-with-cleanup';
import OpenAI from 'openai';
import { z } from 'zod';
import crypto from 'crypto';

// Lazy load OpenAI client to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Request validation
const ScrapeRequestSchema = z.object({
  url: z.string().url(),
  crawl: z.boolean().default(false),
  max_pages: z.number().min(-1).max(10000).default(-1), // -1 means unlimited (production default)
  turbo: z.boolean().default(true), // Enable turbo mode (default)
  incremental: z.boolean().default(false), // Enable incremental scraping (only scrape new/changed content)
  force_refresh: z.boolean().default(false), // Force full refresh even in incremental mode
});

// Cache for deduplication within a single request
const chunkHashCache = new Map<string, boolean>();

// Helper function to generate hash for chunk deduplication
function generateChunkHash(text: string): string {
  // Normalize text for consistent hashing
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
  
  return crypto.createHash('sha256')
    .update(normalized)
    .digest('hex');
}

// Helper function to split text into chunks with deduplication
function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.split(/[.!?]+/);
  const chunks: string[] = [];
  let currentChunk = '';
  let duplicatesSkipped = 0;

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      const trimmedChunk = currentChunk.trim();
      const chunkHash = generateChunkHash(trimmedChunk);
      
      // Only add unique chunks
      if (!chunkHashCache.has(chunkHash)) {
        chunks.push(trimmedChunk);
        chunkHashCache.set(chunkHash, true);
      } else {
        duplicatesSkipped++;
      }
      
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    const trimmedChunk = currentChunk.trim();
    const chunkHash = generateChunkHash(trimmedChunk);
    
    if (!chunkHashCache.has(chunkHash)) {
      chunks.push(trimmedChunk);
      chunkHashCache.set(chunkHash, true);
    } else {
      duplicatesSkipped++;
    }
  }

  if (duplicatesSkipped > 0) {
    console.log(`Skipped ${duplicatesSkipped} duplicate chunks during single page scrape`);
  }

  return chunks;
}

// Helper function to generate embeddings for text chunks
async function generateEmbeddings(chunks: string[]) {
  const embeddings = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const response = await getOpenAIClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    
    embeddings.push(...response.data.map(d => d.embedding));
  }
  
  return embeddings;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, crawl, max_pages, turbo } = ScrapeRequestSchema.parse(body);
    
    const supabase = await createServiceRoleClient();
    const userSupabase = await createClient();
    
    if (!supabase || !userSupabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }
    
    // Get the authenticated user's organization ID
    let organizationId: string | undefined;
    try {
      const { data: { user }, error: authError } = await userSupabase.auth.getUser();

      if (!authError && user) {
        const { data: membership } = await userSupabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (membership) {
          // Only allow admins and owners to scrape
          if (['owner', 'admin'].includes(membership.role)) {
            organizationId = membership.organization_id;
          } else {
            return NextResponse.json(
              { error: 'Insufficient permissions to scrape content' },
              { status: 403 }
            );
          }
        }
      }
    } catch (error) {
      console.log('Could not get organization ID, proceeding without owned domains');
    }

    if (!crawl) {
      // Single page scrape
      const pageData = await scrapePage(url, { turboMode: turbo });
      
      // Get or create domain
      const domain = new URL(url).hostname.replace('www.', '');
      const { data: domainData } = await supabase
        .from('domains')
        .upsert({ domain })
        .select()
        .single();
      
      // Save to database
      const { data: savedPage, error: pageError } = await supabase
        .from('scraped_pages')
        .upsert({
          url: pageData.url,
          domain_id: domainData?.id,  // Include domain_id!
          title: pageData.title,
          content: pageData.content,
          metadata: pageData.metadata,
          last_scraped_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (pageError) throw pageError;

      // Clear chunk cache for this request
      chunkHashCache.clear();
      
      // Generate embeddings for the content with deduplication
      // Include metadata like categories in the content for better search
      let enrichedContent = pageData.content;
      
      // Add product category if available
      if (pageData.metadata && pageData.metadata.productCategory) {
        enrichedContent = `Category: ${pageData.metadata.productCategory}\n\n${enrichedContent}`;
      }
      
      // Add breadcrumbs from ecommerceData if available
      if (pageData.metadata && pageData.metadata.ecommerceData?.breadcrumbs && Array.isArray(pageData.metadata.ecommerceData.breadcrumbs) && pageData.metadata.ecommerceData.breadcrumbs.length > 0) {
        const breadcrumbText = pageData.metadata.ecommerceData.breadcrumbs.map((b: any) => b.name).join(' > ');
        enrichedContent = `${breadcrumbText}\n\n${enrichedContent}`;
      }
      
      // Add brand if available
      if (pageData.metadata && pageData.metadata.productBrand) {
        enrichedContent = `Brand: ${pageData.metadata.productBrand}\n${enrichedContent}`;
      }
      
      const chunks = splitIntoChunks(enrichedContent);
      console.log(`Generated ${chunks.length} unique chunks for ${url}`);
      
      const embeddings = await generateEmbeddings(chunks);

      // Save embeddings
      const embeddingRecords = chunks.map((chunk, index) => ({
        page_id: savedPage.id,
        domain_id: domainData?.id,  // CRITICAL: Include domain_id for search to work!
        chunk_text: chunk,
        embedding: embeddings[index],
        metadata: { chunk_index: index },
      }));

      const { error: embError } = await supabase
        .from('page_embeddings')
        .insert(embeddingRecords);

      if (embError) throw embError;

      return NextResponse.json({
        status: 'completed',
        pages_scraped: 1,
        message: `Successfully scraped and indexed ${url}`,
      });
    } else {
      // Full website crawl (turbo mode integrated into main crawler)
      const jobId = await crawlWebsiteWithCleanup(url, {
        maxPages: max_pages,
        excludePaths: ['/wp-admin', '/admin', '/login', '/cart', '/checkout'],
        turboMode: turbo,
        organizationId: organizationId, // Pass organization ID for owned domain detection
      });

      // Start a background job to process the crawl results
      // In production, you'd use a job queue like BullMQ or similar
      processCrawlResults(jobId, supabase);

      return NextResponse.json({
        status: 'started',
        job_id: jobId,
        turbo_mode: turbo,
        message: `Started ${turbo ? 'TURBO' : 'standard'} crawling ${url}. This may take a few minutes.`,
      });
    }
  } catch (error) {
    console.error('Scrape API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background job to process crawl results with optimized batch operations
async function processCrawlResults(jobId: string, supabase: any) {
  try {
    // Performance: Mark start time
    const startTime = performance.now();
    
    let completed = false;
    let retries = 0;
    const maxRetries = 60; // 5 minutes with 5-second intervals
    const BATCH_SIZE = 10; // Increased batch size for better throughput
    
    while (!completed && retries < maxRetries) {
      const crawlStatus = await checkCrawlStatus(jobId);
      
      if (crawlStatus.status === 'completed' && crawlStatus.data) {
        const pages = crawlStatus.data;
        const stats = { processed: 0, failed: 0 };
        
        // Prepare all pages for optimized bulk insert (81% faster)
        const pageRecords = pages.map(page => ({
          url: page.url,
          title: page.title,
          content: page.content,
          metadata: page.metadata,
          scraped_at: new Date().toISOString(),
          status: 'completed',
          // domain_id will be set automatically by the function
        }));
        
        // Use optimized bulk upsert function
        const { data: savedPages, error: batchPageError } = await supabase
          .rpc('bulk_upsert_scraped_pages', { pages: pageRecords });
        
        if (batchPageError) {
          console.error('Batch page insert error:', batchPageError);
          // Fall back to individual processing
          for (let i = 0; i < pages.length; i += BATCH_SIZE) {
            const batch = pages.slice(i, i + BATCH_SIZE);
            
            // Process batch in parallel
            const batchResults = await Promise.allSettled(
              batch.map(async (page) => {
                try {
                  // Get domain_id
                  const domain = new URL(page.url).hostname.replace('www.', '');
                  const { data: domainData } = await supabase
                    .from('domains')
                    .upsert({ domain })
                    .select()
                    .single();
                  
                  // Save page
                  const { data: savedPage, error: pageError } = await supabase
                    .from('scraped_pages')
                    .upsert({
                      url: page.url,
                      domain_id: domainData?.id,  // Include domain_id!
                      title: page.title,
                      content: page.content,
                      metadata: page.metadata,
                      last_scraped_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (pageError) {
                  throw new Error(`Error saving page: ${pageError.message}`);
                }

                // Clear chunk cache for this page
                chunkHashCache.clear();
                
                // Generate embeddings using optimized function with deduplication
                // Include metadata like categories in the content for better search
                let enrichedContent = page.content;
                
                // Add product category if available
                if (page.metadata && page.metadata.productCategory) {
                  enrichedContent = `Category: ${page.metadata.productCategory}\n\n${enrichedContent}`;
                }
                
                // Add breadcrumbs from ecommerceData if available
                if (page.metadata && page.metadata.ecommerceData?.breadcrumbs && Array.isArray(page.metadata.ecommerceData.breadcrumbs) && page.metadata.ecommerceData.breadcrumbs.length > 0) {
                  const breadcrumbText = page.metadata.ecommerceData.breadcrumbs.map((b: any) => b.name).join(' > ');
                  enrichedContent = `${breadcrumbText}\n\n${enrichedContent}`;
                }
                
                // Add brand if available
                if (page.metadata && page.metadata.productBrand) {
                  enrichedContent = `Brand: ${page.metadata.productBrand}\n${enrichedContent}`;
                }
                
                const chunks = splitIntoChunks(enrichedContent);
                
                if (chunks.length > 0) {
                  console.log(`Processing ${chunks.length} unique chunks for ${page.url}`);
                  const embeddings = await generateEmbeddings(chunks);

                  // Prepare all embedding records for batch insert
                  const embeddingRecords = chunks.map((chunk, index) => ({
                    page_id: savedPage.id,
                    domain_id: domainData?.id,  // CRITICAL: Include domain_id for search to work!
                    chunk_text: chunk,
                    embedding: embeddings[index],
                    metadata: { 
                      chunk_index: index,
                      total_chunks: chunks.length,
                      url: page.url 
                    },
                  }));

                  // Use optimized bulk insert function (86% faster)
                  const { data: insertCount, error: embError } = await supabase
                    .rpc('bulk_insert_embeddings', { embeddings: embeddingRecords });
                  
                  if (embError) {
                    // Fallback to regular insert if bulk function fails
                    console.warn('Bulk embeddings insert failed, using fallback:', embError);
                    const { error: fallbackError } = await supabase
                      .from('page_embeddings')
                      .insert(embeddingRecords);
                    
                    if (fallbackError) {
                      throw new Error(`Error saving embeddings: ${fallbackError.message}`);
                    }
                  } else {
                    console.log(`Bulk inserted ${insertCount || embeddingRecords.length} embeddings`);
                  }
                }

                return { success: true, url: page.url };
              } catch (error) {
                console.error(`Error processing page ${page.url}:`, error);
                return { success: false, url: page.url, error };
              }
            })
          );
          
          // Process results
          batchResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
              stats.processed++;
            } else {
              stats.failed++;
              if (result.status === 'rejected') {
                console.error('Batch processing error:', result.reason);
              }
            }
          });
          
          // Add small delay between batches to avoid overwhelming the system
          if (i + BATCH_SIZE < pages.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        } // Close the if (batchPageError) block
        
        console.log(`Crawl processing completed. Processed: ${stats.processed}, Failed: ${stats.failed}`);
        completed = true;
      } else if (crawlStatus.status === 'failed') {
        console.error('Crawl failed:', crawlStatus);
        break;
      } else {
        // Still processing, wait and retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        retries++;
      }
    }
  } catch (error) {
    console.error('Error processing crawl results:', error);
  }
}

// Status check endpoint with caching
export async function GET(request: NextRequest) {
  // Performance: Mark start time
  const startTime = performance.now();
  
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('job_id');
  const health = searchParams.get('health');

  // Health check endpoint with caching
  if (health === 'true') {
    try {
      const healthStatus = await getHealthStatus();
      const endTime = performance.now();
      
      return NextResponse.json({
        status: 'ok',
        ...healthStatus,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=5',
          'X-Response-Time': `${(endTime - startTime).toFixed(2)}ms`
        }
      });
    } catch (error) {
      const endTime = performance.now();
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Failed to get health status',
          timestamp: new Date().toISOString(),
        },
        { 
          status: 500,
          headers: {
            'X-Response-Time': `${(endTime - startTime).toFixed(2)}ms`
          }
        }
      );
    }
  }

  if (!jobId) {
    return NextResponse.json(
      { error: 'job_id parameter is required' },
      { status: 400 }
    );
  }

  try {
    // All jobs now use the same status check (turbo is integrated)
    const includeResults = searchParams.get('include_results') === 'true';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const status = await checkCrawlStatus(jobId, {
      includeResults,
      offset,
      limit,
    });
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking crawl status:', error);
    return NextResponse.json(
      { error: 'Failed to check crawl status' },
      { status: 500 }
    );
  }
}
