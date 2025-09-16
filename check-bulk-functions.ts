import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBulkFunctions() {
  console.log('=== Checking for Bulk Functions in Database ===\n');

  // Try calling the bulk functions to see if they exist
  console.log('Testing bulk_upsert_scraped_pages...');
  try {
    // Try with empty array to see if function exists
    const { data, error } = await supabase.rpc('bulk_upsert_scraped_pages', { 
      pages: [] 
    });
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ bulk_upsert_scraped_pages NOT FOUND');
      } else {
        console.log('⚠️ bulk_upsert_scraped_pages EXISTS but returned error:', error.message);
      }
    } else {
      console.log('✅ bulk_upsert_scraped_pages EXISTS (returned empty result as expected)');
    }
  } catch (e: any) {
    console.log('❌ Error checking bulk_upsert_scraped_pages:', e.message);
  }

  console.log('\nTesting bulk_insert_embeddings...');
  try {
    // Try with empty array to see if function exists
    const { data, error } = await supabase.rpc('bulk_insert_embeddings', {
      embeddings: []
    });
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ bulk_insert_embeddings NOT FOUND');
      } else {
        console.log('⚠️ bulk_insert_embeddings EXISTS but returned error:', error.message);
      }
    } else {
      console.log('✅ bulk_insert_embeddings EXISTS (returned:', data, ')');
    }
  } catch (e: any) {
    console.log('❌ Error checking bulk_insert_embeddings:', e.message);
  }

  // Check when embeddings were last created
  console.log('\n=== Checking Embedding Generation Status ===\n');
  
  const { data: lastEmbedding } = await supabase
    .from('page_embeddings')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastEmbedding) {
    const lastCreated = new Date(lastEmbedding.created_at);
    const daysSince = Math.floor((Date.now() - lastCreated.getTime()) / (1000 * 60 * 60 * 24));
    console.log('Last embedding created:', lastEmbedding.created_at);
    console.log(`That was ${daysSince} days ago`);
  }

  // Count pages with and without embeddings
  const { count: totalPages } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true });

  // Get distinct page IDs that have embeddings
  const { data: pagesWithEmbeddingsData } = await supabase
    .from('page_embeddings')
    .select('page_id')
    .limit(10000); // Get a large sample

  const uniquePageIds = new Set(pagesWithEmbeddingsData?.map((p: any) => p.page_id) || []);
  const pagesWithEmbeddings = uniquePageIds.size;

  console.log(`\nTotal scraped pages: ${totalPages}`);
  console.log(`Pages with embeddings: ${pagesWithEmbeddings}`);
  console.log(`Pages WITHOUT embeddings: ${(totalPages || 0) - pagesWithEmbeddings}`);
  
  if (totalPages && totalPages > 0) {
    const percentage = (pagesWithEmbeddings / totalPages) * 100;
    console.log(`Embedding coverage: ${percentage.toFixed(1)}%`);
  }

  // Check for recent scraping activity
  console.log('\n=== Recent Scraping Activity ===\n');
  
  const { data: recentPages } = await supabase
    .from('scraped_pages')
    .select('url, created_at, status')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentPages && recentPages.length > 0) {
    console.log('Recent scraped pages:');
    recentPages.forEach((page: any) => {
      const created = new Date(page.created_at);
      const hoursAgo = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60));
      console.log(`- ${page.created_at} (${hoursAgo}h ago): ${page.url} [${page.status}]`);
    });
  }

  // Check pages without embeddings
  console.log('\n=== Sample Pages Without Embeddings ===\n');
  
  const { data: pagesNoEmbeddings } = await supabase
    .from('scraped_pages')
    .select('id, url, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (pagesNoEmbeddings) {
    // Filter to find pages without embeddings
    const pageIds = pagesNoEmbeddings.map((p: any) => p.id);
    const { data: embeddings } = await supabase
      .from('page_embeddings')
      .select('page_id')
      .in('page_id', pageIds);
    
    const pageIdsWithEmbeddings = new Set(embeddings?.map((e: any) => e.page_id) || []);
    const orphanPages = pagesNoEmbeddings.filter((p: any) => !pageIdsWithEmbeddings.has(p.id));
    
    if (orphanPages.length > 0) {
      console.log(`Found ${orphanPages.length} recent pages without embeddings:`);
      orphanPages.slice(0, 5).forEach((page: any) => {
        console.log(`- ${page.created_at}: ${page.url}`);
      });
    }
  }
}

checkBulkFunctions().catch(console.error);