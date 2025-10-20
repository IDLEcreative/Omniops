import { createClient } from '@supabase/supabase-js';
import { alertMonitorFailure } from '../lib/alerts/notify';

interface RollupCheck {
  label: string;
  table: string;
  granularity: 'hour' | 'day';
  thresholdMinutes: number;
}

const ROLLUP_CHECKS: RollupCheck[] = [
  {
    label: 'Rollups (hourly)',
    table: 'chat_telemetry_rollups',
    granularity: 'hour',
    thresholdMinutes: 90,
  },
  {
    label: 'Rollups (daily)',
    table: 'chat_telemetry_rollups',
    granularity: 'day',
    thresholdMinutes: 24 * 60,
  },
  {
    label: 'Domain rollups (hourly)',
    table: 'chat_telemetry_domain_rollups',
    granularity: 'hour',
    thresholdMinutes: 90,
  },
  {
    label: 'Model rollups (hourly)',
    table: 'chat_telemetry_model_rollups',
    granularity: 'hour',
    thresholdMinutes: 90,
  },
];

async function getLatestBucket(
  supabaseUrl: string,
  serviceKey: string,
  check: RollupCheck,
): Promise<{ minutesAgo: number | null; timestamp: string | null }> {
  const client = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
    },
  });

  const { data, error } = await client
    .from(check.table)
    .select('bucket_end, bucket_start')
    .eq('granularity', check.granularity)
    .order('bucket_end', { ascending: false, nullsFirst: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to query ${check.table} (${check.granularity}): ${error.message}`);
  }

  const row = data?.[0];
  if (!row) {
    return { minutesAgo: null, timestamp: null };
  }

  const timestampValue: string | null = row.bucket_end ?? row.bucket_start ?? null;
  if (!timestampValue) {
    return { minutesAgo: null, timestamp: null };
  }

  const millis = Date.parse(timestampValue);
  if (Number.isNaN(millis)) {
    return { minutesAgo: null, timestamp: timestampValue };
  }

  const minutesAgo = (Date.now() - millis) / 60000;
  return { minutesAgo, timestamp: new Date(millis).toISOString() };
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!supabaseUrl || !serviceKey) {
    const errorMsg =
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to run this monitor.';
    console.error(errorMsg);
    await alertMonitorFailure('Telemetry Rollup', errorMsg).catch((error) => {
      console.error('Failed to dispatch telemetry monitor alert:', (error as Error).message);
    });
    process.exit(1);
  }

  let hasFailures = false;
  const failures: string[] = [];

  for (const check of ROLLUP_CHECKS) {
    try {
      const { minutesAgo, timestamp } = await getLatestBucket(supabaseUrl, serviceKey, check);

      if (minutesAgo === null) {
        hasFailures = true;
        failures.push(
          `${check.label}: missing rollup rows (latest timestamp ${timestamp ?? 'n/a'})`,
        );
        console.error(
          `[${check.label}] No rollup rows found (latest timestamp: ${timestamp ?? 'n/a'})`,
        );
        continue;
      }

      const minutesRounded = Number(minutesAgo.toFixed(2));
      const status =
        minutesRounded <= check.thresholdMinutes
          ? 'OK'
          : `STALE (>${check.thresholdMinutes} min)`;

      if (status !== 'OK') {
        hasFailures = true;
        failures.push(`${check.label}: ${status} as of ${timestamp}`);
      }

      console.log(
        `[${check.label}] ${status} – latest bucket ${timestamp} (${minutesRounded} minutes ago)`,
      );
    } catch (error) {
      hasFailures = true;
      failures.push(`${check.label}: ${(error as Error).message}`);
      console.error(`[${check.label}] Error: ${(error as Error).message}`);
    }
  }

  if (hasFailures) {
    await alertMonitorFailure(
      'Telemetry Rollup',
      'One or more telemetry rollup checks failed during nightly monitoring.',
      {
        'Failed Checks': failures.join(' | '),
      },
    ).catch((error) => {
      console.error('Failed to dispatch telemetry monitor alert:', (error as Error).message);
    });
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error('Unexpected error while checking telemetry rollups:', error);
  await alertMonitorFailure('Telemetry Rollup', `Monitor crashed: ${(error as Error).message}`).catch(
    (alertError) => {
      console.error(
        'Failed to dispatch telemetry monitor crash alert:',
        (alertError as Error).message,
      );
    },
  );
  process.exit(1);
});
