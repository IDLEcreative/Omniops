import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    runtime: process.env.VERCEL ? 'vercel' : 'local',
  };

  // 1. Check environment variables
  diagnostics.envVars = {
    OPENAI_API_KEY: {
      exists: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY?.length || 0,
      prefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'missing',
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
    },
    REDIS_URL: {
      exists: !!process.env.REDIS_URL,
      isLocalhost: process.env.REDIS_URL?.includes('localhost') || false,
    },
  };

  // 2. Test Supabase connection
  try {
    const supabase = await createServiceRoleClient();
    if (supabase) {
      const { count, error } = await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true });

      diagnostics.supabase = {
        connected: !error,
        domainCount: count || 0,
        error: error?.message || null,
      };
    } else {
      diagnostics.supabase = { connected: false, error: 'Client creation failed' };
    }
  } catch (error: any) {
    diagnostics.supabase = { connected: false, error: error.message };
  }

  // 3. Test OpenAI without making an API call
  try {
    const OpenAI = require('openai').default;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    diagnostics.openai = {
      clientCreated: !!client,
      apiKeySet: !!client.apiKey,
    };
  } catch (error: any) {
    diagnostics.openai = { error: error.message };
  }

  // 4. Check memory usage
  if (process.memoryUsage) {
    const mem = process.memoryUsage();
    diagnostics.memory = {
      rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(mem.external / 1024 / 1024)}MB`,
    };
  }

  // 5. Check function timeout settings
  diagnostics.vercel = {
    region: process.env.VERCEL_REGION || 'unknown',
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
    functionMemory: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'unknown',
    nodeVersion: process.version,
  };

  // 6. Test if search_pages_by_keyword function exists
  try {
    const supabase = await createServiceRoleClient();
    if (supabase) {
      const { data, error } = await supabase.rpc('search_pages_by_keyword', {
        p_domain_id: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
        p_keyword: 'test',
        p_limit: 1
      });

      diagnostics.sqlFunctions = {
        search_pages_by_keyword: {
          exists: !error,
          error: error?.message || null,
          testResult: data ? 'success' : 'no data',
        }
      };
    }
  } catch (error: any) {
    diagnostics.sqlFunctions = { error: error.message };
  }

  // 7. Check module imports
  diagnostics.modules = {
    embeddings: false,
    chatProcessor: false,
  };

  try {
    require('@/lib/embeddings');
    diagnostics.modules.embeddings = true;
  } catch (e: any) {
    diagnostics.modules.embeddingsError = e.message;
  }

  try {
    require('@/lib/chat/ai-processor');
    diagnostics.modules.chatProcessor = true;
  } catch (e: any) {
    diagnostics.modules.chatProcessorError = e.message;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}