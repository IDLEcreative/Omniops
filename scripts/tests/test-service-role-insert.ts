import { createServiceRoleClientSync } from '@/lib/supabase/server';

async function testInsert() {
  const supabase = createServiceRoleClientSync();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    process.exit(1);
  }

  console.log('Testing service role insert...');

  // Try insert with explicit service role bypass
  const testDomain = `test-service-${Date.now()}.example.com`;
  const appId = `app_test${Date.now()}${Math.random().toString(36).substring(2, 10)}`;

  console.log('Attempting insert:', { domain: testDomain, appId });

  const { data, error } = await supabase
    .from('customer_configs')
    .insert({
      domain: testDomain,
      business_name: 'Service Role Test',
      app_id: appId
    })
    .select()
    .single();

  console.log('Insert result:', {
    success: !!data,
    data: data ? { id: data.id, domain: data.domain } : null,
    error: error
  });

  // If successful, clean up
  if (data) {
    const { error: deleteError } = await supabase
      .from('customer_configs')
      .delete()
      .eq('id', data.id);

    console.log('Cleanup:', deleteError ? 'FAILED' : 'SUCCESS');
  }
}

testInsert().catch(console.error);
