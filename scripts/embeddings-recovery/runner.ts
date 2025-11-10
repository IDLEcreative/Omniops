import { MetadataExtractor } from '../lib/metadata-extractor';
import { CONFIG } from './config';
import { createOpenAIClient, createSupabaseClient } from './clients';
import { splitIntoChunks } from './chunks';
import { generateEmbeddingsWithRetry } from './embeddings';
import { insertEmbeddings } from './insert';

type ScrapedPage = {
  id: string;
  url: string;
  title: string | null;
  content: string | null;
  domain_id: string | null;
};

export async function runEmbeddingRecovery() {
  console.log('🔧 Safe Missing Embeddings Recovery Script');
  console.log('==========================================\n');

  const supabase = createSupabaseClient();
  const openai = createOpenAIClient();
  const startTime = Date.now();

  try {
    const { orphanedPages, totalPages } = await fetchOrphanedPages(supabase);
    if (orphanedPages.length === 0) {
      console.log('✅ All pages have embeddings! Nothing to fix.');
      return;
    }

    const sortedPages = prioritizePages(orphanedPages);
    await processPages(sortedPages, supabase, openai, startTime);
    await verifyDc66Coverage(supabase);
    await printFinalMetrics(supabase, startTime);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

async function fetchOrphanedPages(supabase: any) {
  console.log('📊 Analyzing current state...');

  const { count: totalPages, error: countError } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true });
  if (countError) {
    throw new Error(`Failed to count pages: ${countError.message}`);
  }

  console.log(`Total scraped pages: ${totalPages}`);

  const { data: pagesWithEmbeddings, error: embeddingsError } = await supabase
    .from('page_embeddings')
    .select('page_id')
    .limit(10000);
  if (embeddingsError) {
    throw new Error(`Failed to get pages with embeddings: ${embeddingsError.message}`);
  }

  const pageIdsWithEmbeddings = new Set(pagesWithEmbeddings?.map((p: any) => p.page_id) || []);
  const { data: allPages, error: pagesError } = await supabase
    .from('scraped_pages')
    .select('id, url, title, content, domain_id')
    .order('created_at', { ascending: true })
    .limit(1000);
  if (pagesError) {
    throw new Error(`Failed to get pages: ${pagesError.message}`);
  }

  const orphanedPages = (allPages || []).filter((page: ScrapedPage) => !pageIdsWithEmbeddings.has(page.id));
  const orphanCount = orphanedPages.length;
  console.log(`Pages without embeddings: ${orphanCount} (${((orphanCount / (totalPages || 1)) * 100).toFixed(1)}%)\n`);

  return { orphanedPages, totalPages };
}

function prioritizePages(orphanedPages: ScrapedPage[]): ScrapedPage[] {
  const dc66Pages = orphanedPages.filter(
    page => page.content?.includes('DC66-10P') || page.url?.includes('DC66-10P') || page.content?.includes('DC66')
  );

  if (dc66Pages.length > 0) {
    console.log(`🔍 Found ${dc66Pages.length} DC66 pages without embeddings`);
    console.log('These will be prioritized for processing.\n');
  }

  return [...dc66Pages, ...orphanedPages.filter(page => !dc66Pages.includes(page))];
}

async function processPages(pages: ScrapedPage[], supabase: any, openai: any, startTime: number) {
  console.log(`🚀 Starting embedding generation for ${pages.length} pages...\n`);
  let processed = 0;
  let failed = 0;

  const logMemory = () => {
    if (global.gc) global.gc();
    const usage = process.memoryUsage();
    return `Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`;
  };

  for (let i = 0; i < pages.length; i += CONFIG.BATCH_SIZE) {
    const batch = pages.slice(i, i + CONFIG.BATCH_SIZE);
    const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pages.length / CONFIG.BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${logMemory()})`);
    console.log(`Processing pages ${i + 1}-${Math.min(i + CONFIG.BATCH_SIZE, pages.length)} of ${pages.length}`);

    const results = await Promise.all(batch.map(page => processPage(page, supabase, openai)));
    processed += results.filter(Boolean).length;
    failed += results.filter(result => result === false).length;

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const rate = processed / (elapsed || 1);
    const remaining = Math.round((pages.length - processed - failed) / (rate || 1));

    console.log(`\n📈 Progress: ${processed} succeeded, ${failed} failed, ${pages.length - processed - failed} remaining`);
    console.log(`⏱️  Time: ${elapsed}s elapsed, ~${remaining}s remaining`);

    if (i + CONFIG.BATCH_SIZE < pages.length) {
      await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    }
  }
}

async function processPage(page: ScrapedPage, supabase: any, openai: any): Promise<boolean> {
  if (!page.content || page.content.trim().length < 10) {
    console.log(`  ⚠️ Skipping ${page.url.substring(0, 50)}... - insufficient content`);
    return false;
  }

  const chunks = splitIntoChunks(page.content);
  if (chunks.length === 0) {
    console.log(`  ⚠️ Skipping ${page.url.substring(0, 50)}... - no chunks generated`);
    return false;
  }

  console.log(`  📄 Processing: ${page.url.substring(0, 60)}... (${chunks.length} chunks)`);
  const embeddings = await generateEmbeddingsWithRetry(openai, chunks);

  const embeddingRecords = await Promise.all(
    chunks.map(async (chunk, index) => {
      const metadata = await MetadataExtractor.extractEnhancedMetadata(
        chunk,
        page.content!,
        page.url,
        page.title || '',
        index,
        chunks.length
      );

      return {
        page_id: page.id,
        chunk_text: chunk,
        embedding: embeddings[index],
        metadata: {
          ...metadata,
          domain_id: page.domain_id,
          recovered_at: new Date().toISOString()
        }
      };
    })
  );

  const success = await insertEmbeddings(supabase, embeddingRecords);
  if (success) {
    logDc66Insight(page, embeddingRecords);
  } else {
    console.log('  ❌ Failed to insert embeddings');
  }
  return success;
}

function logDc66Insight(page: ScrapedPage, records: any[]) {
  if (page.content?.includes('DC66')) {
    const extractedSkus = records.some(record =>
      record.metadata?.entities?.skus?.some((sku: string) => sku.includes('DC66'))
    );
    console.log(`  ✅ DC66 page processed: ${extractedSkus ? 'SKUs extracted' : 'SKUs not detected'}`);
  } else {
    console.log('  ✅ Success');
  }
}

async function verifyDc66Coverage(supabase: any) {
  console.log('\n🔍 Verifying DC66 search capability...');

  const { data: dc66Embeddings, count: dc66Count } = await supabase
    .from('page_embeddings')
    .select('chunk_text, metadata', { count: 'exact' })
    .or('chunk_text.ilike.%DC66%,metadata->entities->skus.cs.["DC66"]')
    .limit(5);

  if (dc66Embeddings && dc66Embeddings.length > 0) {
    console.log(`✅ DC66 products now have ${dc66Count || dc66Embeddings.length}+ embeddings!`);
    const hasSkus = dc66Embeddings.some(entry =>
      entry.metadata?.entities?.skus?.some((sku: string) => sku.includes('DC66'))
    );
    if (hasSkus) {
      console.log('✅ DC66 SKUs properly extracted in metadata!');
    } else {
      console.log('⚠️ DC66 SKUs not in metadata - check metadata extractor');
    }
  } else {
    console.log('⚠️ DC66 embeddings not found - may need investigation');
  }
}

async function printFinalMetrics(supabase: any, startTime: number) {
  const { count: finalTotalPages } = await supabase.from('scraped_pages').select('*', { count: 'exact', head: true });
  const { count: finalEmbeddingCount } = await supabase.from('page_embeddings').select('page_id', { count: 'exact', head: true });

  if (finalTotalPages && finalEmbeddingCount) {
    const avgEmbeddingsPerPage = (finalEmbeddingCount / finalTotalPages).toFixed(2);
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(50));
    console.log(`   Total pages: ${finalTotalPages}`);
    console.log(`   Total embeddings: ${finalEmbeddingCount}`);
    console.log(`   Avg embeddings per page: ${avgEmbeddingsPerPage}`);
    console.log(`⏱️  Total time: ${Math.round((Date.now() - startTime) / 1000)}s`);
    console.log('\n🎉 Embedding recovery complete!');
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
