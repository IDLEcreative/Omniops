#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to backfill audit log entries.');
    process.exit(1);
  }

  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: configs, error: configsError } = await client
    .from('customer_configs')
    .select('domain')
    .not('domain', 'is', null);

  if (configsError) {
    console.error('Failed to fetch customer configs:', configsError.message);
    process.exit(1);
  }

  const domains = (configs ?? []).map((config) => config.domain as string).filter(Boolean);

  if (domains.length === 0) {
    console.log('No customer domains found. Nothing to backfill.');
    return;
  }

  const now = new Date().toISOString();
  const entries = [] as Array<Record<string, unknown>>;

  for (const domain of domains) {
    const { data: existing, error: existingError } = await client
      .from('gdpr_audit_log')
      .select('id')
      .eq('domain', domain)
      .limit(1);

    if (existingError) {
      console.warn(`Skipping domain ${domain} due to lookup error:`, existingError.message);
      continue;
    }

    if (existing && existing.length > 0) {
      continue;
    }

    entries.push({
      domain,
      request_type: 'export',
      session_id: null,
      email: null,
      actor: 'backfill-script',
      status: 'completed',
      deleted_count: null,
      message: 'Backfilled baseline GDPR audit entry',
      created_at: now,
    });
  }

  if (entries.length === 0) {
    console.log('All domains already have audit log entries. No backfill required.');
    return;
  }

  const { error: insertError } = await client.from('gdpr_audit_log').insert(entries);

  if (insertError) {
    console.error('Failed to insert backfill entries:', insertError.message);
    process.exit(1);
  }

  console.log(`Backfilled ${entries.length} GDPR audit entries.`);
}

main().catch((error) => {
  console.error('Unexpected error during GDPR audit backfill:', error);
  process.exit(1);
});
