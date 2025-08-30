require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI.OpenAI({ apiKey: openaiKey });

async function testRAGDetailed() {
  try {
    const testQuery = 'What products do you sell?';
    const testDomain = 'thompsonseparts.co.uk';
    
    console.log(`\n=== Testing RAG for: ${testDomain} ===`);
    console.log(`Query: "${testQuery}"\n`);
    
    // Get domain_id
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', testDomain)
      .single();
    
    if (domainError) {
      console.error('Domain lookup error:', domainError);
      return;
    }
    
    const domainId = domainData.id;
    console.log(`✅ Found domain_id: ${domainId}`);
    
    // Generate embedding
    console.log('\n📊 Generating embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    
    if (!queryEmbedding) {
      console.error('Failed to generate embedding');
      return;
    }
    console.log(`✅ Embedding generated (dimension: ${queryEmbedding.length})`);
    
    // Search with the fixed function
    console.log('\n🔍 Searching for similar content...');
    console.log('   Parameters:');
    console.log(`   - domain_id: ${domainId}`);
    console.log(`   - match_threshold: 0.5`);
    console.log(`   - match_count: 10`);
    
    const { data: searchResults, error: searchError } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      p_domain_id: domainId,
      match_threshold: 0.5,
      match_count: 10
    });
    
    if (searchError) {
      console.error('\n❌ Search error:', searchError);
      
      // Try without domain filter
      console.log('\n🔄 Trying without domain filter...');
      const { data: globalResults, error: globalError } = await supabase.rpc('search_embeddings', {
        query_embedding: queryEmbedding,
        p_domain_id: null,
        match_threshold: 0.5,
        match_count: 5
      });
      
      if (globalError) {
        console.error('Global search also failed:', globalError);
      } else {
        console.log(`Found ${globalResults?.length || 0} results globally`);
        if (globalResults && globalResults.length > 0) {
          console.log('\nSample result:');
          console.log(`  URL: ${globalResults[0].url}`);
          console.log(`  Similarity: ${globalResults[0].similarity}`);
        }
      }
      return;
    }
    
    console.log(`\n✅ Found ${searchResults?.length || 0} results`);
    
    if (searchResults && searchResults.length > 0) {
      console.log('\n=== Top Search Results ===');
      searchResults.slice(0, 5).forEach((result, index) => {
        console.log(`\n${index + 1}. Similarity: ${result.similarity?.toFixed(3)}`);
        console.log(`   URL: ${result.url || 'No URL'}`);
        console.log(`   Title: ${result.title || 'No title'}`);
        console.log(`   Content: ${(result.content || '').substring(0, 150)}...`);
      });
      
      // Generate AI response
      console.log('\n\n=== Generating AI Response ===');
      const context = searchResults.slice(0, 5).map((r, i) => 
        `[Source ${i+1}] ${r.url}\n${r.content}`
      ).join('\n\n');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for Thompson's eParts. Use the following context to answer questions about products and services:\n\n${context}`
          },
          { role: 'user', content: testQuery }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      
      console.log('\n📝 AI Response:');
      console.log(completion.choices[0]?.message?.content);
      
      console.log('\n\n✅ RAG system is working correctly!');
    } else {
      console.log('\n⚠️  No results found. Possible issues:');
      console.log('   - Embeddings might not be properly linked to domain');
      console.log('   - Similarity threshold might be too high');
      console.log('   - Index might need to be created for performance');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testRAGDetailed();