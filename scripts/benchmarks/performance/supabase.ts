import { createSupabaseClient, getSupabaseConfig } from '../../supabase-config.js';

export async function initSupabaseClient() {
  const config = getSupabaseConfig();
  return createSupabaseClient(config);
}
