import { serviceClient } from './clients';
import { runTest } from './results';

export async function testServiceRoleAccess(): Promise<void> {
  console.log('\n📋 Testing Service Role Access...\n');

  await runTest('Service role can read chat_telemetry_rollups', async () => {
    const { error } = await serviceClient.from('chat_telemetry_rollups').select('*').limit(10);
    if (error) throw error;
  });

  await runTest('Service role can read chat_telemetry_domain_rollups', async () => {
    const { error } = await serviceClient.from('chat_telemetry_domain_rollups').select('*').limit(10);
    if (error) throw error;
  });

  await runTest('Service role can read demo_attempts', async () => {
    const { error } = await serviceClient.from('demo_attempts').select('*').limit(10);
    if (error) throw error;
  });

  await runTest('Service role can read gdpr_audit_log', async () => {
    const { error } = await serviceClient.from('gdpr_audit_log').select('*').limit(10);
    if (error) throw error;
  });
}
