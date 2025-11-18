/**
 * Chat API Health Check
 *
 * Diagnoses chat API dependencies without requiring user input.
 * Use this to verify all required services are available.
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message: string }> = {};

  // 1. Check OpenAI API Key
  try {
    if (process.env.OPENAI_API_KEY) {
      const keyPreview = process.env.OPENAI_API_KEY.substring(0, 10) + '...';
      checks.openai = {
        status: 'ok',
        message: `Key present: ${keyPreview}`
      };
    } else {
      checks.openai = {
        status: 'error',
        message: 'OPENAI_API_KEY environment variable not set'
      };
    }
  } catch (error) {
    console.error('[Health Check] OpenAI check failed:', error);
    checks.openai = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 2. Check Supabase Connection
  try {
    const supabase = await createServiceRoleClient();
    if (supabase) {
      // Try a simple query
      const { error } = await supabase.from('domains').select('id').limit(1);
      if (error) {
        checks.supabase = {
          status: 'error',
          message: `Query failed: ${error.message}`
        };
      } else {
        checks.supabase = {
          status: 'ok',
          message: 'Connected and query successful'
        };
      }
    } else {
      checks.supabase = {
        status: 'error',
        message: 'Failed to create Supabase client'
      };
    }
  } catch (error) {
    console.error('[Health Check] Supabase check failed:', error);
    checks.supabase = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 3. Check Encryption Key
  try {
    if (process.env.ENCRYPTION_KEY) {
      const keyLength = process.env.ENCRYPTION_KEY.length;
      if (keyLength === 32) {
        checks.encryption = {
          status: 'ok',
          message: 'Encryption key present (32 characters)'
        };
      } else {
        checks.encryption = {
          status: 'error',
          message: `Encryption key invalid length: ${keyLength} (should be 32)`
        };
      }
    } else {
      checks.encryption = {
        status: 'error',
        message: 'ENCRYPTION_KEY environment variable not set'
      };
    }
  } catch (error) {
    console.error('[Health Check] Encryption check failed:', error);
    checks.encryption = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 4. Check Model Configuration
  try {
    const useGPT5Mini = process.env.USE_GPT5_MINI === 'true';
    checks.model = {
      status: 'ok',
      message: `Model configured: ${useGPT5Mini ? 'gpt-5-mini' : 'gpt-4'}`
    };
  } catch (error) {
    console.error('[Health Check] Model config check failed:', error);
    checks.model = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 5. Check Redis (optional)
  try {
    if (process.env.REDIS_URL) {
      checks.redis = {
        status: 'ok',
        message: `Redis URL configured: ${process.env.REDIS_URL.substring(0, 15)}...`
      };
    } else {
      checks.redis = {
        status: 'ok',
        message: 'Redis not configured (optional)'
      };
    }
  } catch (error) {
    console.error('[Health Check] Redis check failed:', error);
    checks.redis = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Calculate overall health
  const allPassed = Object.values(checks).every(check => check.status === 'ok');
  const criticalFailed = ['openai', 'supabase', 'encryption'].some(
    key => checks[key]?.status === 'error'
  );

  return NextResponse.json({
    healthy: allPassed,
    critical_failure: criticalFailed,
    checks,
    timestamp: new Date().toISOString()
  }, {
    status: allPassed ? 200 : 503
  });
}
