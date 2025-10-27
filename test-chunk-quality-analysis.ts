/**
 * Agent 3: Comprehensive Chunk Quality & Semantic Search Analysis
 *
 * This script tests semantic search behavior to understand:
 * 1. Which chunks are returned for different query types
 * 2. Why navigation chunks often rank higher than product details
 * 3. How similarity scoring affects results
 * 4. Potential improvements for chunk ranking
 */

import { searchSimilarContent, generateQueryEmbedding } from '@/lib/embeddings';
import { createServiceRoleClient } from '@/lib/supabase-server';

interface TestQuery {
  name: string;
  query: string;
  expectedType: 'product' | 'navigation' | 'general';
  description: string;
}

interface ChunkAnalysis {
  query: string;
  resultsCount: number;
  avgSimilarity: number;
  chunkTypes: Record<string, number>;
  topResults: Array<{
    similarity: number;
    title: string;
    url: string;
    contentPreview: string;
    chunkLength: number;
  }>;
}

const TEST_QUERIES: TestQuery[] = [
  {
    name: 'Specific Product with SKU',
    query: '10mtr extension cables for all TS Camera systems',
    expectedType: 'product',
    description: 'Full product description from the product page'
  },
  {
    name: 'SKU Lookup',
    query: '10M-CC',
    expectedType: 'product',
    description: 'Direct SKU code search'
  },
  {
    name: 'Price Query',
    query: 'extension cables price',
    expectedType: 'product',
    description: 'Query combining product feature and pricing intent'
  },
  {
    name: 'Technical Specification',
    query: 'IP69K waterproof connectors',
    expectedType: 'product',
    description: 'Technical spec that appears in product details'
  },
  {
    name: 'Category Query',
    query: 'camera cables',
    expectedType: 'navigation',
    description: 'Broad category that might match navigation'
  },
  {
    name: 'Generic Product Type',
    query: 'extension cables',
    expectedType: 'general',
    description: 'General term that could match many pages'
  }
];

const TEST_DOMAIN = 'thompsonseparts.co.uk';

async function analyzeChunkMetadata(domain: string) {
  console.log('\n=== CHUNK METADATA ANALYSIS ===\n');

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    return;
  }

  // Get domain_id
  const { data: domainData } = await supabase
    .from('customer_configs')
    .select('id')
    .ilike('domain', `%${domain}%`)
    .single();

  if (!domainData) {
    console.error('Domain not found');
    return;
  }

  const domainId = domainData.id;

  // Analyze chunk distribution
  const { data: chunkStats } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        sp.url,
        sp.title,
        COUNT(pe.id) as chunk_count,
        AVG(LENGTH(pe.chunk_text)) as avg_chunk_length,
        MIN(LENGTH(pe.chunk_text)) as min_chunk_length,
        MAX(LENGTH(pe.chunk_text)) as max_chunk_length,
        pe.metadata->>'chunk_index' as first_chunk_metadata
      FROM page_embeddings pe
      JOIN scraped_pages sp ON pe.page_id = sp.id
      WHERE pe.domain_id = '${domainId}'
      GROUP BY sp.url, sp.title, pe.metadata->>'chunk_index'
      ORDER BY chunk_count DESC
      LIMIT 20;
    `
  });

  console.log('Top 20 Pages by Chunk Count:');
  console.log(JSON.stringify(chunkStats, null, 2));

  // Analyze specific product page chunks
  const { data: productChunks } = await supabase
    .from('page_embeddings')
    .select(`
      chunk_text,
      metadata,
      scraped_pages!inner(url, title)
    `)
    .eq('domain_id', domainId)
    .ilike('scraped_pages.url', '%/product/%')
    .limit(10);

  console.log('\n\nSample Product Page Chunks:');
  productChunks?.forEach((chunk: any, idx) => {
    console.log(`\n--- Chunk ${idx + 1} ---`);
    console.log(`URL: ${chunk.scraped_pages.url}`);
    console.log(`Title: ${chunk.scraped_pages.title}`);
    console.log(`Metadata:`, chunk.metadata);
    console.log(`Content: ${chunk.chunk_text.substring(0, 200)}...`);
    console.log(`Length: ${chunk.chunk_text.length} chars`);
  });
}

async function testQueryVariations() {
  console.log('\n=== QUERY VARIATION TESTING ===\n');

  const results: ChunkAnalysis[] = [];

  for (const testQuery of TEST_QUERIES) {
    console.log(`\n--- Testing: ${testQuery.name} ---`);
    console.log(`Query: "${testQuery.query}"`);
    console.log(`Expected: ${testQuery.expectedType}`);
    console.log(`Description: ${testQuery.description}`);

    try {
      const chunks = await searchSimilarContent(
        testQuery.query,
        TEST_DOMAIN,
        5, // limit
        0.15 // threshold
      );

      console.log(`\nResults: ${chunks.length} chunks found`);

      const analysis: ChunkAnalysis = {
        query: testQuery.query,
        resultsCount: chunks.length,
        avgSimilarity: chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length || 0,
        chunkTypes: {},
        topResults: []
      };

      chunks.forEach((chunk, idx) => {
        console.log(`\n[${idx + 1}] Similarity: ${chunk.similarity.toFixed(4)}`);
        console.log(`    Title: ${chunk.title}`);
        console.log(`    URL: ${chunk.url}`);
        console.log(`    Content: ${chunk.content.substring(0, 150)}...`);
        console.log(`    Length: ${chunk.content.length} chars`);

        // Classify chunk type
        let chunkType = 'unknown';
        if (chunk.url.includes('/product/')) {
          chunkType = 'product';
        } else if (chunk.url === '/') {
          chunkType = 'homepage';
        } else if (chunk.content.toLowerCase().includes('navigation') ||
                   chunk.content.toLowerCase().includes('menu')) {
          chunkType = 'navigation';
        } else if (chunk.url.includes('/category/') || chunk.url.includes('/shop/')) {
          chunkType = 'category';
        } else {
          chunkType = 'general';
        }

        analysis.chunkTypes[chunkType] = (analysis.chunkTypes[chunkType] || 0) + 1;

        analysis.topResults.push({
          similarity: chunk.similarity,
          title: chunk.title,
          url: chunk.url,
          contentPreview: chunk.content.substring(0, 100),
          chunkLength: chunk.content.length
        });
      });

      results.push(analysis);

      console.log(`\nChunk Type Distribution:`);
      Object.entries(analysis.chunkTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log(`Average Similarity: ${analysis.avgSimilarity.toFixed(4)}`);

    } catch (error) {
      console.error(`Error testing query "${testQuery.query}":`, error);
    }

    // Pause between queries to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

async function testSimilarityScoreDistribution() {
  console.log('\n=== SIMILARITY SCORE DISTRIBUTION ANALYSIS ===\n');

  const testQuery = 'IP69K waterproof connectors';
  console.log(`Testing with query: "${testQuery}"`);

  // Test with different thresholds
  const thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30];

  for (const threshold of thresholds) {
    console.log(`\n--- Threshold: ${threshold} ---`);

    const chunks = await searchSimilarContent(
      testQuery,
      TEST_DOMAIN,
      10, // Get more results to see distribution
      threshold
    );

    console.log(`Results: ${chunks.length} chunks`);

    if (chunks.length > 0) {
      const scores = chunks.map(c => c.similarity);
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);

      console.log(`  Average: ${avgScore.toFixed(4)}`);
      console.log(`  Min: ${minScore.toFixed(4)}`);
      console.log(`  Max: ${maxScore.toFixed(4)}`);
      console.log(`  Range: ${(maxScore - minScore).toFixed(4)}`);

      // Show score distribution
      console.log('\n  Score Distribution:');
      chunks.forEach((chunk, idx) => {
        const isProduct = chunk.url.includes('/product/');
        console.log(`    ${idx + 1}. ${chunk.similarity.toFixed(4)} ${isProduct ? '[PRODUCT]' : '[OTHER]'} - ${chunk.title.substring(0, 50)}`);
      });
    }
  }
}

async function analyzeSearchEmbeddingsFunction() {
  console.log('\n=== SEARCH_EMBEDDINGS FUNCTION ANALYSIS ===\n');

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    return;
  }

  // Get the function definition
  const { data: funcDef } = await supabase.rpc('execute_sql', {
    query: `
      SELECT pg_get_functiondef(pg_proc.oid) AS function_definition
      FROM pg_proc
      JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
      WHERE pg_namespace.nspname = 'public'
        AND proname = 'search_embeddings';
    `
  });

  console.log('Current search_embeddings Function:');
  console.log(funcDef?.[0]?.function_definition || 'Function not found');

  console.log('\n\n=== HOW IT WORKS ===');
  console.log('1. Uses cosine distance operator (<=>) for similarity');
  console.log('2. Formula: similarity = 1 - (embedding <=> query_embedding)');
  console.log('3. Filters by: similarity > match_threshold');
  console.log('4. Orders by: embedding <=> query_embedding (ascending = most similar first)');
  console.log('5. Returns: top match_count results');

  console.log('\n\n=== KEY INSIGHTS ===');
  console.log('✓ Cosine distance measures angular similarity between vectors');
  console.log('✓ Lower distance = higher similarity');
  console.log('✓ No weighting based on chunk_index, chunk_type, or URL');
  console.log('✓ Navigation chunks may score high because they appear on many pages');
  console.log('  (More training data = more generalized embeddings)');
}

async function testChunkIndexImpact() {
  console.log('\n=== CHUNK INDEX IMPACT ANALYSIS ===\n');

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    return;
  }

  // Get domain_id
  const { data: domainData } = await supabase
    .from('customer_configs')
    .select('id')
    .ilike('domain', `%${TEST_DOMAIN}%`)
    .single();

  if (!domainData) {
    console.error('Domain not found');
    return;
  }

  const domainId = domainData.id;

  // Generate embedding for test query
  const testQuery = '10mtr extension cables';
  console.log(`Test Query: "${testQuery}"\n`);

  const queryEmbedding = await generateQueryEmbedding(testQuery, false, TEST_DOMAIN);

  // Get results with chunk_index information
  const { data: results } = await supabase.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    p_domain_id: domainId,
    match_threshold: 0.15,
    match_count: 20
  });

  console.log('Results by Chunk Index:\n');

  const resultsByIndex: Record<string, any[]> = {};

  results?.forEach((result: any) => {
    const chunkIndex = result.metadata?.chunk_index ?? 'unknown';
    if (!resultsByIndex[chunkIndex]) {
      resultsByIndex[chunkIndex] = [];
    }
    resultsByIndex[chunkIndex].push(result);
  });

  Object.entries(resultsByIndex)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([index, chunks]) => {
      console.log(`Chunk Index ${index}: ${chunks.length} results`);
      const avgSim = chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length;
      console.log(`  Average Similarity: ${avgSim.toFixed(4)}`);

      const productChunks = chunks.filter(c => c.url?.includes('/product/'));
      console.log(`  Product Chunks: ${productChunks.length}/${chunks.length}`);

      if (chunks.length > 0) {
        console.log(`  Top Result: ${chunks[0].similarity.toFixed(4)} - ${chunks[0].title?.substring(0, 50)}`);
      }
      console.log();
    });

  // Analyze: Do first chunks (index 0) typically have higher similarity?
  const chunk0Results = resultsByIndex['0'] || [];
  const otherChunks = results?.filter((r: any) => r.metadata?.chunk_index !== 0) || [];

  if (chunk0Results.length > 0 && otherChunks.length > 0) {
    const chunk0Avg = chunk0Results.reduce((sum, c) => sum + c.similarity, 0) / chunk0Results.length;
    const otherAvg = otherChunks.reduce((sum: number, c: any) => sum + c.similarity, 0) / otherChunks.length;

    console.log('\n=== CHUNK 0 vs OTHER CHUNKS ===');
    console.log(`Chunk 0 Average Similarity: ${chunk0Avg.toFixed(4)}`);
    console.log(`Other Chunks Average Similarity: ${otherAvg.toFixed(4)}`);
    console.log(`Difference: ${(chunk0Avg - otherAvg).toFixed(4)} (${chunk0Avg > otherAvg ? 'Chunk 0 scores HIGHER' : 'Other chunks score HIGHER'})`);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Agent 3: Chunk Quality & Semantic Search Analysis       ║');
  console.log('║   Test Domain: thompsonseparts.co.uk                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Analyze search_embeddings function
    await analyzeSearchEmbeddingsFunction();

    // 2. Analyze chunk metadata and distribution
    await analyzeChunkMetadata(TEST_DOMAIN);

    // 3. Test different query variations
    const queryResults = await testQueryVariations();

    // 4. Test similarity score distributions
    await testSimilarityScoreDistribution();

    // 5. Test chunk index impact
    await testChunkIndexImpact();

    // Generate summary report
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SUMMARY REPORT                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('## Test Execution Summary\n');
    console.log(`Total Queries Tested: ${TEST_QUERIES.length}`);
    console.log(`Test Domain: ${TEST_DOMAIN}`);
    console.log(`Similarity Threshold: 0.15`);

    console.log('\n## Key Findings\n');
    console.log('See detailed results above for:');
    console.log('1. Query variation results and chunk type distribution');
    console.log('2. Similarity score distributions across thresholds');
    console.log('3. Chunk index impact on ranking');
    console.log('4. search_embeddings function behavior analysis');

    console.log('\n## Recommendations\n');
    console.log('Based on the analysis above, recommendations will be generated in the final report.');

  } catch (error) {
    console.error('Error during analysis:', error);
    throw error;
  }
}

// Run the analysis
main()
  .then(() => {
    console.log('\n✓ Analysis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Analysis failed:', error);
    process.exit(1);
  });
