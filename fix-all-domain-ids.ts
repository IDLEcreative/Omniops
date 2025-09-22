#!/usr/bin/env npx tsx
/**
 * Comprehensive fix for all NULL domain_ids in page_embeddings
 * Processes in small batches to avoid timeouts
 */

import { createServiceRoleClient } from './lib/supabase-server';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fixAllDomainIds() {
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  console.log('🔧 Starting comprehensive domain_id fix...');
  console.log('📊 This will update ALL embeddings with NULL domain_id\n');

  const TARGET_DOMAIN_ID = '8dccd788-1ec1-43c2-af56-78aa3366bad3';
  
  // First, get a count of what needs fixing
  const { count: totalToFix } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .is('domain_id', null);

  console.log(`📊 Found ${totalToFix || 0} embeddings with NULL domain_id\n`);

  if (!totalToFix || totalToFix === 0) {
    console.log('✅ No embeddings to fix!');
    return;
  }

  // Process in very small batches to avoid timeouts
  const BATCH_SIZE = 500; // Small batch to avoid timeouts
  let totalUpdated = 0;
  let consecutiveFailures = 0;
  const MAX_FAILURES = 3;

  console.log(`Processing in batches of ${BATCH_SIZE}...\n`);

  while (totalUpdated < totalToFix && consecutiveFailures < MAX_FAILURES) {
    try {
      // Get a batch of NULL domain_id embeddings
      const { data: batch, error: fetchError } = await supabase
        .from('page_embeddings')
        .select('id, page_id')
        .is('domain_id', null)
        .limit(BATCH_SIZE);

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        consecutiveFailures++;
        continue;
      }

      if (!batch || batch.length === 0) {
        console.log('✅ No more embeddings to update!');
        break;
      }

      // Get unique page_ids from this batch
      const pageIds = [...new Set(batch.map(b => b.page_id))];
      
      // Get domain_ids for these pages
      const { data: pageInfo, error: pageError } = await supabase
        .from('scraped_pages')
        .select('id, domain_id')
        .in('id', pageIds)
        .eq('domain_id', TARGET_DOMAIN_ID);

      if (pageError) {
        console.error('❌ Page fetch error:', pageError);
        consecutiveFailures++;
        continue;
      }

      if (!pageInfo || pageInfo.length === 0) {
        console.log('⚠️ No matching pages found for this batch');
        // These embeddings don't belong to our target domain, skip them
        // Update them to a placeholder to avoid reprocessing
        const embeddingIds = batch.map(b => b.id);
        await supabase
          .from('page_embeddings')
          .delete()
          .in('id', embeddingIds);
        console.log(`🗑️ Deleted ${embeddingIds.length} orphaned embeddings`);
        continue;
      }

      // Create a set of valid page_ids for our domain
      const validPageIds = new Set(pageInfo.map(p => p.id));
      
      // Filter batch to only include embeddings for our domain
      const validEmbeddings = batch.filter(b => validPageIds.has(b.page_id));
      
      if (validEmbeddings.length === 0) {
        console.log('⚠️ No valid embeddings in this batch');
        continue;
      }

      // Update these embeddings with the domain_id
      const embeddingIds = validEmbeddings.map(e => e.id);
      
      // Split into smaller chunks for the update
      const UPDATE_CHUNK_SIZE = 100;
      for (let i = 0; i < embeddingIds.length; i += UPDATE_CHUNK_SIZE) {
        const chunk = embeddingIds.slice(i, i + UPDATE_CHUNK_SIZE);
        
        const { error: updateError } = await supabase
          .from('page_embeddings')
          .update({ domain_id: TARGET_DOMAIN_ID })
          .in('id', chunk);

        if (updateError) {
          console.error('❌ Update error:', updateError);
          consecutiveFailures++;
        } else {
          totalUpdated += chunk.length;
          consecutiveFailures = 0; // Reset on success
          process.stdout.write(`\r✅ Updated: ${totalUpdated}/${totalToFix} (${Math.round(totalUpdated * 100 / totalToFix)}%)`);
        }
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      consecutiveFailures++;
      
      if (consecutiveFailures >= MAX_FAILURES) {
        console.error('\n❌ Too many consecutive failures, stopping...');
        break;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n\n📈 Update Complete!');
  console.log(`✅ Successfully updated: ${totalUpdated} embeddings`);

  // Final verification
  const { count: remaining } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .is('domain_id', null);

  const { count: withDomain } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', TARGET_DOMAIN_ID);

  console.log('\n📊 Final Statistics:');
  console.log(`  ✅ Embeddings WITH domain_id: ${withDomain || 0}`);
  console.log(`  ❌ Embeddings WITHOUT domain_id: ${remaining || 0}`);
  
  if (remaining && remaining > 0) {
    console.log(`\n⚠️ Note: ${remaining} embeddings still have NULL domain_id.`);
    console.log('These may belong to other domains or be orphaned records.');
  }
}

// Run the fix
fixAllDomainIds()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });