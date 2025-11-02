import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'OPENAI_API_KEY not found in environment'
      });
    }

    // Test the key without exposing it
    const keyInfo = {
      exists: true,
      prefix: apiKey.substring(0, 7),
      suffix: apiKey.substring(apiKey.length - 4),
      length: apiKey.length
    };

    // Try a simple API call
    try {
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'user', content: 'Say "working"' }
        ],
        max_tokens: 10
      });

      return NextResponse.json({
        status: 'success',
        keyInfo,
        apiTest: {
          working: true,
          response: completion.choices[0].message.content,
          model: completion.model
        }
      });

    } catch (apiError: any) {
      return NextResponse.json({
        status: 'api-error',
        keyInfo,
        error: {
          message: apiError.message,
          status: apiError.status,
          type: apiError.type
        }
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    });
  }
}