import { anonClient } from './clients';
import { runTest } from './results';

export async function testAnonymousRestrictions(): Promise<void> {
  console.log('\n📋 Testing Anonymous Role Restrictions...\n');

  await runTest('Anonymous cannot read chat_telemetry_rollups', async () => {
    const { data, error } = await anonClient.from('chat_telemetry_rollups').select('*').limit(1);
    if (!error && data && data.length > 0) {
      throw new Error('Anonymous role should not have access to rollups');
    }
  });

  await runTest('Anonymous cannot read demo_attempts', async () => {
    const { data, error } = await anonClient.from('demo_attempts').select('*').limit(1);
    if (!error && data && data.length > 0) {
      throw new Error('Anonymous role should not have access to demo attempts');
    }
  });

  await runTest('Anonymous cannot read gdpr_audit_log', async () => {
    const { data, error } = await anonClient.from('gdpr_audit_log').select('*').limit(1);
    if (!error && data && data.length > 0) {
      throw new Error('Anonymous role should not have access to GDPR logs');
    }
  });
}
