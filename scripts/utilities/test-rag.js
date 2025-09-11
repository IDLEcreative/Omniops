const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI.OpenAI({ apiKey: openaiKey });

async function testRAG() {
  try {
    const testQuery = 'What do you sell?';
    const testDomain = 'thompsonseparts.co.uk';
    
    console.log(`\n=== Testing RAG for domain: ${testDomain} ===`);
    console.log(`Query: "${testQuery}"`);
    
    // Step 1: Look up domain_id
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', testDomain)
      .single();
    
    if (domainError || !domainData) {
      console.error('Domain not found:', domainError);
      return;
    }
    
    const domainId = domainData.id;
    console.log(`Found domain_id: ${domainId}`);
    
    // Step 2: Generate embedding for the query
    console.log('\nGenerating embedding for query...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    
    if (!queryEmbedding) {
      console.error('Failed to generate embedding');
      return;
    }
    console.log('Embedding generated successfully');
    
    // Step 3: Search for similar content
    console.log('\nSearching for similar content...');
    const { data: searchResults, error: searchError } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,  // Lower threshold for testing
      match_count: 5,
      p_domain_id: domainId
    });
    
    if (searchError) {
      console.error('Search error:', searchError);
      return;
    }
    
    console.log(`Found ${searchResults?.length || 0} results`);
    
    if (searchResults && searchResults.length > 0) {
      console.log('\n=== Search Results ===');
      searchResults.forEach((result, index) => {
        console.log(`\n${index + 1}. Similarity: ${result.similarity?.toFixed(3) || 'N/A'}`);
        console.log(`   URL: ${result.url || 'No URL'}`);
        console.log(`   Title: ${result.title || 'No title'}`);
        console.log(`   Content snippet: ${(result.content || result.chunk_text || '').substring(0, 200)}...`);
      });
      
      // Step 4: Generate a response using the context
      console.log('\n=== Generating AI Response ===');
      const context = searchResults.map((r, i) => 
        `[${i+1}] ${r.content || r.chunk_text || ''}`
      ).join('\n\n');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful customer service assistant. Use this context to answer questions:\n\n${context}\n\nAnswer based only on the provided context.`
          },
          { role: 'user', content: testQuery }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      
      const aiResponse = completion.choices[0]?.message?.content;
      console.log('\nAI Response:');
      console.log(aiResponse);
      
    } else {
      console.log('\nNo results found. The RAG system may need more content or the domain may not be scraped.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testRAG();