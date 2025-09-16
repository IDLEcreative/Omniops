import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateEmbeddingFormat() {
  console.log('=== CRITICAL: EMBEDDING FORMAT INVESTIGATION ===\n');

  // Get raw sample to see actual database format
  const { data: rawSample, error } = await supabase
    .from('page_embeddings')
    .select('id, page_id, embedding, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (rawSample) {
    console.log('Latest embedding record:');
    console.log('  ID:', rawSample.id);
    console.log('  Page ID:', rawSample.page_id);
    console.log('  Created:', rawSample.created_at);
    console.log('  Embedding type:', typeof rawSample.embedding);
    console.log('  Is Array?:', Array.isArray(rawSample.embedding));
    
    if (typeof rawSample.embedding === 'string') {
      console.log('  ❌ CRITICAL: Embedding stored as STRING!');
      console.log('  String preview:', rawSample.embedding.substring(0, 100));
      
      // Check if it's a JSON string
      try {
        const parsed = JSON.parse(rawSample.embedding);
        console.log('  Can parse as JSON:', Array.isArray(parsed));
        console.log('  Parsed dimensions:', parsed.length);
      } catch (e) {
        console.log('  Cannot parse as JSON - raw string format');
      }
    } else if (Array.isArray(rawSample.embedding)) {
      console.log('  ✅ Embedding stored as array');
      console.log('  Dimensions:', rawSample.embedding.length);
    }
  }
  
  // Check for DC66 products in general
  console.log('\n=== DC66 PRODUCT SEARCH (broader) ===');
  const { data: dc66Products } = await supabase
    .from('scraped_pages') 
    .select('id, url, title, content')
    .or('content.ilike.%DC66%,title.ilike.%DC66%')
    .limit(5);
    
  if (dc66Products && dc66Products.length > 0) {
    console.log(`Found ${dc66Products.length} pages with DC66 mentions:`);
    for (const page of dc66Products) {
      console.log(`\n  Page: ${page.url}`);
      console.log(`  Title: ${page.title}`);
      
      // Extract SKUs from content
      const skuMatches = page.content.match(/DC66-\w+/gi) || [];
      const uniqueSkus = [...new Set(skuMatches)];
      console.log(`  SKUs found: ${uniqueSkus.join(', ')}`);
      
      // Check embeddings
      const { count } = await supabase
        .from('page_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('page_id', page.id);
        
      console.log(`  Embeddings: ${count || 0}`);
    }
  } else {
    console.log('No DC66 products found in scraped_pages');
  }
  
  process.exit(0);
}

investigateEmbeddingFormat().catch(console.error);
