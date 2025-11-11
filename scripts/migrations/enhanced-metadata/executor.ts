import { getSupabaseEnv } from './env';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = getSupabaseEnv();

export async function executeSqlDirect(sql: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY
    },
    body: JSON.stringify({ sql })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text;
}
