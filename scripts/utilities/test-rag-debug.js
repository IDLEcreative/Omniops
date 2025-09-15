import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient  } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI.OpenAI({ apiKey: openaiKey });

async function debugRAG() {
  try {
    const testDomain = 'thompsonseparts.co.uk';
    
    console.log('🔍 Debug RAG Search\n');
    
    // Get domain
    const { data: domain } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', testDomain)
      .single();
    
    console.log(`Domain ID: ${domain.id}\n`);
    
    // First, use the test function we created
    console.log('Testing data relationships with test_search_embeddings:');
    const { data: testData, error: testError } = await supabase
      .rpc('test_search_embeddings', {
        p_domain_id: domain.id
      });
    
    if (testError) {
      console.error('Test function error:', testError);
    } else if (testData && testData.length > 0) {
      console.log(`  Pages: ${testData[0].page_count}`);
      console.log(`  Embeddings: ${testData[0].embedding_count}`);
      console.log(`  Sample URL: ${testData[0].sample_url}\n`);
    }
    
    // Generate a real embedding
    const testQuery = 'What products do you sell?';
    console.log(`Generating embedding for: "${testQuery}"`);
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    console.log('✅ Embedding generated\n');
    
    // Test with VERY low threshold
    console.log('Testing with threshold 0.1 (very low):');
    const { data: lowThreshold, error: lowError } = await supabase
      .rpc('search_embeddings', {
        query_embedding: queryEmbedding,
        p_domain_id: domain.id,
        match_threshold: 0.1,
        match_count: 5
      });
    
    if (lowError) {
      console.error('Error with low threshold:', lowError);
    } else {
      console.log(`Results: ${lowThreshold?.length || 0}\n`);
      if (lowThreshold && lowThreshold.length > 0) {
        console.log('Sample result:');
        console.log(`  URL: ${lowThreshold[0].url}`);
        console.log(`  Similarity: ${lowThreshold[0].similarity}`);
        console.log(`  Content: ${lowThreshold[0].content?.substring(0, 100)}...\n`);
      }
    }
    
    // Test without domain filter
    console.log('Testing without domain filter (global search):');
    const { data: globalSearch, error: globalError } = await supabase
      .rpc('search_embeddings', {
        query_embedding: queryEmbedding,
        p_domain_id: null,
        match_threshold: 0.3,
        match_count: 5
      });
    
    if (globalError) {
      console.error('Global search error:', globalError);
    } else {
      console.log(`Global results: ${globalSearch?.length || 0}`);
      if (globalSearch && globalSearch.length > 0) {
        console.log('First result:');
        console.log(`  URL: ${globalSearch[0].url}`);
        console.log(`  Similarity: ${globalSearch[0].similarity}\n`);
      }
    }
    
    // Direct query to check data exists
    console.log('Direct check - first embedding for this domain:');
    const { data: directCheck } = await supabase
      .from('page_embeddings')
      .select('chunk_text, page_id')
      .limit(1)
      .single();
    
    if (directCheck) {
      console.log(`  Found embedding with page_id: ${directCheck.page_id}`);
      console.log(`  Content: ${directCheck.chunk_text?.substring(0, 100)}...`);
      
      // Check if this page belongs to our domain
      const { data: pageCheck } = await supabase
        .from('scraped_pages')
        .select('domain_id, url')
        .eq('id', directCheck.page_id)
        .single();
      
      if (pageCheck) {
        console.log(`  Page domain_id: ${pageCheck.domain_id}`);
        console.log(`  Page URL: ${pageCheck.url}`);
        console.log(`  Matches our domain: ${pageCheck.domain_id === domain.id}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugRAG();