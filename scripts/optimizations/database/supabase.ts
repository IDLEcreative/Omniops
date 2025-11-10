import { createClient } from '@supabase/supabase-js';
import { ensureEnv } from './env';

export function createSupabaseClient() {
  const { supabaseUrl, supabaseServiceKey } = ensureEnv();
  return createClient(supabaseUrl, supabaseServiceKey);
}
