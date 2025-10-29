import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export async function GET() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
      const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
  
  try {
    // Generate embedding for test query
    const testQuery = "tipper products";
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    
    // Call search_embeddings function directly
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.3,  // Lower threshold
      match_count: 10
    });
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        hint: 'Make sure you ran the CREATE FUNCTION SQL in Supabase dashboard'
      });
    }
    
    return NextResponse.json({
      success: true,
      query: testQuery,
      results_count: data?.length || 0,
      results: data || [],
      message: data && data.length > 0 
        ? '✅ RAG is working! Found matching content.'
        : '⚠️ Function exists but no results found. Check embeddings or threshold.'
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      success: false,
      error: err.message,
      details: err
    }, { status: 500 });
  }
}