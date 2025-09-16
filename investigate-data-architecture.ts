import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const domainId = '8dccd788-1ec1-43c2-af56-78aa3366bad3';
  console.log('🔍 INVESTIGATING DATA ARCHITECTURE DISCONNECT');
  console.log('=============================================\n');

  // 1. Check if website_content table has ANY data
  console.log('1. CHECKING website_content TABLE:');
  const { count: totalChunks } = await supabase
    .from('website_content')
    .select('*', { count: 'exact', head: true });
  console.log(`   Total chunks in website_content: ${totalChunks}`);

  // 2. Check page_embeddings table structure
  console.log('\n2. CHECKING page_embeddings TABLE:');
  const { count: totalEmbeddings } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true });
  console.log(`   Total embeddings: ${totalEmbeddings}`);

  // Get sample embeddings to understand the data
  const { data: sampleEmbeddings } = await supabase
    .from('page_embeddings')
    .select('id, page_id, chunk_index, created_at')
    .limit(5);
  console.log('   Sample embeddings:');
  sampleEmbeddings?.forEach(e => {
    console.log(`     - Embedding ${e.id.substring(0, 8)}... | page_id: ${e.page_id?.substring(0, 8) || 'NULL'}... | chunk_index: ${e.chunk_index} | created: ${e.created_at}`);
  });

  // 3. Check if page_embeddings.page_id references scraped_pages
  console.log('\n3. CHECKING page_id REFERENCES:');
  const { data: embeddingWithPage } = await supabase
    .from('page_embeddings')
    .select('id, page_id')
    .not('page_id', 'is', null)
    .limit(1);

  if (embeddingWithPage && embeddingWithPage[0]) {
    const pageId = embeddingWithPage[0].page_id;
    const { data: page } = await supabase
      .from('scraped_pages')
      .select('url, title, domain_id')
      .eq('id', pageId)
      .single();
    
    if (page) {
      console.log(`   ✅ Found page for embedding: ${page.url}`);
      console.log(`      Domain ID: ${page.domain_id}`);
    } else {
      console.log(`   ❌ No scraped_page found for page_id: ${pageId}`);
    }
  }

  // 4. Check embeddings for our specific domain
  console.log('\n4. EMBEDDINGS FOR thompsonseparts.co.uk:');
  
  // Get all page IDs for this domain
  const { data: domainPages } = await supabase
    .from('scraped_pages')
    .select('id')
    .eq('domain_id', domainId)
    .limit(100);
  
  const pageIds = domainPages?.map(p => p.id) || [];
  
  // Count embeddings for these pages
  const { count: domainEmbeddingCount } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .in('page_id', pageIds);
  
  console.log(`   Pages for domain: ${pageIds.length}`);
  console.log(`   Embeddings for these pages: ${domainEmbeddingCount}`);

  // 5. Check for orphaned embeddings (embeddings without scraped_pages)
  console.log('\n5. CHECKING FOR ORPHANED EMBEDDINGS:');
  const { data: allEmbeddings } = await supabase
    .from('page_embeddings')
    .select('page_id')
    .limit(500);
  
  const uniquePageIds = [...new Set(allEmbeddings?.map(e => e.page_id).filter(Boolean))];
  
  // Check how many of these page_ids exist in scraped_pages
  const { data: existingPages } = await supabase
    .from('scraped_pages')
    .select('id')
    .in('id', uniquePageIds);
  
  const existingPageIds = new Set(existingPages?.map(p => p.id));
  const orphanedPageIds = uniquePageIds.filter(id => !existingPageIds.has(id));
  
  console.log(`   Total unique page_ids in embeddings: ${uniquePageIds.length}`);
  console.log(`   Existing in scraped_pages: ${existingPageIds.size}`);
  console.log(`   Orphaned (no scraped_page): ${orphanedPageIds.length}`);
  
  if (orphanedPageIds.length > 0) {
    console.log(`   Sample orphaned page_ids: ${orphanedPageIds.slice(0, 3).join(', ')}`);
  }

  // 6. Check the actual embedding generation process
  console.log('\n6. RECENT EMBEDDING GENERATION ACTIVITY:');
  const { data: recentEmbeddings } = await supabase
    .from('page_embeddings')
    .select('created_at, page_id')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (recentEmbeddings && recentEmbeddings.length > 0) {
    console.log('   Last 10 embeddings created:');
    for (const emb of recentEmbeddings) {
      const { data: page } = await supabase
        .from('scraped_pages')
        .select('url, domain_id')
        .eq('id', emb.page_id)
        .single();
      
      const domainMatch = page?.domain_id === domainId ? '✅' : '❌';
      console.log(`     ${emb.created_at} | ${domainMatch} ${page?.url?.substring(0, 50) || 'NO PAGE FOUND'}...`);
    }
  }

  // 7. Check if there's a different chunking mechanism
  console.log('\n7. ALTERNATIVE CHUNKING INVESTIGATION:');
  
  // Check if embeddings have content directly
  const { data: embeddingContent } = await supabase
    .from('page_embeddings')
    .select('content')
    .limit(1);
  
  if (embeddingContent && embeddingContent[0]?.content) {
    console.log(`   ✅ Embeddings contain content directly (${embeddingContent[0].content.length} chars)`);
    console.log(`   Sample: ${embeddingContent[0].content.substring(0, 100)}...`);
  } else {
    console.log('   ❌ Embeddings do not contain content directly');
  }

  // 8. Check scraped_pages content
  console.log('\n8. SCRAPED_PAGES CONTENT CHECK:');
  const { data: pagesWithContent } = await supabase
    .from('scraped_pages')
    .select('id, url, content')
    .eq('domain_id', domainId)
    .not('content', 'is', null)
    .limit(3);
  
  if (pagesWithContent && pagesWithContent.length > 0) {
    console.log(`   Found ${pagesWithContent.length} pages with content`);
    pagesWithContent.forEach(p => {
      console.log(`     - ${p.url.substring(0, 50)}... | Content: ${p.content?.length || 0} chars`);
    });
  }

  // CONCLUSION
  console.log('\n' + '='.repeat(80));
  console.log('📊 ARCHITECTURE ANALYSIS SUMMARY:');
  console.log('='.repeat(80));
  
  if (totalChunks === 0) {
    console.log('❌ CRITICAL: website_content table is completely empty');
    console.log('   → The system is NOT using the traditional chunking pipeline');
  }
  
  if (domainEmbeddingCount === 0) {
    console.log('❌ CRITICAL: No embeddings exist for thompsonseparts.co.uk pages');
    console.log('   → The 326 embeddings belong to OTHER domains or are orphaned');
  } else {
    console.log(`✅ Found ${domainEmbeddingCount} embeddings for thompsonseparts.co.uk`);
  }
  
  console.log('\n🔧 LIKELY ROOT CAUSE:');
  console.log('   1. The embedding generation process is disabled or broken');
  console.log('   2. The website_content chunking step is being skipped entirely');
  console.log('   3. Embeddings may be generated directly from scraped_pages.content');
  console.log('   4. The system may need manual embedding regeneration');
}

main().catch(console.error);