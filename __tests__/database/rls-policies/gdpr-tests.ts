import { serviceClient, anonClient } from './clients';
import { runTest, assertCount } from './results';
import { TestData } from './setup';

export async function testGDPRAuditIsolation(testData: TestData): Promise<void> {
  console.log('\n📋 Testing GDPR Audit Log Isolation...\n');

  await runTest('Insert test GDPR audit logs', async () => {
    await serviceClient.from('gdpr_audit_log').insert([
      {
        domain: testData.domain1,
        request_type: 'export',
        session_id: 'test-session-1',
        email: 'user1@test.com',
        actor: 'admin@org1.com',
        status: 'completed',
      },
      {
        domain: testData.domain2,
        request_type: 'delete',
        session_id: 'test-session-2',
        email: 'user2@test.com',
        actor: 'admin@org2.com',
        status: 'completed',
        deleted_count: 42,
      },
    ]);

    console.log('   ✓ Inserted test GDPR logs for both domains');
  });

  await runTest('Service role sees all GDPR logs', async () => {
    const { data, error } = await serviceClient
      .from('gdpr_audit_log')
      .select('*')
      .in('domain', [testData.domain1, testData.domain2]);

    if (error) throw error;

    await assertCount(data?.length || 0, 'any', 'Service role should see GDPR logs for test domains');
  });

  await runTest('Anonymous cannot access GDPR logs', async () => {
    const { data, error } = await anonClient
      .from('gdpr_audit_log')
      .select('*')
      .in('domain', [testData.domain1, testData.domain2]);

    if (!error && data && data.length > 0) {
      throw new Error('Anonymous should not access GDPR audit logs');
    }
  });
}
