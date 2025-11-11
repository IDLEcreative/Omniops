import { createServiceRoleClient } from '@/lib/supabase-server';

export async function analyzeChunkMetadata(domain: string) {
  console.log('\n=== CHUNK METADATA ANALYSIS ===\n');

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

  const domainId = domainData.id;

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
    `,
  });

  console.log('Top 20 Pages by Chunk Count:');
  console.log(JSON.stringify(chunkStats, null, 2));

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
    console.log('Metadata:', chunk.metadata);
    console.log(`Content: ${chunk.chunk_text.substring(0, 200)}...`);
    console.log(`Length: ${chunk.chunk_text.length} chars`);
  });
}
