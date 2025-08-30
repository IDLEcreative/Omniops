require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI.OpenAI({ apiKey: openaiKey });

async function testWorkingRAG() {
  try {
    const testQuery = 'What products do you sell?';
    const testDomain = 'thompsonseparts.co.uk';
    
    console.log(`\n=== Testing Fixed RAG System ===`);
    console.log(`Domain: ${testDomain}`);
    console.log(`Query: "${testQuery}"\n`);
    
    // Get domain_id
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', testDomain)
      .single();
    
    const domainId = domainData.id;
    console.log(`✅ Domain ID: ${domainId}`);
    
    // Generate embedding
    console.log('\n📊 Generating embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    console.log('✅ Embedding generated\n');
    
    // Test the L2 function (which we know works)
    console.log('🔍 Testing search_embeddings_l2 function...');
    const { data: l2Results, error: l2Error } = await supabase
      .rpc('search_embeddings_l2', {
        query_embedding: queryEmbedding,
        p_domain_id: domainId,
        match_threshold: 0.3,
        match_count: 10
      });
    
    if (l2Error) {
      console.error('L2 search error:', l2Error);
    } else {
      console.log(`✅ Found ${l2Results?.length || 0} results with L2 distance\n`);
      
      if (l2Results && l2Results.length > 0) {
        console.log('=== Top 5 Search Results ===');
        l2Results.slice(0, 5).forEach((result, index) => {
          console.log(`\n${index + 1}. [Similarity: ${result.similarity?.toFixed(3)}]`);
          console.log(`   📍 ${result.url}`);
          console.log(`   📄 ${result.title || 'No title'}`);
          console.log(`   📝 ${(result.content || '').substring(0, 150)}...`);
        });
        
        // Generate AI response
        console.log('\n\n=== AI Response Generation ===');
        const context = l2Results.slice(0, 5).map((r, i) => 
          `[${i+1}] ${r.url}\n${r.content}`
        ).join('\n\n');
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant for Thompson's eParts, a company that sells commercial vehicle parts and body systems. Use the following context from their website to answer questions:\n\n${context}\n\nProvide specific product names and categories when available.`
            },
            { role: 'user', content: testQuery }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });
        
        const aiResponse = completion.choices[0]?.message?.content;
        console.log('📝 AI Response:');
        console.log('─'.repeat(60));
        console.log(aiResponse);
        console.log('─'.repeat(60));
        
        console.log('\n\n✅ SUCCESS! RAG system is now working correctly!');
        console.log('The search_embeddings_l2 function is returning relevant results.');
        
        // Also test the original function to see if it works
        console.log('\n\n🔍 Testing original search_embeddings function...');
        const { data: origResults, error: origError } = await supabase
          .rpc('search_embeddings', {
            query_embedding: queryEmbedding,
            p_domain_id: domainId,
            match_threshold: 0.3,
            match_count: 5
          });
        
        if (origError) {
          console.log('❌ Original function error:', origError.message);
          console.log('   Use search_embeddings_l2 instead');
        } else {
          console.log(`✅ Original function also works! Found ${origResults?.length || 0} results`);
        }
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testWorkingRAG();