import { createClient } from '@supabase/supabase-js';
import { alertMonitorFailure } from '../lib/alerts/notify';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    const errorMsg =
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to check GDPR audit log health.';
    console.error(errorMsg);
    await alertMonitorFailure('GDPR Audit', errorMsg).catch((error) => {
      console.error('Failed to dispatch GDPR monitor alert:', (error as Error).message);
    });
    process.exit(1);
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await client
    .from('gdpr_audit_log')
    .select('created_at, request_type, status')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Failed to query gdpr_audit_log:', error.message);
    await alertMonitorFailure('GDPR Audit', `Query failed: ${error.message}`).catch((alertError) => {
      console.error('Failed to dispatch GDPR monitor alert:', (alertError as Error).message);
    });
    process.exit(1);
  }

  if (!data || data.length === 0) {
    const errorMsg =
      'No entries found in gdpr_audit_log. Ensure nightly jobs are populating records.';
    console.error(errorMsg);
    await alertMonitorFailure('GDPR Audit', errorMsg).catch((alertError) => {
      console.error('Failed to dispatch GDPR monitor alert:', (alertError as Error).message);
    });
    process.exit(1);
  }

  const latest = data[0];
  const ageMinutes = (Date.now() - new Date(latest.created_at).getTime()) / 60000;

  if (ageMinutes > 60 * 24) {
    const message = `No recent GDPR audit entries. Last entry (${latest.request_type}:${latest.status}) is ${ageMinutes.toFixed(
      2,
    )} minutes old.`;
    console.error(message);
    await alertMonitorFailure('GDPR Audit', message, {
      'Last Entry Type': latest.request_type,
      'Last Entry Status': latest.status,
      'Age (minutes)': ageMinutes.toFixed(2),
    }).catch((alertError) => {
      console.error('Failed to dispatch GDPR monitor alert:', (alertError as Error).message);
    });
    process.exit(1);
  }

  console.log(
    `Latest GDPR audit entry (${latest.request_type}:${latest.status}) recorded ${ageMinutes.toFixed(
      2,
    )} minutes ago.`,
  );
}

main().catch(async (error) => {
  console.error('Unexpected error while checking gdpr_audit_log:', error);
  await alertMonitorFailure('GDPR Audit', `Monitor crashed: ${(error as Error).message}`).catch(
    (alertError) => {
      console.error('Failed to dispatch GDPR monitor crash alert:', (alertError as Error).message);
    },
  );
  process.exit(1);
});
