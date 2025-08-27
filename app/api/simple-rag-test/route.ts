import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'tipper products hydraulic crane';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    console.log('Testing RAG with query:', query);
    
    // Step 1: Get sample content from page_embeddings
    const { data: sampleContent, error: sampleError } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .limit(10);
    
    if (sampleError) {
      return NextResponse.json({ error: 'Failed to fetch sample content', details: sampleError });
    }
    
    // Step 2: Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    
    // Step 3: Try the old search method that the chat API falls back to
    let fallbackSearchResults = null;
    try {
      const { data: relevantChunks, error: rpcError } = await supabase.rpc('search_embeddings', {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.5,
        match_count: 5,
      });
      
      if (rpcError) {
        console.log('RPC search error:', rpcError);
      } else if (relevantChunks && relevantChunks.length > 0) {
        fallbackSearchResults = relevantChunks.map((chunk: any) => ({
          content: chunk.content || chunk.chunk_text,
          url: chunk.url || chunk.metadata?.url || '',
          title: chunk.title || 'Thompson eParts',
          similarity: chunk.similarity || 0.7
        }));
      }
    } catch (rpcError: any) {
      console.log('RPC search failed:', rpcError.message);
    }
    
    // Step 4: Simple keyword matching as a baseline
    const keywordMatches = sampleContent?.filter(item => {
      const text = item.chunk_text.toLowerCase();
      const keywords = query.toLowerCase().split(' ');
      return keywords.some(keyword => text.includes(keyword));
    });
    
    // Step 5: Test the actual chat API
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: 'rag-test-' + Date.now(),
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true }
          }
        }
      })
    });
    
    const chatData = await chatResponse.json();
    
    // Step 6: Create a custom RAG response using keyword matches
    let customRagResponse = null;
    if (keywordMatches && keywordMatches.length > 0) {
      const context = keywordMatches.map(m => m.chunk_text).join('\n\n');
      
      const customCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful customer service assistant for Thompson eParts. 
            Use the following context from the website to answer the question:
            
            ${context}
            
            Be specific and reference the actual products and services mentioned.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      });
      
      customRagResponse = customCompletion.choices[0]?.message?.content;
    }
    
    return NextResponse.json({
      test_query: query,
      
      available_content: {
        total_chunks: sampleContent?.length || 0,
        sample: sampleContent?.slice(0, 3).map(c => ({
          text: c.chunk_text.substring(0, 100) + '...',
          url: c.metadata?.url
        }))
      },
      
      keyword_matching: {
        matches_found: keywordMatches?.length || 0,
        matched_content: keywordMatches?.slice(0, 3).map(m => m.chunk_text.substring(0, 150) + '...')
      },
      
      fallback_rpc_search: {
        working: !!fallbackSearchResults,
        results_count: fallbackSearchResults?.length || 0,
        results: fallbackSearchResults
      },
      
      current_chat_api: {
        response: chatData.message?.substring(0, 300) + '...',
        sources_found: chatData.sources?.length || 0,
        sources: chatData.sources
      },
      
      custom_rag_response: {
        enabled: !!customRagResponse,
        response: customRagResponse?.substring(0, 300) + '...'
      },
      
      summary: {
        content_exists: sampleContent && sampleContent.length > 0,
        keyword_matching_works: keywordMatches && keywordMatches.length > 0,
        chat_api_using_rag: chatData.sources && chatData.sources.length > 0,
        custom_rag_successful: !!customRagResponse
      }
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}