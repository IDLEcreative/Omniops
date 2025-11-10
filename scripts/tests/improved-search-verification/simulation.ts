import { mockGenerateQueryEmbedding } from './mock-embedding';
import { MockSupabaseClient } from './mock-supabase-client';

interface SimulationResult {
  content: string;
  url: string;
  title: string;
  similarity: number;
  enhanced: boolean;
}

export async function simulateEnhancedSearch(
  mockClient: MockSupabaseClient,
  productUrls: string[]
): Promise<SimulationResult[]> {
  console.log('\n📊 SIMULATING ENHANCED SEARCH PROCESS...\n');

  console.log('[Step 1] Searching embeddings via RPC...');
  const queryEmbedding = await mockGenerateQueryEmbedding();
  const { data: embeddings } = await mockClient.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    p_domain_id: 'test-domain-id-123',
    match_threshold: 0.4,
    match_count: 25
  });

  let results: SimulationResult[] = (embeddings || []).map((record: any) => ({
    content: record.content || '',
    url: record.url || '',
    title: record.title || 'Untitled',
    similarity: record.similarity || 0,
    enhanced: false
  }));

  console.log(`[Step 1] Found ${results.length} initial results`);
  console.log('\n[Step 2] Starting BATCHED product enhancement...');
  console.log(`[Step 2] Product URLs to enhance: ${productUrls.length}`);

  if (productUrls.length === 0) {
    return results;
  }

  try {
    console.log('[Step 2.1] BATCH QUERY #1: Fetching ALL product pages at once...');
    const { data: allPages, error: pagesError } = (mockClient as any)
      .from('scraped_pages')
      .select('id, url, content')
      .in('url', productUrls);

    if (pagesError) {
      console.error('[Step 2.1] Error fetching pages:', pagesError);
      return results;
    }

    if (!allPages || allPages.length === 0) {
      console.log('[Step 2.1] No pages found for provided URLs');
      return results;
    }

    console.log(`[Step 2.1] ✅ Fetched ${allPages.length} pages in 1 batch query`);
    const pagesByUrl = new Map(allPages.map((page: any) => [page.url, page]));

    console.log('[Step 2.2] BATCH QUERY #2: Fetching ALL chunks for these pages...');
    const pageIds = allPages.map((page: any) => page.id);
    const { data: allChunks, error: chunksError } = (mockClient as any)
      .from('page_embeddings')
      .select('page_id, chunk_text, metadata')
      .in('page_id', pageIds)
      .order('metadata->chunk_index', { ascending: true });

    if (chunksError) {
      console.error('[Step 2.2] Error fetching chunks:', chunksError);
      return results;
    }

    console.log(`[Step 2.2] ✅ Fetched ${allChunks?.length ?? 0} chunks in 1 batch query`);
    const chunksByPageId = new Map<string, any[]>();
    (allChunks || []).forEach(chunk => {
      if (!chunksByPageId.has(chunk.page_id)) {
        chunksByPageId.set(chunk.page_id, []);
      }
      chunksByPageId.get(chunk.page_id)!.push(chunk);
    });

    console.log('[Step 2.3] Enhancing product results with batched data...');
    for (const productUrl of productUrls) {
      const pageData = pagesByUrl.get(productUrl);
      if (!pageData) continue;

      const index = results.findIndex(result => result.url === productUrl);
      if (index >= 0) {
        results[index].content = pageData.content;
        results[index].enhanced = true;
      }
    }

    const enhancedCount = results.filter(result => result.enhanced).length;
    console.log(`[Step 2.3] ✅ Enhanced ${enhancedCount} product results`);
  } catch (error) {
    console.error('[Step 2] Error in batched enhancement:', error);
  }

  return results;
}
