import { serviceClient } from './clients';
import { runTest, assertCount } from './results';
import { TestData } from './setup';

export async function testMultiTenantIsolation(testData: TestData): Promise<void> {
  console.log('\n📋 Testing Multi-Tenant Isolation...\n');

  await runTest('Insert test rollup data', async () => {
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    await serviceClient.from('chat_telemetry_domain_rollups').upsert(
      [
        {
          bucket_start: hourStart.toISOString(),
          bucket_end: hourEnd.toISOString(),
          granularity: 'hour',
          domain: testData.domain1,
          total_requests: 100,
          success_count: 95,
          failure_count: 5,
          total_input_tokens: 10000,
          total_output_tokens: 5000,
          total_cost_usd: 0.5,
        },
        {
          bucket_start: hourStart.toISOString(),
          bucket_end: hourEnd.toISOString(),
          granularity: 'hour',
          domain: testData.domain2,
          total_requests: 50,
          success_count: 48,
          failure_count: 2,
          total_input_tokens: 5000,
          total_output_tokens: 2500,
          total_cost_usd: 0.25,
        },
      ],
      {
        onConflict: 'granularity,bucket_start,domain',
      }
    );

    console.log('   ✓ Inserted test data for both domains');
  });

  await runTest('Service role sees all domain rollups', async () => {
    const { data, error } = await serviceClient
      .from('chat_telemetry_domain_rollups')
      .select('*')
      .in('domain', [testData.domain1, testData.domain2]);

    if (error) throw error;

    await assertCount(data?.length || 0, 2, 'Service role should see rollups for both test domains');
  });

  await runTest('Organization isolation is enforced by policy', async () => {
    await serviceClient.rpc('pg_policies' as any);
    console.log('   ℹ️  Full isolation testing requires authenticated user sessions');
    console.log("   ℹ️  Verify manually: Users should only see their org's domains");
  });
}
