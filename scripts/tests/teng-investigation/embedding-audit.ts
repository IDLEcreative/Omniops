import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScrapedPage } from './types';

export async function checkEmbeddings(client: SupabaseClient, tengPages: ScrapedPage[]) {
  console.log('\n📋 Step 8: Checking embeddings tables for this domain...');

  if (tengPages.length === 0) {
    console.log('ℹ️  No Teng pages available to check embeddings for.');
    return;
  }

  const pageIds = tengPages.map(page => page.id);

  const { count: embeddingCount, error: embeddingError } = await client
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .in('page_id', pageIds);

  if (embeddingError) {
    console.log('ℹ️  Cannot check page_embeddings:', embeddingError.message);
  } else {
    console.log(`✅ Found ${embeddingCount || 0} embeddings for Teng pages`);
  }
}
