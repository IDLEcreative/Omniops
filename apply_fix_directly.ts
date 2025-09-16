import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  console.log('=== APPLYING CRITICAL FIX VIA SUPABASE RPC ===\n');
  
  // First, let's check current function and see what's happening
  console.log('1. Testing current bulk_insert_embeddings behavior...');
  
  // Find a test page
  const { data: testPage } = await supabase
    .from('scraped_pages')
    .select('id')
    .limit(1)
    .single();
    
  if (!testPage) {
    console.log('No test page found');
    return;
  }
  
  // Test with proper array format
  const testEmbedding = Array(1536).fill(0.1);
  console.log('Test embedding type:', typeof testEmbedding);
  console.log('Test embedding is array?:', Array.isArray(testEmbedding));
  
  const testData = [{
    page_id: testPage.id,
    chunk_text: 'Fix test ' + Date.now(),
    embedding: testEmbedding,
    metadata: { test: true }
  }];
  
  console.log('Calling bulk_insert_embeddings with array format...');
  const { data: insertResult, error: insertError } = await supabase.rpc('bulk_insert_embeddings', {
    embeddings: testData
  });
  
  if (insertError) {
    console.log('Insert error:', insertError);
  } else {
    console.log('Insert result:', insertResult);
    
    // Check how it was stored
    const { data: stored } = await supabase
      .from('page_embeddings')
      .select('id, embedding')
      .eq('chunk_text', testData[0].chunk_text)
      .single();
      
    if (stored) {
      console.log('\nHow it was stored:');
      console.log('  Type:', typeof stored.embedding);
      console.log('  Is Array?:', Array.isArray(stored.embedding));
      
      if (typeof stored.embedding === 'string') {
        console.log('  ❌ CONFIRMED: Embeddings being stored as strings!');
        console.log('  String preview:', stored.embedding.substring(0, 100));
      }
    }
  }
  
  // Now let's fix the existing embeddings
  console.log('\n2. Fixing existing string embeddings...');
  
  // Get a sample of string embeddings
  const { data: stringEmbeddings } = await supabase
    .from('page_embeddings')
    .select('id, embedding')
    .limit(10);
    
  if (stringEmbeddings) {
    let fixedCount = 0;
    
    for (const record of stringEmbeddings) {
      if (typeof record.embedding === 'string' && record.embedding.startsWith('[')) {
        try {
          // Parse the string to array
          const parsed = JSON.parse(record.embedding);
          
          // Update with proper array
          const { error: updateError } = await supabase
            .from('page_embeddings')
            .update({ embedding: parsed })
            .eq('id', record.id);
            
          if (!updateError) {
            fixedCount++;
          } else {
            console.log('Failed to fix embedding:', record.id, updateError.message);
          }
        } catch (e) {
          console.log('Failed to parse embedding:', record.id);
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} embeddings from string to array format`);
  }
  
  // Verify the fix
  console.log('\n3. Verifying fix...');
  const { data: afterFix } = await supabase
    .from('page_embeddings')
    .select('id, embedding')
    .limit(3);
    
  afterFix?.forEach((record, i) => {
    console.log(`  Sample ${i+1}:`);
    console.log(`    Type: ${typeof record.embedding}`);
    console.log(`    Is Array?: ${Array.isArray(record.embedding)}`);
  });
  
  process.exit(0);
}

applyFix().catch(console.error);
