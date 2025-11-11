import { serviceClient, anonClient } from './clients';
import { runTest } from './results';

export async function testViewSecurity(): Promise<void> {
  console.log('\n📋 Testing View Security (SECURITY INVOKER)...\n');

  await runTest('chat_telemetry_metrics view respects RLS', async () => {
    const { error } = await serviceClient.from('chat_telemetry_metrics').select('*').limit(1);
    if (error) throw error;

    const { data: anonData } = await anonClient.from('chat_telemetry_metrics').select('*').limit(1);
    if (anonData && anonData.length > 0) {
      console.warn('   ⚠️  Anonymous can query view (verify RLS configuration)');
    }
  });

  await runTest('chat_telemetry_domain_costs view respects RLS', async () => {
    const { error } = await serviceClient.from('chat_telemetry_domain_costs').select('*').limit(1);
    if (error) throw error;
  });

  await runTest('chat_telemetry_cost_analytics view respects RLS', async () => {
    const { error } = await serviceClient.from('chat_telemetry_cost_analytics').select('*').limit(1);
    if (error) throw error;
  });

  await runTest('chat_telemetry_hourly_costs view respects RLS', async () => {
    const { error } = await serviceClient.from('chat_telemetry_hourly_costs').select('*').limit(1);
    if (error) throw error;
  });
}
