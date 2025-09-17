import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanContaminatedEmbeddings() {
  console.log('Starting cleanup of contaminated embeddings...');
  
  try {
    // 1. Identify contaminated embeddings (navigation menus and CSS)
    console.log('\n📊 Analyzing contamination patterns...');
    
    // Common navigation patterns to identify contaminated embeddings
    const navPatterns = [
      'Shop by Category',
      'Tipper Skip & Hookloaders',
      'Facebook Twitter Email Pinterest',
      'Manage consent',
      'Request a Call Back',
      'T: 01254'
    ];
    
    // CSS/JavaScript patterns
    const cssPatterns = [
      'gform_wrapper',
      'font-size:',
      'font-weight:',
      '<style>',
      '<link rel=',
      'onload=',
      'onerror='
    ];
    
    // Get sample of recent embeddings to check contamination
    const { data: recentEmbeddings, error: fetchError } = await supabase
      .from('page_embeddings')
      .select('id, page_id, chunk_text')
      .gte('created_at', '2024-09-14T00:00:00')
      .limit(100);
    
    if (fetchError) {
      console.error('Error fetching embeddings:', fetchError);
      return;
    }
    
    console.log(`Fetched ${recentEmbeddings?.length || 0} recent embeddings for analysis`);
    
    // Count contaminated embeddings
    let navContaminated = 0;
    let cssContaminated = 0;
    const contaminatedPageIds = new Set<string>();
    
    recentEmbeddings?.forEach(embedding => {
      const content = embedding.chunk_text || '';
      
      const hasNav = navPatterns.some(pattern => content.includes(pattern));
      const hasCss = cssPatterns.some(pattern => content.includes(pattern));
      
      if (hasNav) navContaminated++;
      if (hasCss) cssContaminated++;
      if (hasNav || hasCss) {
        contaminatedPageIds.add(embedding.page_id);
      }
    });
    
    console.log(`\n⚠️  Contamination found:`);
    console.log(`   - Navigation menus: ${navContaminated}/${recentEmbeddings?.length} embeddings`);
    console.log(`   - CSS/JavaScript: ${cssContaminated}/${recentEmbeddings?.length} embeddings`);
    console.log(`   - Affected pages: ${contaminatedPageIds.size}`);
    
    // 2. Delete embeddings from pages with NULL text_content (these are all contaminated)
    console.log('\n🗑️  Cleaning embeddings from pages with NULL text_content...');
    
    const { data: nullTextPages, error: nullError } = await supabase
      .from('scraped_pages')
      .select('id')
      .is('text_content', null)
      .gte('scraped_at', '2024-09-14T00:00:00');
    
    if (nullError) {
      console.error('Error finding pages with NULL text_content:', nullError);
      return;
    }
    
    console.log(`Found ${nullTextPages?.length || 0} pages with NULL text_content`);
    
    if (nullTextPages && nullTextPages.length > 0) {
      const pageIds = nullTextPages.map(p => p.id);
      
      // Delete in batches to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < pageIds.length; i += batchSize) {
        const batch = pageIds.slice(i, i + batchSize);
        
        const { error: deleteError, count } = await supabase
          .from('page_embeddings')
          .delete()
          .in('page_id', batch);
        
        if (deleteError) {
          console.error('Error deleting embeddings:', deleteError);
        } else {
          console.log(`Deleted embeddings for batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pageIds.length/batchSize)}`);
        }
      }
    }
    
    // 3. Delete embeddings with high contamination scores
    console.log('\n🔍 Removing highly contaminated embeddings...');
    
    // Delete embeddings that contain navigation menus or CSS
    for (const pattern of [...navPatterns, ...cssPatterns]) {
      const { error: patternDeleteError, count } = await supabase
        .from('page_embeddings')
        .delete()
        .ilike('chunk_text', `%${pattern}%`)
        .gte('created_at', '2024-09-14T00:00:00');
      
      if (patternDeleteError) {
        console.error(`Error deleting embeddings with pattern "${pattern}":`, patternDeleteError);
      } else if (count && count > 0) {
        console.log(`Deleted ${count} embeddings containing "${pattern.substring(0, 30)}..."`);
      }
    }
    
    // 4. Final statistics
    console.log('\n✅ Cleanup complete!');
    
    const { count: remainingCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', '2024-09-14T00:00:00');
    
    console.log(`Remaining recent embeddings: ${remainingCount}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Run the scraper with the fixed code to regenerate clean embeddings');
    console.log('2. Monitor for any new contamination');
    console.log('3. Consider running full rescrape on affected domains');
    
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
  }
}

// Add command-line argument parsing
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (dryRun) {
  console.log('DRY RUN MODE - No changes will be made');
  console.log('Remove --dry-run flag to execute cleanup');
} else {
  console.log('⚠️  WARNING: This will delete contaminated embeddings from the database');
  console.log('Press Ctrl+C within 5 seconds to cancel...\n');
  
  setTimeout(() => {
    cleanContaminatedEmbeddings();
  }, 5000);
}