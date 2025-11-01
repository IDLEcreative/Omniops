/**
 * Environment variables check
 */

import type { VerificationResult } from '../types';

export async function checkEnvironmentVariables(): Promise<VerificationResult> {
  const startTime = Date.now();

  const envChecks = {
    openai: !!process.env.OPENAI_API_KEY,
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const missingVars = Object.entries(envChecks)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length === 0) {
    return {
      check: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables configured',
      duration: Date.now() - startTime,
    };
  }

  return {
    check: 'Environment Variables',
    status: 'fail',
    message: `Missing: ${missingVars.join(', ')}`,
    duration: Date.now() - startTime,
    details: { missing: missingVars },
  };
}
