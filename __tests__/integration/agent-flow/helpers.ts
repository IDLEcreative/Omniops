/**
 * Shared Helpers for Agent Flow Tests
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { createServiceRoleClientSync } from '@/lib/supabase/server';

// IMPORTANT: Override Jest's mocked env vars for E2E tests
process.env.E2E_TEST = 'true';

if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    Object.keys(envConfig).forEach(key => {
      process.env[key] = envConfig[key];
    });
    console.log('[E2E ENV OVERRIDE] Loaded real environment from .env.local:', Object.keys(envConfig).length, 'variables');
  }
}

// Helper to get service role client with proper configuration
export async function getSupabaseClient() {
  console.log('[getSupabaseClient] Creating client with:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const supabase = createServiceRoleClientSync();

  if (!supabase) {
    throw new Error('Failed to create Supabase client');
  }

  console.log('[getSupabaseClient] Client created:', !!supabase);
  return supabase;
}

// Helper function to create test config
export async function createTestConfig(testName: string, extraFields: Record<string, any> = {}) {
  const testDomain = `test-${testName}-${Date.now()}.example.com`;
  const supabase = await getSupabaseClient();

  console.log('[createTestConfig] Attempting insert for domain:', testDomain);

  const appId = `app_test${Date.now()}${Math.random().toString(36).substring(2, 10)}`;

  const insertResponse = await supabase
    .from('customer_configs')
    .insert({
      domain: testDomain,
      business_name: `${testName} Test`,
      app_id: appId,
      ...extraFields
    })
    .select();

  const { data: customerConfigs, error: configError } = insertResponse;

  console.log('[createTestConfig] Insert response:', {
    hasError: !!configError,
    error: configError,
    hasData: !!customerConfigs,
    dataLength: customerConfigs?.length || 0
  });

  if (configError) {
    console.error('[createTestConfig] Insert failed:', configError);
    return { customerConfig: null, configError, testDomain, supabase };
  }

  if (!customerConfigs || customerConfigs.length === 0) {
    const customerConfig = {
      id: 'UNKNOWN-ID',
      domain: testDomain,
      app_id: appId,
      business_name: `${testName} Test`,
      ...extraFields
    };

    console.log('[createTestConfig] Using minimal config:', customerConfig);
    return { customerConfig, configError: null, testDomain, supabase };
  }

  const customerConfig = customerConfigs[0];
  console.log('[createTestConfig] Successfully created:', {
    id: customerConfig.id,
    domain: customerConfig.domain,
    appId: customerConfig.app_id
  });

  return { customerConfig, configError: null, testDomain, supabase };
}
