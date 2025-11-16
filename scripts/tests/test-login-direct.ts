import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔐 Testing login with test credentials...');
  console.log('   Email: test@omniops.test');
  console.log('   Password: test_password_123_secure');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@omniops.test',
    password: 'test_password_123_secure',
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
    console.error('   Error details:', error);
    process.exit(1);
  }

  console.log('✅ Login successful!');
  console.log('   User ID:', data.user.id);
  console.log('   Email:', data.user.email);
  console.log('   Session:', data.session ? 'Active' : 'None');
}

testLogin();
