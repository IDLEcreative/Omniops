import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarContent } from '@/lib/embeddings';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || 'What tipper sheet systems do you offer?';
    const d = searchParams.get('d') || 'thompsonseparts.co.uk';
    // Test the searchSimilarContent function directly
    const results = await searchSimilarContent(q, d, 5, 0.3);
    
    return NextResponse.json({
      success: true,
      results_count: results.length,
      results: results,
      message: results.length > 0 
        ? '✅ searchSimilarContent is working!'
        : '❌ searchSimilarContent returned no results'
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      success: false,
      error: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}
