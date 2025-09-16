import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function investigateColumnType() {
  console.log('=== INVESTIGATING COLUMN TYPE ISSUE ===\n');
  
  // Try raw SQL query to check column type
  console.log('1. Checking actual column data type...');
  
  // Use a different approach - query pg_attribute
  const { data: typeCheck, error: typeError } = await supabase
    .from('page_embeddings')
    .select('*')
    .limit(1);
    
  if (typeCheck && typeCheck[0]) {
    console.log('Sample record structure:');
    Object.entries(typeCheck[0]).forEach(([key, value]) => {
      if (key === 'embedding') {
        console.log(`  ${key}: type=${typeof value}, isArray=${Array.isArray(value)}`);
        if (typeof value === 'string') {
          console.log(`    String length: ${value.length}`);
          console.log(`    Starts with: ${value.substring(0, 50)}`);
        }
      }
    });
  }
  
  // Try inserting with raw SQL
  console.log('\n2. Testing direct SQL insert with array...');
  
  // Get a test page
  const { data: page } = await supabase
    .from('scraped_pages')
    .select('id')
    .limit(1)
    .single();
    
  if (page) {
    // Create embedding as proper numeric array
    const embedding = Array(1536).fill(0.2);
    
    // Try direct insert with ARRAY constructor
    const { data: sqlResult, error: sqlError } = await supabase
      .from('page_embeddings')
      .insert({
        page_id: page.id,
        chunk_text: 'Direct insert test ' + Date.now(),
        embedding: embedding, // Pass as JavaScript array
        metadata: { direct_test: true }
      })
      .select();
      
    if (sqlError) {
      console.log('Direct insert error:', sqlError.message);
    } else if (sqlResult && sqlResult[0]) {
      console.log('Direct insert successful!');
      console.log('Stored as:', typeof sqlResult[0].embedding);
      console.log('Is array?:', Array.isArray(sqlResult[0].embedding));
    }
  }
  
  // Check if it's a Supabase client issue
  console.log('\n3. Testing if Supabase client is serializing arrays to JSON strings...');
  
  const testArray = [1, 2, 3];
  console.log('Original array:', testArray);
  console.log('Type:', typeof testArray);
  
  // Test with metadata field (JSONB)
  const { data: metadataTest } = await supabase
    .from('page_embeddings')
    .insert({
      page_id: page?.id || '00000000-0000-0000-0000-000000000000',
      chunk_text: 'Metadata array test',
      embedding: Array(1536).fill(0.3),
      metadata: { test_array: testArray }
    })
    .select()
    .single();
    
  if (metadataTest) {
    console.log('Metadata array stored as:', typeof metadataTest.metadata.test_array);
    console.log('Metadata array is array?:', Array.isArray(metadataTest.metadata.test_array));
    console.log('Embedding stored as:', typeof metadataTest.embedding);
    console.log('Embedding is array?:', Array.isArray(metadataTest.embedding));
  }
  
  process.exit(0);
}

investigateColumnType().catch(console.error);
