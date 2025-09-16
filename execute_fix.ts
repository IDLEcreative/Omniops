import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ACCESS_TOKEN = 'sbp_e4d7036b3b088c5f67bf623f0f72f2c079bc0233';
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

async function executeFix() {
  console.log('=== EXECUTING CRITICAL FIX FOR EMBEDDING STORAGE ===\n');
  
  // Read the SQL fix
  const sqlFix = fs.readFileSync('fix_bulk_insert_function.sql', 'utf-8');
  
  // Execute via Management API
  console.log('Executing fix via Supabase Management API...');
  
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sqlFix })
    }
  );
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('✅ Fix applied successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    // Now verify the fix
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n=== VERIFYING FIX ===');
    
    // Check embedding format after fix
    const { data: sample } = await supabase
      .from('page_embeddings')
      .select('id, embedding')
      .limit(1)
      .single();
      
    if (sample) {
      console.log('Sample embedding after fix:');
      console.log('  Type:', typeof sample.embedding);
      console.log('  Is Array?:', Array.isArray(sample.embedding));
      console.log('  Dimensions:', Array.isArray(sample.embedding) ? sample.embedding.length : 'N/A');
    }
    
    // Check embedding statistics
    const { count: totalEmbeddings } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
      
    console.log('\nTotal embeddings in database:', totalEmbeddings);
    
    // Test new bulk insert with proper format
    console.log('\n=== TESTING NEW BULK INSERT ===');
    
    // Find a real page to test with
    const { data: testPage } = await supabase
      .from('scraped_pages')
      .select('id')
      .limit(1)
      .single();
      
    if (testPage) {
      const testEmbedding = Array(1536).fill(0.1);
      const { data: insertResult, error: insertError } = await supabase.rpc('bulk_insert_embeddings', {
        embeddings: [{
          page_id: testPage.id,
          chunk_text: 'Test after fix',
          embedding: testEmbedding,
          metadata: { test: true, fixed: true }
        }]
      });
      
      if (insertError) {
        console.log('❌ Insert test failed:', insertError.message);
      } else {
        console.log('✅ Insert test successful! Inserted:', insertResult);
        
        // Verify the inserted embedding
        const { data: verifyData } = await supabase
          .from('page_embeddings')
          .select('embedding')
          .eq('chunk_text', 'Test after fix')
          .single();
          
        if (verifyData) {
          console.log('Verification of new insert:');
          console.log('  Type:', typeof verifyData.embedding);
          console.log('  Is Array?:', Array.isArray(verifyData.embedding));
        }
      }
    }
  } else {
    console.error('❌ Failed to apply fix:', result);
  }
}

executeFix().catch(console.error);
