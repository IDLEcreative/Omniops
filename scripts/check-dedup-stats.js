#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStats() {
  console.log('Checking deduplication statistics...\n');
  
  // Get total embeddings count
  const { count: totalEmbeddings } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total embeddings in database: ${totalEmbeddings}`);
  
  // Get recent pages
  const { data: recentPages } = await supabase
    .from('scraped_pages')
    .select('id, url, last_scraped_at')
    .order('last_scraped_at', { ascending: false })
    .limit(5);
  
  console.log('\nMost recent scrapes:');
  for (const page of recentPages || []) {
    const { count } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', page.id);
    
    console.log(`- ${page.url.substring(0, 50)}... : ${count} embeddings`);
  }
  
  // Check for duplicate chunk_text
  const { data: duplicates } = await supabase
    .rpc('check_duplicate_chunks');
  
  if (duplicates && duplicates.length > 0) {
    console.log(`\nFound ${duplicates.length} groups of duplicate chunks`);
  } else {
    console.log('\nNo duplicate chunks found (deduplication working!)');
  }
  
  console.log('\n✓ Deduplication check complete');
}

checkStats().catch(console.error);