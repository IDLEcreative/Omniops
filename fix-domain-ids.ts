#!/usr/bin/env npx tsx
/**
 * Fix missing domain_id values in page_embeddings table
 * This is why vector search wasn't working!
 */

import { createServiceRoleClient } from './lib/supabase-server';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fixDomainIds() {
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  console.log('🔧 Fixing missing domain_id values in page_embeddings...\n');
  
  // Get domain ID for thompsonseparts
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
  
  if (!domain) {
    console.error('❌ Domain not found');
    return;
  }
  
  const domainId = domain.id;
  console.log(`Domain ID: ${domainId}`);
  
  // Get all pages for this domain
  const { data: pages, error: pageError } = await supabase
    .from('scraped_pages')
    .select('id')
    .eq('domain_id', domainId);
  
  if (pageError || !pages) {
    console.error('❌ Error fetching pages:', pageError);
    return;
  }
  
  console.log(`Found ${pages.length} pages for this domain`);
  
  // Update embeddings in batches
  const BATCH_SIZE = 100;
  let totalUpdated = 0;
  
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    const pageIds = batch.map(p => p.id);
    
    console.log(`Updating batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(pages.length/BATCH_SIZE)}...`);
    
    const { data, error } = await supabase
      .from('page_embeddings')
      .update({ domain_id: domainId })
      .in('page_id', pageIds)
      .is('domain_id', null)
      .select();
    
    if (error) {
      console.error(`❌ Error updating batch:`, error);
    } else if (data) {
      totalUpdated += data.length;
      console.log(`  ✅ Updated ${data.length} embeddings`);
    }
  }
  
  console.log(`\n✅ Total embeddings updated: ${totalUpdated}`);
  
  // Verify the fix
  console.log('\n📊 Verification:');
  
  const { count: withDomainId } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', domainId);
  
  const { count: withoutDomainId } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .is('domain_id', null);
  
  console.log(`  Embeddings WITH domain_id: ${withDomainId}`);
  console.log(`  Embeddings WITHOUT domain_id: ${withoutDomainId}`);
  
  if (withoutDomainId === 0) {
    console.log('\n🎉 All embeddings now have domain_id set!');
    console.log('Vector search should now work properly.');
  }
}

fixDomainIds().catch(console.error);