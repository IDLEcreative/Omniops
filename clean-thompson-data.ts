#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanThompsonData() {
  console.log('🧹 Cleaning all Thompson\'s eParts data...\n');
  
  const domain = 'thompsonseparts.co.uk';
  
  try {
    // Get domain ID
    const { data: domainData, error: domainError } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', domain)
      .single();
    
    if (domainError || !domainData) {
      console.error('❌ Could not find domain:', domain);
      return;
    }
    
    const domainId = domainData.id;
    console.log(`📍 Found domain: ${domain} (ID: ${domainId})\n`);
    
    // Get counts before deletion
    const { count: pagesCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId);
    
    const { count: contentCount } = await supabase
      .from('website_content')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId);
    
    // Get embeddings count (they reference scraped_pages via page_id)
    const { data: pageIds } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('domain_id', domainId);
    
    let embeddingsCount = 0;
    if (pageIds && pageIds.length > 0) {
      const ids = pageIds.map(p => p.id);
      const { count } = await supabase
        .from('page_embeddings')
        .select('*', { count: 'exact', head: true })
        .in('page_id', ids);
      embeddingsCount = count || 0;
    }
    
    console.log('📊 Data to be deleted:');
    console.log(`   📄 Scraped Pages: ${pagesCount || 0}`);
    console.log(`   📝 Website Content: ${contentCount || 0}`);
    console.log(`   🔢 Embeddings: ${embeddingsCount}`);
    console.log('');
    
    // Countdown
    for (let i = 3; i > 0; i--) {
      process.stdout.write(`⏱️  Starting deletion in ${i} seconds... (Ctrl+C to cancel)\r`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n');
    
    // Delete in correct order (respecting foreign keys)
    console.log('🗑️  Deleting embeddings...');
    if (pageIds && pageIds.length > 0) {
      const ids = pageIds.map(p => p.id);
      // Delete in batches to avoid hitting limits
      const batchSize = 1000;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from('page_embeddings')
          .delete()
          .in('page_id', batch);
        
        if (error) {
          console.error('Error deleting embeddings:', error);
        } else {
          console.log(`   Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(ids.length/batchSize)}`);
        }
      }
    }
    
    console.log('🗑️  Deleting structured extractions...');
    const { error: extractionsError } = await supabase
      .from('structured_extractions')
      .delete()
      .eq('domain_id', domainId);
    
    if (extractionsError) {
      console.error('Error deleting extractions:', extractionsError);
    }
    
    console.log('🗑️  Deleting query cache...');
    const { error: cacheError } = await supabase
      .from('query_cache')
      .delete()
      .eq('domain_id', domainId);
    
    if (cacheError) {
      console.error('Error deleting cache:', cacheError);
    }
    
    console.log('🗑️  Deleting website content...');
    const { error: contentError } = await supabase
      .from('website_content')
      .delete()
      .eq('domain_id', domainId);
    
    if (contentError) {
      console.error('Error deleting content:', contentError);
    }
    
    console.log('🗑️  Deleting scraped pages...');
    const { error: pagesError } = await supabase
      .from('scraped_pages')
      .delete()
      .eq('domain_id', domainId);
    
    if (pagesError) {
      console.error('Error deleting pages:', pagesError);
    }
    
    // Clear Redis jobs
    console.log('🗑️  Clearing Redis scraping jobs...');
    const { spawn } = require('child_process');
    const redis = spawn('redis-cli', ['--scan', '--pattern', '*thompson*']);
    redis.stdout.on('data', (data: Buffer) => {
      const keys = data.toString().trim().split('\n').filter(k => k);
      if (keys.length > 0) {
        const deleteCmd = spawn('redis-cli', ['del', ...keys]);
        deleteCmd.on('close', () => {
          console.log(`   Deleted ${keys.length} Redis keys`);
        });
      }
    });
    
    console.log('\n✅ Successfully cleaned all Thompson\'s eParts data!');
    console.log('📝 The domain configuration remains intact.');
    console.log('🚀 Ready for a fresh scrape!\n');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

cleanThompsonData();