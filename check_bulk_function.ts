import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBulkInsertFunction() {
  console.log('=== CHECKING BULK_INSERT_EMBEDDINGS FUNCTION ===\n');
  
  // Get function definition directly via SQL
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'bulk_insert_embeddings'
    `
  }).single();
  
  if (error) {
    // Try alternate approach - direct query
    console.log('Cannot get function definition via RPC, checking if function exists...');
    
    // Test function with proper format
    const testEmbedding = Array(1536).fill(0.1); // Create test embedding
    const testRecord = {
      page_id: '00000000-0000-0000-0000-000000000000',
      chunk_text: 'test',
      embedding: testEmbedding,
      metadata: { test: true }
    };
    
    const { data: testResult, error: testError } = await supabase.rpc('bulk_insert_embeddings', {
      embeddings: [testRecord]
    });
    
    if (testError) {
      console.log('Function test failed:', testError.message);
    } else {
      console.log('Function exists and is callable');
      console.log('Test result:', testResult);
    }
  } else {
    console.log('Function definition found:', data?.definition);
  }
  
  // Check table column type
  console.log('\n=== CHECKING TABLE COLUMN TYPE ===');
  const { data: columnInfo, error: colError } = await supabase.rpc('execute_sql', {
    query: `
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'page_embeddings' 
      AND column_name = 'embedding'
    `
  }).single();
  
  if (colError) {
    console.log('Column check via direct query...');
    // Try to insert a proper vector and see what happens
    const testVector = Array(1536).fill(0.1);
    const { error: insertError } = await supabase
      .from('page_embeddings')
      .insert({
        page_id: '00000000-0000-0000-0000-000000000000',
        chunk_text: 'test vector format',
        embedding: testVector,
        metadata: { test: true }
      });
      
    if (insertError) {
      console.log('Insert with array failed:', insertError.message);
    } else {
      console.log('Insert with array succeeded');
    }
  } else {
    console.log('Column info:', columnInfo);
  }
  
  process.exit(0);
}

checkBulkInsertFunction().catch(console.error);
