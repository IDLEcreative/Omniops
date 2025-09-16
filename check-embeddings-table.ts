import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmbeddingsTable() {
  console.log('=== Checking page_embeddings table structure ===\n');
  
  // Get a sample row from page_embeddings
  const { data: sampleRow, error } = await supabase
    .from('page_embeddings')
    .select('*')
    .limit(1)
    .single();
  
  if (error) {
    console.log('Error fetching from page_embeddings:', error.message);
  } else if (sampleRow) {
    console.log('Sample row from page_embeddings:');
    console.log('Columns:', Object.keys(sampleRow));
    console.log('\nColumn details:');
    for (const [key, value] of Object.entries(sampleRow)) {
      const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
      console.log(`- ${key}: ${type}`);
      if (key === 'embedding' && Array.isArray(value)) {
        console.log(`  Embedding dimensions: ${value.length}`);
        console.log(`  First 5 values: [${value.slice(0, 5).join(', ')}...]`);
      }
    }
  }
  
  // Check if we can insert an embedding as an array
  console.log('\n=== Testing embedding insertion with array ===\n');
  
  // Get a real page_id to test with
  const { data: realPage } = await supabase
    .from('scraped_pages')
    .select('id')
    .limit(1)
    .single();
  
  if (realPage) {
    const testEmbedding = {
      page_id: realPage.id,
      chunk_text: 'Test chunk for debugging embedding insertion',
      embedding: new Array(1536).fill(0.1), // Array format
      metadata: { test: true, timestamp: new Date().toISOString() }
    };
    
    console.log('Attempting to insert with array format...');
    const { data: insertData, error: insertError } = await supabase
      .from('page_embeddings')
      .insert([testEmbedding])
      .select();
    
    if (insertError) {
      console.log('❌ Array format failed:', insertError.message);
      
      // Try with string format
      console.log('\nAttempting with string format...');
      const stringEmbedding = {
        ...testEmbedding,
        embedding: `[${new Array(1536).fill(0.1).join(',')}]` // String format
      };
      
      const { data: stringData, error: stringError } = await supabase
        .from('page_embeddings')
        .insert([stringEmbedding])
        .select();
      
      if (stringError) {
        console.log('❌ String format also failed:', stringError.message);
      } else {
        console.log('✅ String format succeeded!');
        // Clean up
        if (stringData && stringData[0]) {
          await supabase
            .from('page_embeddings')
            .delete()
            .eq('id', stringData[0].id);
          console.log('Test data cleaned up');
        }
      }
    } else {
      console.log('✅ Array format succeeded!');
      // Clean up
      if (insertData && insertData[0]) {
        await supabase
          .from('page_embeddings')
          .delete()
          .eq('id', insertData[0].id);
        console.log('Test data cleaned up');
      }
    }
  }
}

checkEmbeddingsTable().catch(console.error);