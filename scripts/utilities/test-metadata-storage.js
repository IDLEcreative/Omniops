#!/usr/bin/env node

import { createClient  } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetadataStorage() {
  console.log('🔍 CHECKING METADATA STORAGE IN DATABASE');
  console.log('=' .repeat(60));
  
  try {
    // Get the most recent embedding with its metadata
    const { data: embeddings, error } = await supabase
      .from('page_embeddings')
      .select('id, page_id, chunk_text, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (error) {
      console.error('Error fetching embeddings:', error);
      return;
    }
    
    console.log(`\n📊 Found ${embeddings?.length || 0} recent embeddings\n`);
    
    for (const emb of embeddings || []) {
      console.log('─'.repeat(60));
      console.log(`Embedding ID: ${emb.id}`);
      console.log(`Created: ${emb.created_at}`);
      console.log(`Chunk preview: ${emb.chunk_text?.substring(0, 100)}...`);
      console.log('\n📦 Metadata stored:');
      
      if (emb.metadata) {
        // Pretty print the metadata
        const meta = emb.metadata;
        console.log(JSON.stringify(meta, null, 2));
        
        // Check which features are present
        console.log('\n✅ Features detected in this chunk:');
        if (meta.content_type) console.log('  • Content classification:', meta.content_type);
        if (meta.keywords) console.log('  • Keywords:', meta.keywords);
        if (meta.entities) console.log('  • Entities:', meta.entities);
        if (meta.price_range) console.log('  • Price info:', meta.price_range);
        if (meta.contact_info) console.log('  • Contact info:', meta.contact_info);
        if (meta.qa_pairs) console.log('  • Q&A pairs:', meta.qa_pairs);
        if (meta.readability_score) console.log('  • Readability score:', meta.readability_score);
        if (meta.semantic_density) console.log('  • Semantic density:', meta.semantic_density);
        if (meta.language) console.log('  • Language:', meta.language);
      } else {
        console.log('  ❌ No metadata found!');
      }
    }
    
    // Check a product page specifically
    console.log('\n' + '='.repeat(60));
    console.log('📦 CHECKING PRODUCT PAGE METADATA');
    console.log('='.repeat(60));
    
    const { data: productEmb } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .ilike('chunk_text', '%price%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (productEmb) {
      console.log('Found product-related chunk with price mention');
      if (productEmb.metadata?.price_range) {
        console.log('✅ Price extraction working:', productEmb.metadata.price_range);
      } else {
        console.log('❌ Price mentioned in text but not extracted to metadata');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMetadataStorage()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });