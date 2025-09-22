#!/usr/bin/env npx tsx
/**
 * Script to fix NULL domain_id issues in the database
 * 
 * This script:
 * 1. Recovers conversation domain_ids from metadata
 * 2. Cleans up orphaned scraped pages
 * 3. Adds NOT NULL constraints to prevent future issues
 */

import { createServiceRoleClient } from './lib/supabase/server';

async function fixNullDomainIds() {
  console.log('🔧 Starting NULL domain_id fix...\n');
  
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('❌ Failed to initialize Supabase client');
    process.exit(1);
  }

  // Step 1: Check current NULL situation
  console.log('📊 Analyzing current NULL domain_id situation...');
  
  const { data: nullStats } = await supabase.rpc('get_null_domain_stats', {});
  
  // Manual check since RPC might not exist
  const { data: conversationNulls, count: convCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .is('domain_id', null);
  
  const { data: scrapedNulls, count: scrapedCount } = await supabase
    .from('scraped_pages')
    .select('id, url', { count: 'exact' })
    .is('domain_id', null);
  
  console.log(`Found ${convCount || 0} conversations with NULL domain_id`);
  console.log(`Found ${scrapedCount || 0} scraped pages with NULL domain_id\n`);

  // Step 2: Fix conversations - try to recover from metadata
  if (convCount && convCount > 0) {
    console.log('🔄 Attempting to recover conversation domain_ids...');
    
    // Get the default domain
    const { data: domains } = await supabase
      .from('domains')
      .select('id, domain')
      .order('created_at', { ascending: true });
    
    if (domains && domains.length > 0) {
      const defaultDomainId = domains[0].id;
      console.log(`Using default domain: ${domains[0].domain} (${defaultDomainId})`);
      
      // First try to recover from metadata
      const { data: conversationsWithMetadata } = await supabase
        .from('conversations')
        .select('id, metadata')
        .is('domain_id', null)
        .not('metadata', 'is', null);
      
      let recoveredCount = 0;
      
      if (conversationsWithMetadata) {
        for (const conv of conversationsWithMetadata) {
          if (conv.metadata && typeof conv.metadata === 'object') {
            const metadataDomain = (conv.metadata as any).domain;
            if (metadataDomain) {
              // Try to find matching domain
              const matchingDomain = domains.find(d => 
                d.domain === metadataDomain || 
                d.domain === metadataDomain.replace(/^https?:\/\//, '').replace('www.', '')
              );
              
              if (matchingDomain) {
                const { error } = await supabase
                  .from('conversations')
                  .update({ domain_id: matchingDomain.id })
                  .eq('id', conv.id);
                
                if (!error) {
                  recoveredCount++;
                }
              }
            }
          }
        }
      }
      
      console.log(`✅ Recovered ${recoveredCount} conversations from metadata`);
      
      // Update remaining conversations with default domain
      const { error: updateError, count: updatedCount } = await supabase
        .from('conversations')
        .update({ domain_id: defaultDomainId })
        .is('domain_id', null);
      
      if (updateError) {
        console.error('❌ Error updating conversations:', updateError);
      } else {
        console.log(`✅ Updated ${updatedCount || 0} remaining conversations with default domain`);
      }
    } else {
      console.log('⚠️ No domains found in database. Skipping conversation fix.');
    }
  }

  // Step 3: Clean up orphaned scraped pages
  if (scrapedCount && scrapedCount > 0) {
    console.log('\n🗑️ Cleaning up orphaned scraped pages...');
    
    // Show what we're about to delete
    if (scrapedNulls) {
      console.log('Pages to be deleted:');
      scrapedNulls.forEach((page: any) => {
        console.log(`  - ${page.url}`);
      });
    }
    
    const { error: deleteError, count: deletedCount } = await supabase
      .from('scraped_pages')
      .delete()
      .is('domain_id', null);
    
    if (deleteError) {
      console.error('❌ Error deleting orphaned pages:', deleteError);
    } else {
      console.log(`✅ Deleted ${deletedCount || 0} orphaned scraped pages`);
    }
  }

  // Step 4: Add NOT NULL constraints
  console.log('\n🔒 Adding NOT NULL constraints to prevent future issues...');
  
  // Note: These constraints can only be added if there are no NULL values
  const constraints = [
    {
      table: 'conversations',
      column: 'domain_id',
      sql: 'ALTER TABLE conversations ALTER COLUMN domain_id SET NOT NULL;'
    },
    {
      table: 'scraped_pages',
      column: 'domain_id',
      sql: 'ALTER TABLE scraped_pages ALTER COLUMN domain_id SET NOT NULL;'
    }
  ];
  
  for (const constraint of constraints) {
    // Check if there are still NULLs
    const { count: nullCount } = await supabase
      .from(constraint.table)
      .select('*', { count: 'exact' })
      .is(constraint.column, null);
    
    if (nullCount === 0) {
      console.log(`✅ ${constraint.table}.${constraint.column} has no NULLs - constraint can be added`);
      console.log(`   Run this SQL in Supabase Dashboard: ${constraint.sql}`);
    } else {
      console.log(`⚠️ ${constraint.table}.${constraint.column} still has ${nullCount} NULLs - cannot add constraint yet`);
    }
  }

  // Step 5: Final verification
  console.log('\n📊 Final verification...');
  
  const { count: finalConvNulls } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .is('domain_id', null);
  
  const { count: finalScrapedNulls } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact' })
    .is('domain_id', null);
  
  console.log(`Conversations with NULL domain_id: ${finalConvNulls || 0}`);
  console.log(`Scraped pages with NULL domain_id: ${finalScrapedNulls || 0}`);
  
  if (finalConvNulls === 0 && finalScrapedNulls === 0) {
    console.log('\n✅ All NULL domain_id issues have been resolved!');
    console.log('\n📝 Next steps:');
    console.log('1. Run the SQL constraints in Supabase Dashboard to prevent future NULLs');
    console.log('2. Test the chat functionality to ensure new conversations get proper domain_ids');
  } else {
    console.log('\n⚠️ Some NULL domain_id issues remain. Please investigate manually.');
  }
}

// Run the script
fixNullDomainIds().catch(console.error);