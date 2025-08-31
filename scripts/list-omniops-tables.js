#!/usr/bin/env node

/**
 * List Omniops Database Tables
 * Uses the Supabase service role key to list all tables
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listTables() {
  console.log('🔍 Fetching tables from Omniops database...\n');
  
  try {
    // Directly use known tables (most reliable approach)
    const useKnownTables = true;

    if (useKnownTables) {
      // List known tables from your schema
      const knownTables = [
        'customer_configs',
        'scraped_pages',
        'page_embeddings',
        'conversations',
        'messages',
        'website_content',
        'content_embeddings',
        'structured_extractions',
        'content_refresh_jobs',
        'scraping_jobs',
        'woocommerce_products',
        'woocommerce_settings',
        'abandoned_carts',
        'cart_items'
      ];
      
      console.log('📊 Known Tables in Omniops Database:\n');
      for (const table of knownTables) {
        // Get row count for each table
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`  • ${table}`);
        console.log(`    Rows: ${count || 0}`);
      }
    }

    // Show sample customer configs
    console.log('\n📋 Sample Customer Configurations:');
    const { data: customers } = await supabase
      .from('customer_configs')
      .select('domain, business_name, created_at')
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (customers && customers.length > 0) {
      customers.forEach(c => {
        console.log(`  • ${c.domain} - ${c.business_name || 'No name'}`);
      });
    }

    // Check for embeddings
    console.log('\n🔍 Embeddings Status:');
    const { count: pageEmbeddings } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    const { count: contentEmbeddings } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`  • Page embeddings: ${pageEmbeddings || 0}`);
    console.log(`  • Content embeddings: ${contentEmbeddings || 0}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listTables();