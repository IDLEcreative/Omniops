import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateDatabase() {
  console.log('=== FORENSIC DATABASE INVESTIGATION ===\n');

  // 1. Check bulk_insert_embeddings function
  console.log('1. CHECKING BULK INSERT FUNCTION:');
  const { data: funcData, error: funcError } = await supabase.rpc('bulk_insert_embeddings', {
    embeddings: [] // Test with empty array
  });
  
  if (funcError) {
    console.log('❌ bulk_insert_embeddings function NOT FOUND or ERROR:', funcError.message);
  } else {
    console.log('✅ bulk_insert_embeddings function EXISTS and CALLABLE');
  }

  // 2. Check embedding statistics
  console.log('\n2. EMBEDDING STATISTICS:');
  
  const { count: totalPages } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true });
    
  const { count: embeddingCount } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true });
    
  console.log(`Total scraped pages: ${totalPages}`);
  console.log(`Total embedding records: ${embeddingCount}`);
  
  // Get unique pages with embeddings
  const { data: pagesWithEmbeddings } = await supabase
    .from('page_embeddings')
    .select('page_id')
    .limit(10000);
    
  const uniquePages = new Set(pagesWithEmbeddings?.map(e => e.page_id) || []);
  console.log(`Pages with embeddings: ${uniquePages.size}`);
  console.log(`Coverage: ${((uniquePages.size / (totalPages || 1)) * 100).toFixed(2)}%`);

  // 3. Check DC66-10P specific data
  console.log('\n3. DC66-10P PRODUCT INVESTIGATION:');
  const { data: dc66Pages, error: dc66Error } = await supabase
    .from('scraped_pages')
    .select('id, url, title, metadata')
    .or('content.ilike.%DC66-10P%,title.ilike.%DC66-10P%,metadata::text.ilike.%DC66-10P%')
    .limit(10);
    
  console.log(`Found ${dc66Pages?.length || 0} pages mentioning DC66-10P`);
  
  if (dc66Pages && dc66Pages.length > 0) {
    // Check embeddings for these pages
    const pageIds = dc66Pages.map(p => p.id);
    const { data: dc66Embeddings } = await supabase
      .from('page_embeddings')
      .select('page_id, chunk_index')
      .in('page_id', pageIds);
      
    const embeddingsByPage = new Map();
    dc66Embeddings?.forEach(e => {
      if (!embeddingsByPage.has(e.page_id)) {
        embeddingsByPage.set(e.page_id, []);
      }
      embeddingsByPage.get(e.page_id).push(e.chunk_index);
    });
    
    dc66Pages.forEach(page => {
      const embeddings = embeddingsByPage.get(page.id);
      console.log(`  - ${page.url}`);
      console.log(`    Title: ${page.title}`);
      console.log(`    Embeddings: ${embeddings ? embeddings.length + ' chunks' : '❌ NO EMBEDDINGS'}`);
    });
  }

  // 4. Check embedding format
  console.log('\n4. EMBEDDING FORMAT VERIFICATION:');
  const { data: sampleEmbeddings } = await supabase
    .from('page_embeddings')
    .select('id, embedding')
    .limit(3);
    
  sampleEmbeddings?.forEach((e, i) => {
    const isArray = Array.isArray(e.embedding);
    const dimensions = isArray ? e.embedding.length : 'N/A';
    console.log(`  Sample ${i+1}: ${isArray ? '✅ Array format' : '❌ NOT array'}, Dimensions: ${dimensions}`);
  });

  // 5. Check recent embedding activity
  console.log('\n5. RECENT EMBEDDING ACTIVITY:');
  const { data: recentEmbeddings } = await supabase
    .from('page_embeddings')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (recentEmbeddings && recentEmbeddings.length > 0) {
    console.log('  Latest embeddings created:');
    recentEmbeddings.forEach(e => {
      console.log(`    - ${new Date(e.created_at).toLocaleString()}`);
    });
  } else {
    console.log('  ❌ No recent embeddings found');
  }
  
  process.exit(0);
}

investigateDatabase().catch(console.error);
