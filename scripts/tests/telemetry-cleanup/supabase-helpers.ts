import { createServiceRoleClientSync } from '@/lib/supabase-server';

export function getSupabaseClient() {
  return createServiceRoleClientSync();
}

export async function verifyRecordExists(query: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lookup_failures')
    .select('id')
    .eq('query', query)
    .single();

  return !error && data !== null;
}

export async function cleanupTestRecords(): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase.from('lookup_failures').delete().like('query', 'test-order-%');
  await supabase.from('lookup_failures').delete().like('query', 'batch-test-order-%');
  await supabase.from('lookup_failures').delete().eq('query', 'sql-function-test');
}
