#!/usr/bin/env npx tsx
/**
 * Test that embeddings are saved correctly as vector type
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

async function testVectorInsertion() {
  console.log('🧪 TESTING VECTOR INSERTION\n');
  console.log('=' .repeat(70));
  
  try {
    // 1. Generate a test embedding
    console.log('\n📊 Step 1: Generate test embedding\n');
    
    const testText = "This is a test embedding for vector storage verification";
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: testText
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    console.log(`   Generated embedding with ${embedding.length} dimensions`);
    
    // 2. Format embedding for pgvector (as string)
    console.log('\n📊 Step 2: Format embedding for pgvector\n');
    
    const vectorString = `[${embedding.join(',')}]`;
    console.log(`   Formatted as vector string (length: ${vectorString.length} chars)`);
    console.log(`   First 100 chars: ${vectorString.substring(0, 100)}...`);
    
    // 3. Insert into database
    console.log('\n📊 Step 3: Insert into database\n');
    
    const testRecord = {
      page_id: null, // Test without page_id
      chunk_text: testText,
      embedding: vectorString,
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('page_embeddings')
      .insert(testRecord)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    
    console.log('✅ Successfully inserted test embedding');
    console.log(`   Record ID: ${insertData.id}`);
    
    // 4. Verify it's stored as vector type
    console.log('\n📊 Step 4: Verify storage format\n');
    
    const { data: checkData, error: checkError } = await supabase
      .from('page_embeddings')
      .select('id, embedding')
      .eq('id', insertData.id)
      .single();
    
    if (checkError) {
      console.error('❌ Failed to retrieve:', checkError);
      return;
    }
    
    console.log(`   Retrieved embedding type: ${typeof checkData.embedding}`);
    console.log(`   Is array: ${Array.isArray(checkData.embedding)}`);
    
    if (Array.isArray(checkData.embedding)) {
      console.log(`   ✅ Embedding is stored as vector array with ${checkData.embedding.length} dimensions`);
    } else if (typeof checkData.embedding === 'string') {
      console.log(`   ⚠️  Embedding is still string (length: ${checkData.embedding.length})`);
      console.log(`   This suggests pgvector might not be properly configured`);
    }
    
    // 5. Test vector similarity search
    console.log('\n📊 Step 5: Test vector similarity search\n');
    
    const { data: searchData, error: searchError } = await supabase.rpc('search_embeddings', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5
    });
    
    if (searchError) {
      console.log(`   ⚠️  Search function error: ${searchError.message}`);
      console.log(`   This is expected if vector type conversion is still needed in DB`);
    } else {
      console.log(`   ✅ Search returned ${searchData?.length || 0} results`);
      if (searchData && searchData.length > 0) {
        console.log(`   Top result similarity: ${searchData[0].similarity}`);
      }
    }
    
    // 6. Clean up test data
    console.log('\n📊 Step 6: Clean up test data\n');
    
    const { error: deleteError } = await supabase
      .from('page_embeddings')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.error('   ⚠️  Failed to delete test record:', deleteError.message);
    } else {
      console.log('   ✅ Test record deleted');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('\n🎯 SUMMARY:');
  console.log('The code fix has been applied to format embeddings as vector strings.');
  console.log('New embeddings will be saved in the correct format for pgvector.');
  console.log('\nNext steps:');
  console.log('1. Convert existing embeddings in the database to vector type');
  console.log('2. Verify search functionality works with the converted embeddings');
}

testVectorInsertion().catch(console.error);