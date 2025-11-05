/**
 * Agent 3: Simple Chunk Ranking Test
 *
 * A streamlined test to quickly understand chunk retrieval behavior
 */

import { generateQueryEmbedding } from '@/lib/embeddings';
import { createServiceRoleClient } from '@/lib/supabase-server';

const TEST_DOMAIN = 'test-domain.example.com';

interface SearchResult {
  id: string;
  page_id: string;
  chunk_text: string;
  similarity: number;
  url: string;
  title: string;
  content: string;
  metadata?: any;
}

async function getDomainId(domain: string): Promise<string | null> {
  const supabase = await createServiceRoleClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('customer_configs')
    .select('id')
    .ilike('domain', `%${domain}%`)
    .single();

  return data?.id || null;
}

async function searchWithDetails(query: string, domainId: string, limit: number = 5) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`QUERY: "${query}"`);
  console.log('='.repeat(80));

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    return;
  }

  // Generate embedding
  const queryEmbedding = await generateQueryEmbedding(query, false, TEST_DOMAIN);

  // Search using the RPC function
  const { data: results, error } = await supabase.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    p_domain_id: domainId,
    match_threshold: 0.15,
    match_count: limit
  });

  if (error) {
    console.error('Search error:', error);
    return;
  }

  if (!results || results.length === 0) {
    console.log('No results found\n');
    return;
  }

  console.log(`\nFound ${results.length} results:\n`);

  // Get additional metadata for each result
  const enrichedResults = await Promise.all(
    results.map(async (result: SearchResult) => {
      const { data: embedding } = await supabase
        .from('page_embeddings')
        .select('metadata')
        .eq('id', result.id)
        .single();

      return {
        ...result,
        metadata: embedding?.metadata
      };
    })
  );

  // Display results with analysis
  enrichedResults.forEach((result, idx) => {
    const chunkIndex = result.metadata?.chunk_index ?? 'N/A';
    const totalChunks = result.metadata?.total_chunks ?? 'N/A';
    const chunkSize = result.metadata?.chunk_size ?? result.chunk_text.length;

    const isProduct = result.url?.includes('/product/');
    const isHomepage = result.url === '/' || result.url === '';
    const isCategory = result.url?.includes('/category/') || result.url?.includes('/shop/');

    let pageType = 'OTHER';
    if (isProduct) pageType = 'PRODUCT';
    else if (isHomepage) pageType = 'HOMEPAGE';
    else if (isCategory) pageType = 'CATEGORY';

    console.log(`\n[${idx + 1}] ${pageType} - Similarity: ${result.similarity.toFixed(4)}`);
    console.log(`    URL: ${result.url}`);
    console.log(`    Title: ${result.title}`);
    console.log(`    Chunk: ${chunkIndex}/${totalChunks} (${chunkSize} chars)`);
    console.log(`    Preview: ${result.chunk_text.substring(0, 150)}...`);

    // Analyze why this chunk might rank high
    const reasons: string[] = [];
    if (chunkIndex === 0) reasons.push('First chunk (often contains headers/navigation)');
    if (chunkSize < 200) reasons.push('Very short chunk (may lack context)');
    if (isProduct) reasons.push('From product page');
    if (result.similarity > 0.3) reasons.push('High similarity score');

    if (reasons.length > 0) {
      console.log(`    Analysis: ${reasons.join('; ')}`);
    }
  });

  // Summary statistics
  const productChunks = enrichedResults.filter(r => r.url?.includes('/product/')).length;
  const chunk0Count = enrichedResults.filter(r => r.metadata?.chunk_index === 0).length;
  const avgSimilarity = enrichedResults.reduce((sum, r) => sum + r.similarity, 0) / enrichedResults.length;

  console.log(`\n${'─'.repeat(80)}`);
  console.log('SUMMARY:');
  console.log(`  Product pages: ${productChunks}/${enrichedResults.length}`);
  console.log(`  First chunks (index 0): ${chunk0Count}/${enrichedResults.length}`);
  console.log(`  Average similarity: ${avgSimilarity.toFixed(4)}`);
  console.log('─'.repeat(80));
}

async function analyzeSpecificProduct(domainId: string) {
  console.log('\n\n' + '='.repeat(80));
  console.log('ANALYZING SPECIFIC PRODUCT CHUNKS');
  console.log('='.repeat(80));

  const supabase = await createServiceRoleClient();
  if (!supabase) return;

  // Find product pages
  const { data: productPages } = await supabase
    .from('scraped_pages')
    .select('id, url, title')
    .eq('domain_id', domainId)
    .ilike('url', '%10M-CC%')
    .limit(1);

  if (!productPages || productPages.length === 0) {
    console.log('No product page found for 10M-CC');
    return;
  }

  const productPage = productPages[0];
  console.log(`\nProduct: ${productPage.title}`);
  console.log(`URL: ${productPage.url}`);

  // Get all chunks for this product
  const { data: chunks } = await supabase
    .from('page_embeddings')
    .select('chunk_text, metadata')
    .eq('page_id', productPage.id)
    .order('metadata->chunk_index');

  if (!chunks || chunks.length === 0) {
    console.log('No chunks found for this product');
    return;
  }

  console.log(`\nTotal chunks: ${chunks.length}\n`);

  chunks.forEach((chunk: any, idx) => {
    const chunkIndex = chunk.metadata?.chunk_index ?? idx;
    console.log(`\nChunk ${chunkIndex}:`);
    console.log(`  Length: ${chunk.chunk_text.length} chars`);
    console.log(`  Content: ${chunk.chunk_text.substring(0, 200)}...`);

    // Analyze content
    const hasPrice = /£|\$|price|cost/i.test(chunk.chunk_text);
    const hasSKU = /10M-CC/i.test(chunk.chunk_text);
    const hasSpec = /IP69K|waterproof|cable/i.test(chunk.chunk_text);
    const hasNav = /menu|navigation|home|categories/i.test(chunk.chunk_text);

    const features: string[] = [];
    if (hasPrice) features.push('Price info');
    if (hasSKU) features.push('SKU');
    if (hasSpec) features.push('Technical specs');
    if (hasNav) features.push('Navigation');

    if (features.length > 0) {
      console.log(`  Contains: ${features.join(', ')}`);
    }
  });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Agent 3: Simple Chunk Ranking Analysis             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const domainId = await getDomainId(TEST_DOMAIN);
  if (!domainId) {
    console.error('Domain not found');
    process.exit(1);
  }

  console.log(`Domain ID: ${domainId}\n`);

  // Test different queries
  const testQueries = [
    '10mtr extension cables for all TS Camera systems',
    '10M-CC',
    'extension cables price',
    'IP69K waterproof connectors'
  ];

  for (const query of testQueries) {
    await searchWithDetails(query, domainId, 5);
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
  }

  // Analyze the specific product
  await analyzeSpecificProduct(domainId);

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                         DONE                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
