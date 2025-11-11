import { generateQueryEmbedding } from '@/lib/embeddings';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function testChunkIndexImpact(domain: string) {
  console.log('\n=== CHUNK INDEX IMPACT ANALYSIS ===\n');

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    return;
  }

  const { data: domainData } = await supabase
    .from('customer_configs')
    .select('id')
    .ilike('domain', `%${domain}%`)
    .single();

  if (!domainData) {
    console.error('Domain not found');
    return;
  }

  const { id: domainId } = domainData;
  const testQuery = '10mtr extension cables';
  console.log(`Test Query: "${testQuery}"\n`);

  const queryEmbedding = await generateQueryEmbedding(testQuery, false, domain);

  const { data: results } = await supabase.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    p_domain_id: domainId,
    match_threshold: 0.15,
    match_count: 20,
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

      const productChunks = chunks.filter((c) => c.url?.includes('/product/'));
      console.log(`  Product Chunks: ${productChunks.length}/${chunks.length}`);

      if (chunks.length > 0) {
        console.log(`  Top Result: ${chunks[0].similarity.toFixed(4)} - ${chunks[0].title?.substring(0, 50)}`);
      }
      console.log();
    });

  const chunk0Results = resultsByIndex['0'] || [];
  const otherChunks = results?.filter((r: any) => r.metadata?.chunk_index !== 0) || [];

  if (chunk0Results.length > 0 && otherChunks.length > 0) {
    const chunk0Avg = chunk0Results.reduce((sum, c) => sum + c.similarity, 0) / chunk0Results.length;
    const otherAvg = otherChunks.reduce((sum: number, c: any) => sum + c.similarity, 0) / otherChunks.length;

    console.log('\n=== CHUNK 0 vs OTHER CHUNKS ===');
    console.log(`Chunk 0 Average Similarity: ${chunk0Avg.toFixed(4)}`);
    console.log(`Other Chunks Average Similarity: ${otherAvg.toFixed(4)}`);
    console.log(
      `Difference: ${(chunk0Avg - otherAvg).toFixed(4)} (${chunk0Avg > otherAvg ? 'Chunk 0 scores HIGHER' : 'Other chunks score HIGHER'})`
    );
  }
}
