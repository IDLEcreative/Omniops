import type { SupabaseClient } from '@supabase/supabase-js';

export async function insertEmbeddings(
  supabase: SupabaseClient,
  embeddingRecords: any[]
): Promise<boolean> {
  try {
    const { error: bulkError } = await supabase.rpc('bulk_insert_embeddings', { embeddings: embeddingRecords });
    if (!bulkError) {
      return true;
    }

    console.log('  ⚠️ Bulk insert failed, trying individual inserts...');
    let successCount = 0;

    for (const record of embeddingRecords) {
      const { error } = await supabase.from('page_embeddings').insert(record);
      if (error) {
        console.error(`    ❌ Failed chunk: "${record.chunk_text.substring(0, 50)}..."`, error.message);
      } else {
        successCount++;
      }
    }

    console.log(`    ✓ Inserted ${successCount}/${embeddingRecords.length} embeddings`);
    return successCount > 0;
  } catch (error) {
    console.error('  ❌ Insert failed:', error);
    return false;
  }
}
