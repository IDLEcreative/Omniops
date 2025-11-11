import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './config';

export function createSupabaseClient() {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = getSupabaseEnv();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}
