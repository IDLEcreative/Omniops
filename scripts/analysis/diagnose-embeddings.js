import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient  } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  try {
    const testDomain = 'thompsonseparts.co.uk';
    
    console.log('🔍 Diagnosing embeddings issue...\n');
    
    // Get domain
    const { data: domain } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', testDomain)
      .single();
    
    console.log(`Domain ID: ${domain.id}\n`);
    
    // Check scraped_pages
    const { data: pages, count: pagesCount } = await supabase
      .from('scraped_pages')
      .select('id, url', { count: 'exact' })
      .eq('domain_id', domain.id)
      .limit(5);
    
    console.log(`Scraped pages for domain: ${pagesCount}`);
    console.log('Sample page IDs:');
    pages?.forEach(p => console.log(`  ${p.id} - ${p.url}`));
    
    if (pages && pages.length > 0) {
      // Check if these pages have embeddings
      const pageIds = pages.map(p => p.id);
      
      console.log('\n📊 Checking embeddings for these pages...');
      const { data: embeddings, count: embCount } = await supabase
        .from('page_embeddings')
        .select('id, page_id, chunk_text', { count: 'exact' })
        .in('page_id', pageIds)
        .limit(5);
      
      console.log(`Embeddings found for these pages: ${embCount}`);
      
      if (embeddings && embeddings.length > 0) {
        console.log('✅ Embeddings exist and are linked!');
        embeddings.forEach(e => {
          console.log(`  Embedding ${e.id} -> Page ${e.page_id}`);
          console.log(`    Content: ${e.chunk_text?.substring(0, 100)}...`);
        });
      } else {
        console.log('❌ No embeddings found for these page IDs');
        
        // Check if embeddings exist at all
        const { count: totalEmb } = await supabase
          .from('page_embeddings')
          .select('*', { count: 'exact', head: true });
        
        console.log(`\nTotal embeddings in table: ${totalEmb}`);
        
        // Get a sample embedding to see its structure
        const { data: sampleEmb } = await supabase
          .from('page_embeddings')
          .select('page_id, metadata')
          .limit(1)
          .single();
        
        if (sampleEmb) {
          console.log('\nSample embedding structure:');
          console.log(`  page_id: ${sampleEmb.page_id}`);
          console.log(`  metadata: ${JSON.stringify(sampleEmb.metadata, null, 2)}`);
          
          // Check if this page_id exists in scraped_pages
          const { data: pageCheck } = await supabase
            .from('scraped_pages')
            .select('id, url, domain_id')
            .eq('id', sampleEmb.page_id)
            .single();
          
          if (pageCheck) {
            console.log('\n✅ Sample embedding page exists:');
            console.log(`  URL: ${pageCheck.url}`);
            console.log(`  Domain ID: ${pageCheck.domain_id}`);
          } else {
            console.log('\n❌ Sample embedding page_id does NOT exist in scraped_pages!');
            console.log('   This means embeddings are orphaned.');
          }
        }
      }
    }
    
    // Try a direct SQL query to see what's happening
    console.log('\n📝 Testing the actual SQL join...');
    const { data: joinTest, error: joinError } = await supabase
      .rpc('search_embeddings', {
        query_embedding: new Array(1536).fill(0.1),
        p_domain_id: null,  // No filter
        match_threshold: 0.0,  // Accept everything
        match_count: 1
      });
    
    if (joinError) {
      console.error('Join test error:', joinError);
    } else if (joinTest && joinTest.length > 0) {
      console.log('✅ Join works! Found result:');
      console.log(`   URL: ${joinTest[0].url}`);
      console.log(`   Title: ${joinTest[0].title}`);
    } else {
      console.log('❌ No results even with no filters - embeddings might be orphaned');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

diagnose();