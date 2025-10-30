import { createServiceRoleClient } from './lib/supabase-server';

async function checkDomain() {
  const client = await createServiceRoleClient();
  const { data, error } = await client
    .from('domains')
    .select('id, domain')
    .eq('domain', 'test.localhost')
    .single();

  if (error) {
    console.log('❌ Domain not found or error:', error.message);
    console.log('\nTo create test domain, run:');
    console.log('  INSERT INTO domains (domain) VALUES (\'test.localhost\');');
  } else {
    console.log('✅ Test domain exists:', data.domain);
    console.log('   ID:', data.id);
  }
}

checkDomain().catch(console.error);
