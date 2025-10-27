import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    },
  }
);

async function test() {
  const testDomain = `test-debug-${Date.now()}.example.com`;

  console.log('Testing insert with domain:', testDomain);
  console.log('Service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

  const { data, error } = await supabase
    .from('customer_configs')
    .insert({
      domain: testDomain,
      business_name: 'Debug Test',
    })
    .select()
    .single();

  console.log('\nResult:');
  console.log('  data:', data);
  console.log('  error:', error);

  if (error) {
    console.error('\nError details:', JSON.stringify(error, null, 2));
  }

  if (data) {
    console.log('\n✅ Insert successful!');
    // Cleanup
    await supabase.from('customer_configs').delete().eq('id', data.id);
    console.log('✅ Cleanup complete');
  } else {
    console.log('\n❌ Insert failed - no data returned');
  }
}

test();
