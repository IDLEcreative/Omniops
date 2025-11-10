import { createServiceRoleClient } from '@/lib/supabase-server';

async function cleanupDeletedPages() {
  const supabase = await createServiceRoleClient();

  console.log('🧹 Starting cleanup of deleted pages...\n');

  // Find pages marked as deleted more than 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: deletedPages, error: fetchError } = await supabase
    .from('scraped_pages')
    .select('id, url, last_scraped_at')
    .eq('status', 'deleted')
    .lt('last_scraped_at', thirtyDaysAgo.toISOString());

  if (fetchError) {
    console.error('❌ Error fetching deleted pages:', fetchError);
    return;
  }

  console.log(`Found ${deletedPages?.length || 0} pages to clean up`);

  if (!deletedPages || deletedPages.length === 0) {
    console.log('✅ No cleanup needed');
    return;
  }

  // Delete pages (CASCADE will auto-delete embeddings)
  const pageIds = deletedPages.map(p => p.id);

  const { error: deleteError } = await supabase
    .from('scraped_pages')
    .delete()
    .in('id', pageIds);

  if (deleteError) {
    console.error('❌ Error deleting pages:', deleteError);
    return;
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`   - Deleted ${deletedPages.length} pages`);
  console.log(`   - Embeddings auto-deleted by CASCADE`);

  // Log deleted URLs
  console.log('\n📋 Deleted URLs:');
  deletedPages.forEach(page => {
    console.log(`   - ${page.url} (last seen: ${page.last_scraped_at})`);
  });
}

// Run if executed directly
if (require.main === module) {
  cleanupDeletedPages().catch(console.error);
}

// Export for use in cron job
export default cleanupDeletedPages;
