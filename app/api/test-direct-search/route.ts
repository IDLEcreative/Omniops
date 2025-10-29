import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'What products do you offer for tippers?';
  
      const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
  
  try {
    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    
    if (!queryEmbedding) {
      return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
    }
    
    // Direct SQL query to search embeddings using cosine similarity
    let searchResults, searchError;
    try {
      const result = await supabase.rpc('direct_search', {
        query_text: `
          SELECT 
            pe.chunk_text,
            pe.metadata,
            1 - (pe.embedding <=> ARRAY[${queryEmbedding.join(',')}]::vector) as similarity
          FROM page_embeddings pe
          WHERE 1 - (pe.embedding <=> ARRAY[${queryEmbedding.join(',')}]::vector) > 0.5
          ORDER BY pe.embedding <=> ARRAY[${queryEmbedding.join(',')}]::vector
          LIMIT 5
        `
      });
      searchResults = result.data;
      searchError = result.error;
    } catch (err) {
      searchResults = null;
      searchError = 'RPC not available';
    }
    
    // Alternative: Try raw query without RPC
    let manualResults = null;
    if (!searchResults || searchError) {
      // Since we can't do raw SQL, let's fetch all embeddings and calculate similarity in JS
      const { data: allEmbeddings, error: embeddingsError } = await supabase
        .from('page_embeddings')
        .select('id, chunk_text, metadata')
        .limit(20); // Get first 20 for testing
      
      if (!embeddingsError && allEmbeddings) {
        // Since we can't access the embedding vectors directly from the client,
        // let's at least show what content is available
        manualResults = allEmbeddings.map(item => ({
          chunk_text: item.chunk_text,
          metadata: item.metadata,
          similarity: 'Cannot calculate without vector access'
        }));
      }
    }
    
    // Test the chat endpoint to see what it gets
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: 'test-' + Date.now(),
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true }
          }
        }
      })
    });
    
    const chatData = await chatResponse.json();
    
    return NextResponse.json({
      query,
      embedding_generated: !!queryEmbedding,
      embedding_dimensions: queryEmbedding?.length,
      direct_sql_search: {
        results: searchResults,
        error: searchError
      },
      manual_search: {
        available_content_sample: manualResults?.slice(0, 5),
        total_available: manualResults?.length
      },
      chat_response: {
        message: chatData.message?.substring(0, 200) + '...',
        sources: chatData.sources,
        has_context: chatData.sources && chatData.sources.length > 0
      },
      analysis: {
        embedding_search_working: !!searchResults && !searchError,
        content_available: !!manualResults && manualResults.length > 0,
        chat_using_rag: chatData.sources && chatData.sources.length > 0
      }
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}