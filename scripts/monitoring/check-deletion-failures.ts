import { createServiceRoleClient } from '@/lib/supabase-server';

async function checkDeletionFailures() {
  const supabase = await createServiceRoleClient();

  console.log('📊 Embedding Deletion Failure Report\n');

  // Find pages that failed due to deletion errors
  const { data: failedPages } = await supabase
    .from('scraped_pages')
    .select('url, error_message, last_scraped_at')
    .eq('status', 'failed')
    .ilike('error_message', '%Embedding deletion failed%')
    .order('last_scraped_at', { ascending: false })
    .limit(20);

  if (!failedPages || failedPages.length === 0) {
    console.log('✅ No deletion failures found');
    return;
  }

  console.log(`⚠️ Found ${failedPages.length} pages with deletion failures:\n`);

  failedPages.forEach((page, i) => {
    console.log(`${i + 1}. ${page.url}`);
    console.log(`   Failed at: ${page.last_scraped_at}`);
    console.log(`   Error: ${page.error_message}\n`);
  });

  // Check for potential duplicate embeddings on these pages
  console.log('🔍 Checking for duplicate embeddings on failed pages...\n');

  for (const page of failedPages.slice(0, 5)) {
    // Check first 5
    const { data: pageData } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('url', page.url)
      .single();

    if (pageData) {
      const { count } = await supabase
        .from('page_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('page_id', pageData.id);

      if (count && count > 20) {
        console.log(
          `⚠️ ${page.url}: ${count} embeddings (possible duplicates)`
        );
      }
    }
  }
}

checkDeletionFailures().catch(console.error);
