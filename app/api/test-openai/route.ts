import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  // Only allow with auth
  const authHeader = request.headers.get('authorization');
  const isAuthorized = authHeader === `Bearer ${process.env.DEBUG_SECRET || 'debug-123'}`;
  
  if (process.env.NODE_ENV === 'production' && !isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'No API key',
      hasKey: false 
    }, { status: 500 });
  }

  // Check if the key has any whitespace or hidden characters
  const keyInfo = {
    length: apiKey.length,
    prefix: apiKey.substring(0, 7),
    suffix: apiKey.substring(apiKey.length - 3),
    hasWhitespace: apiKey !== apiKey.trim(),
    trimmedLength: apiKey.trim().length,
    hasNewlines: apiKey.includes('\n') || apiKey.includes('\r'),
    hasQuotes: apiKey.includes('"') || apiKey.includes("'"),
  };

  try {
    // Try to initialize OpenAI client
    const openai = new OpenAI({ 
      apiKey: apiKey.trim() // Trim any whitespace
    });

    // Try a simple API call
    const models = await openai.models.list();
    
    return NextResponse.json({
      success: true,
      keyInfo,
      modelsCount: models.data.length,
      availableModels: models.data.slice(0, 5).map(m => m.id), // Show first 5 models
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      keyInfo,
      error: error.message || 'Unknown error',
      errorType: error.constructor.name,
      errorStatus: error.status,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}