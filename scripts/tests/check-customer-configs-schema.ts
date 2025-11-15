import { createServiceRoleClientSync } from '@/lib/supabase/server';

async function checkSchema() {
  const supabase = createServiceRoleClientSync();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    process.exit(1);
  }

  // Query table structure
  const { data, error } = await supabase
    .from('customer_configs')
    .select('*')
    .limit(0);

  console.log('Query result:', { data, error });

  // Try to insert a test record without customer_id
  const testDomain = `test-schema-check-${Date.now()}.example.com`;
  const { data: insertData, error: insertError } = await supabase
    .from('customer_configs')
    .insert({
      domain: testDomain,
      business_name: 'Schema Test'
    })
    .select()
    .single();

  console.log('Insert attempt:', {
    success: !!insertData,
    error: insertError,
    data: insertData
  });

  // Clean up if successful
  if (insertData) {
    await supabase.from('customer_configs').delete().eq('id', insertData.id);
    console.log('Cleanup successful');
  }
}

checkSchema().catch(console.error);
