import { createClient  } from '@supabase/supabase-js';

const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmbeddingMetadata() {
  console.log('🔍 CHECKING VECTOR EMBEDDING METADATA STRUCTURE\n');
  console.log('='.repeat(60));
  
  // First, get a sample of scraped pages
  const { data: samplePages } = await supabase
    .from('scraped_pages')
    .select('id, url, title, metadata')
    .like('url', '%thompsonseparts%')
    .limit(3);
    
  console.log('\n📄 SCRAPED PAGES TABLE - Metadata Structure:');
  console.log('-'.repeat(60));
  
  if (samplePages && samplePages.length > 0) {
    samplePages.forEach((page, index) => {
      console.log(`\nPage ${index + 1}:`);
      console.log(`  URL: ${page.url}`);
      console.log(`  Title: ${page.title}`);
      console.log(`  Metadata stored:`, JSON.stringify(page.metadata, null, 2));
    });
  }
  
  // Now check the page_embeddings table
  console.log('\n\n🧠 PAGE_EMBEDDINGS TABLE - Metadata Structure:');
  console.log('-'.repeat(60));
  
  const { data: sampleEmbeddings } = await supabase
    .from('page_embeddings')
    .select('id, page_id, chunk_text, metadata')
    .in('page_id', samplePages?.map(p => p.id) || [])
    .limit(5);
    
  if (sampleEmbeddings && sampleEmbeddings.length > 0) {
    sampleEmbeddings.forEach((embedding, index) => {
      console.log(`\nEmbedding ${index + 1}:`);
      console.log(`  Page ID: ${embedding.page_id}`);
      console.log(`  Chunk preview: "${embedding.chunk_text.substring(0, 100)}..."`);
      console.log(`  Metadata:`, JSON.stringify(embedding.metadata, null, 2));
      
      // Find which page this embedding belongs to
      const parentPage = samplePages?.find(p => p.id === embedding.page_id);
      if (parentPage) {
        console.log(`  Parent page URL: ${parentPage.url}`);
      }
    });
  }
  
  // Check if there's a direct link between embeddings and URLs
  console.log('\n\n🔗 URL TRACKING IN EMBEDDINGS:');
  console.log('-'.repeat(60));
  
  const { data: embeddingWithUrl } = await supabase
    .from('page_embeddings')
    .select(`
      id,
      metadata,
      page_id,
      scraped_pages!inner(url, title)
    `)
    .limit(2);
    
  if (embeddingWithUrl) {
    console.log('\nEmbeddings ARE linked to source URLs through page_id relationship:');
    embeddingWithUrl.forEach((emb, index) => {
      console.log(`\nExample ${index + 1}:`);
      console.log(`  Embedding ID: ${emb.id}`);
      console.log(`  Source URL: ${emb.scraped_pages?.url}`);
      console.log(`  Source Title: ${emb.scraped_pages?.title}`);
      console.log(`  Embedding Metadata:`, JSON.stringify(emb.metadata, null, 2));
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Metadata structure analysis complete!\n');
}

checkEmbeddingMetadata().catch(console.error);