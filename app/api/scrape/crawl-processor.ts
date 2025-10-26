import { checkCrawlStatus } from '@/lib/scraper-api';
import {
  generateEmbeddings,
  splitIntoChunks,
  clearChunkCache,
  enrichContent
} from './services';

/**
 * Background job to process crawl results with optimized batch operations
 */
export async function processCrawlResults(jobId: string, supabase: any) {
  try {
    const startTime = performance.now();

    let completed = false;
    let retries = 0;
    const maxRetries = 60; // 5 minutes with 5-second intervals
    const BATCH_SIZE = 10;

    while (!completed && retries < maxRetries) {
      const crawlStatus = await checkCrawlStatus(jobId);

      if (crawlStatus.status === 'completed' && crawlStatus.data) {
        const pages = crawlStatus.data;
        const stats = { processed: 0, failed: 0 };

        // Prepare all pages for optimized bulk insert
        const pageRecords = pages.map((page: any) => ({
          url: page.url,
          title: page.title,
          content: page.content,
          metadata: page.metadata,
          scraped_at: new Date().toISOString(),
          status: 'completed',
        }));

        // Use optimized bulk upsert function
        const { data: savedPages, error: batchPageError } = await supabase
          .rpc('bulk_upsert_scraped_pages', { pages: pageRecords });

        if (batchPageError) {
          console.error('Batch page insert error:', batchPageError);
          // Fall back to individual processing
          await processPagesIndividually(pages, supabase, BATCH_SIZE, stats);
        }

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

/**
 * Process pages individually when bulk insert fails
 */
async function processPagesIndividually(
  pages: any[],
  supabase: any,
  batchSize: number,
  stats: { processed: number; failed: number }
) {
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (page) => {
        try {
          await processPage(page, supabase);
          return { success: true, url: page.url };
        } catch (error) {
          console.error(`Error processing page ${page.url}:`, error);
          return { success: false, url: page.url, error };
        }
      })
    );

    // Update stats
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

    // Add small delay between batches
    if (i + batchSize < pages.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * Process a single page: save page data and generate embeddings
 */
async function processPage(page: any, supabase: any) {
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
      domain_id: domainData?.id,
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
  clearChunkCache();

  // Generate embeddings with deduplication
  const enrichedContent = enrichContent(page.content, page.metadata);
  const chunks = splitIntoChunks(enrichedContent);

  if (chunks.length > 0) {
    console.log(`Processing ${chunks.length} unique chunks for ${page.url}`);
    const embeddings = await generateEmbeddings(chunks);

    // Prepare all embedding records for batch insert
    const embeddingRecords = chunks.map((chunk, index) => ({
      page_id: savedPage.id,
      domain_id: domainData?.id,
      chunk_text: chunk,
      embedding: embeddings[index],
      metadata: {
        chunk_index: index,
        total_chunks: chunks.length,
        url: page.url
      },
    }));

    // Use optimized bulk insert function
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
}
