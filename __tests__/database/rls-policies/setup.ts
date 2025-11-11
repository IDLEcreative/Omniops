import { serviceClient } from './clients';

export interface TestData {
  org1Id: string;
  org2Id: string;
  domain1: string;
  domain2: string;
}

export async function setupTestData(): Promise<TestData> {
  console.log('\n🔧 Setting up test data...\n');

  const { data: org1, error: org1Error } = await serviceClient
    .from('organizations')
    .insert({ name: 'Test Org 1', slug: 'test-org-1-rls' })
    .select()
    .single();

  if (org1Error && !org1Error.message.includes('duplicate')) {
    throw new Error(`Failed to create org1: ${org1Error.message}`);
  }

  const { data: org2, error: org2Error } = await serviceClient
    .from('organizations')
    .insert({ name: 'Test Org 2', slug: 'test-org-2-rls' })
    .select()
    .single();

  if (org2Error && !org2Error.message.includes('duplicate')) {
    throw new Error(`Failed to create org2: ${org2Error.message}`);
  }

  const { data: existingOrgs } = await serviceClient
    .from('organizations')
    .select('*')
    .in('slug', ['test-org-1-rls', 'test-org-2-rls']);

  const org1Id = org1?.id || existingOrgs?.find((org) => org.slug === 'test-org-1-rls')?.id;
  const org2Id = org2?.id || existingOrgs?.find((org) => org.slug === 'test-org-2-rls')?.id;

  const domain1 = 'test-org-1.example.com';
  const domain2 = 'test-org-2.example.com';

  await serviceClient.from('customer_configs').upsert(
    [
      { domain: domain1, organization_id: org1Id, business_name: 'Test Org 1' },
      { domain: domain2, organization_id: org2Id, business_name: 'Test Org 2' },
    ],
    { onConflict: 'domain' }
  );

  console.log('✓ Created test organizations and domains');
  console.log(`  Org 1: ${org1Id} (${domain1})`);
  console.log(`  Org 2: ${org2Id} (${domain2})`);

  return { org1Id, org2Id, domain1, domain2 };
}
