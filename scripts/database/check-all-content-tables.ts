/**
 * Check All Content Tables
 * Check website_content, structured_extractions, and other tables
 */

import { createServiceRoleClient } from '../../lib/supabase/server';

async function checkAllContentTables() {
  const supabase = await createServiceRoleClient();

  console.log('\n🔍 Checking all content storage tables:\n');

  // Check website_content table
  const { count: websiteContentCount } = await supabase
    .from('website_content')
    .select('id', { count: 'exact' })
    .limit(1);

  console.log(`📄 website_content table: ${websiteContentCount || 0} records`);

  // Check structured_extractions
  const { count: extractionsCount } = await supabase
    .from('structured_extractions')
    .select('id', { count: 'exact' })
    .limit(1);

  console.log(`📦 structured_extractions table: ${extractionsCount || 0} records`);

  // Check scraped_pages
  const { count: scrapedCount } = await supabase
    .from('scraped_pages')
    .select('id', { count: 'exact' })
    .limit(1);

  console.log(`📄 scraped_pages table: ${scrapedCount || 0} records`);

  // Check page_embeddings
  const { count: embeddingsCount } = await supabase
    .from('page_embeddings')
    .select('id', { count: 'exact' })
    .limit(1);

  console.log(`🔢 page_embeddings table: ${embeddingsCount || 0} records`);

  // Get sample from website_content if it has data
  if (websiteContentCount && websiteContentCount > 0) {
    const { data: samples } = await supabase
      .from('website_content')
      .select('domain, url, title')
      .limit(5);

    console.log('\n📋 Sample website_content records:');
    samples?.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.domain}: ${s.title || s.url}`);
    });
  }

  console.log('\n');
}

checkAllContentTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
